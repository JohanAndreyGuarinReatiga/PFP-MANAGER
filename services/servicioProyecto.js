import { ObjectId } from "mongodb"
import { Proyecto } from "../models/proyecto.js"
import { Contrato } from "../models/contrato.js"

export class ServicioProyecto {
  constructor(db) {
    this.db = db
  }

  // Validar que el cliente existe
  async validarClienteExiste(clienteId) {
    const cliente = await this.db.collection("clientes").findOne({
      _id: new ObjectId(clienteId),
    })
    if (!cliente) {
      throw new Error(`Cliente con ID ${clienteId} no encontrado`)
    }
    return cliente
  }

  // Crear proyecto manualmente
  async crearProyecto(proyectoData) {
    // Validar que el cliente existe
    await this.validarClienteExiste(proyectoData.clienteId)

    // Convertir fechas string a Date si es necesario
    if (typeof proyectoData.fechaInicio === "string") {
      proyectoData.fechaInicio = new Date(proyectoData.fechaInicio)
    }
    if (proyectoData.fechaFin && typeof proyectoData.fechaFin === "string") {
      proyectoData.fechaFin = new Date(proyectoData.fechaFin)
    }

    const proyecto = new Proyecto({
      clienteId: proyectoData.clienteId,
      nombre: proyectoData.nombre,
      descripcion: proyectoData.descripcion || "",
      fechaInicio: proyectoData.fechaInicio,
      fechaFin: proyectoData.fechaFin,
      valor: Number.parseFloat(proyectoData.valor) || 0,
    })

    const resultado = await this.db.collection("proyectos").insertOne(proyecto.toDBObject())
    return { ...proyecto.toDBObject(), _id: resultado.insertedId }
  }

  // Crear proyecto desde propuesta aceptada
  async crearProyectoPorPropuesta(propuestaId, clienteId) {
    // Validar que el cliente existe
    await this.validarClienteExiste(clienteId)

    // Buscar la propuesta
    const propuesta = await this.db.collection("propuestas").findOne({
      _id: new ObjectId(propuestaId),
    })
    if (!propuesta) {
      throw new Error(`Propuesta con ID ${propuestaId} no encontrada`)
    }

    // Verificar que la propuesta esté aceptada
    if (propuesta.estado !== "aceptada") {
      throw new Error("Solo se pueden crear proyectos desde propuestas aceptadas")
    }

    // Crear proyecto heredando datos relevantes de la propuesta
    const proyecto = Proyecto.crearDesdePropuesta(propuesta, clienteId)

    const resultado = await this.db.collection("proyectos").insertOne(proyecto.toDBObject())
    return { ...proyecto.toDBObject(), _id: resultado.insertedId }
  }

  // Generar contrato para un proyecto
  async generarContrato(contratoData) {
    // Validar que el proyecto existe
    const proyecto = await this.db.collection("proyectos").findOne({
      _id: new ObjectId(contratoData.proyectoId),
    })
    if (!proyecto) {
      throw new Error(`Proyecto con ID ${contratoData.proyectoId} no encontrado`)
    }

    // Convertir fechas string a Date si es necesario
    if (typeof contratoData.fechaInicio === "string") {
      contratoData.fechaInicio = new Date(contratoData.fechaInicio)
    }
    if (typeof contratoData.fechaFin === "string") {
      contratoData.fechaFin = new Date(contratoData.fechaFin)
    }

    const contrato = new Contrato({
      proyectoId: contratoData.proyectoId,
      condiciones: contratoData.condiciones,
      fechaInicio: contratoData.fechaInicio,
      fechaFin: contratoData.fechaFin,
      valorTotal: Number.parseFloat(contratoData.valorTotal),
      terminosPago: contratoData.terminosPago,
    })

    // Validar el contrato
    const erroresValidacion = contrato.validate()
    if (erroresValidacion.length > 0) {
      throw new Error(`Errores de validación: ${erroresValidacion.join(", ")}`)
    }

    const erroresFechas = await contrato.validarFechasConProyecto(this.db)
    if (erroresFechas.length > 0) {
      throw new Error(`Errores de fechas: ${erroresFechas.join(", ")}`)
    }

    const resultado = await this.db.collection("contratos").insertOne(contrato.toDBObject())

    await this.db
      .collection("proyectos")
      .updateOne({ _id: new ObjectId(contratoData.proyectoId) }, { $set: { contratoId: resultado.insertedId } })

    return { ...contrato.toDBObject(), _id: resultado.insertedId }
  }

  async listarProyectos() {
    const proyectos = await this.db
      .collection("proyectos")
      .aggregate([
        {
          $lookup: {
            from: "clientes",
            localField: "clienteId",
            foreignField: "_id",
            as: "cliente",
          },
        },
        {
          $unwind: "$cliente",
        },
      ])
      .toArray()

    return proyectos
  }

  // Calcular progreso del proyecto
  calcularProgreso(proyecto) {
    let progreso = 0
    let factores = 0

    // Factor 1: Progreso temporal (40% del peso)
    if (proyecto.fechaInicio && proyecto.fechaFin) {
      const ahora = new Date()
      const inicio = new Date(proyecto.fechaInicio)
      const fin = new Date(proyecto.fechaFin)

      if (ahora >= inicio) {
        const tiempoTotal = fin.getTime() - inicio.getTime()
        const tiempoTranscurrido = Math.min(ahora.getTime() - inicio.getTime(), tiempoTotal)
        const progresoTemporal = (tiempoTranscurrido / tiempoTotal) * 100
        progreso += progresoTemporal * 0.4
        factores += 0.4
      }
    }

    // Factor 2: Avances registrados (60% del peso)
    if (proyecto.avances && proyecto.avances.length > 0) {
      // Asumimos que cada avance representa progreso
      // Máximo 10 avances = 100% de este factor
      const progresoAvances = Math.min((proyecto.avances.length / 10) * 100, 100)
      progreso += progresoAvances * 0.6
      factores += 0.6
    }

    // Si el proyecto está finalizado, progreso = 100%
    if (proyecto.estado === "Finalizado") {
      return 100
    }

    // Si el proyecto está cancelado, mantener el progreso actual
    if (proyecto.estado === "Cancelado") {
      return Math.round(progreso / (factores || 1))
    }

    // Normalizar el progreso basado en los factores disponibles
    return factores > 0 ? Math.round(progreso / factores) : 0
  }

  // Listar proyectos con filtros y ordenamiento
  async listarProyectosCompleto(opciones = {}) {
    const {
      filtroEstado = null,
      filtroCliente = null,
      ordenarPor = "fechaInicio",
      orden = -1, // -1 para descendente, 1 para ascendente
      pagina = 1,
      limite = 10,
    } = opciones

    // Construir filtros
    const filtros = {}

    if (filtroEstado && filtroEstado !== "todos") {
      filtros.estado = filtroEstado
    }

    if (filtroCliente && filtroCliente !== "todos") {
      filtros.clienteId = new ObjectId(filtroCliente)
    }

    // Pipeline de agregación
    const pipeline = []

    // Aplicar filtros
    if (Object.keys(filtros).length > 0) {
      pipeline.push({ $match: filtros })
    }

    // Hacer lookup con clientes
    pipeline.push({
      $lookup: {
        from: "clientes",
        localField: "clienteId",
        foreignField: "_id",
        as: "cliente",
      },
    })

    pipeline.push({
      $unwind: "$cliente",
    })

    // Hacer lookup con contratos (opcional)
    pipeline.push({
      $lookup: {
        from: "contratos",
        localField: "contratoId",
        foreignField: "_id",
        as: "contrato",
      },
    })

    // Ordenar
    const sortObj = {}
    sortObj[ordenarPor] = orden
    pipeline.push({ $sort: sortObj })

    // Contar total de documentos (antes de paginación)
    const countPipeline = [...pipeline, { $count: "total" }]
    const countResult = await this.db.collection("proyectos").aggregate(countPipeline).toArray()
    const total = countResult.length > 0 ? countResult[0].total : 0

    // Aplicar paginación
    const skip = (pagina - 1) * limite
    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: limite })

    // Ejecutar consulta
    const proyectos = await this.db.collection("proyectos").aggregate(pipeline).toArray()

    // Calcular progreso para cada proyecto
    const proyectosConProgreso = proyectos.map((proyecto) => ({
      ...proyecto,
      progreso: this.calcularProgreso(proyecto),
    }))

    // Calcular información de paginación
    const totalPaginas = Math.ceil(total / limite)
    const tieneSiguiente = pagina < totalPaginas
    const tieneAnterior = pagina > 1

    return {
      proyectos: proyectosConProgreso,
      paginacion: {
        paginaActual: pagina,
        totalPaginas,
        total,
        limite,
        tieneSiguiente,
        tieneAnterior,
      },
    }
  }

  // Obtener estadísticas de proyectos
  async obtenerEstadisticasProyectos() {
    const estadisticas = await this.db
      .collection("proyectos")
      .aggregate([
        {
          $group: {
            _id: "$estado",
            count: { $sum: 1 },
            totalValor: { $sum: "$valor" },
          },
        },
      ])
      .toArray()

    const resultado = {
      Activo: { count: 0, totalValor: 0 },
      Pausado: { count: 0, totalValor: 0 },
      Finalizado: { count: 0, totalValor: 0 },
      Cancelado: { count: 0, totalValor: 0 },
    }

    estadisticas.forEach((stat) => {
      if (resultado[stat._id]) {
        resultado[stat._id] = {
          count: stat.count,
          totalValor: stat.totalValor,
        }
      }
    })

    return resultado
  }

  // Listar clientes para filtros
  async listarClientesConProyectos() {
    const clientes = await this.db
      .collection("proyectos")
      .aggregate([
        {
          $lookup: {
            from: "clientes",
            localField: "clienteId",
            foreignField: "_id",
            as: "cliente",
          },
        },
        { $unwind: "$cliente" },
        {
          $group: {
            _id: "$cliente._id",
            nombre: { $first: "$cliente.nombre" },
            empresa: { $first: "$cliente.empresa" },
            totalProyectos: { $sum: 1 },
          },
        },
        { $sort: { nombre: 1 } },
      ])
      .toArray()

    return clientes
  }
}
