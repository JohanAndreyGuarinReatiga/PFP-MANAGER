import { ObjectId } from "mongodb"
import { Entregable } from "../models/entregable.js"

export class ServicioEntregable {
  constructor(db) {
    this.db = db
  }

  // Validar que el proyecto existe
  async validarProyectoExiste(proyectoId) {
    const proyecto = await this.db.collection("proyectos").findOne({
      _id: new ObjectId(proyectoId),
    })
    if (!proyecto) {
      throw new Error(`Proyecto con ID ${proyectoId} no encontrado`)
    }
    return proyecto
  }

  // Listar proyectos activos para selección
  async listarProyectosActivos() {
    const proyectos = await this.db
      .collection("proyectos")
      .aggregate([
        { $match: { estado: { $in: ["Activo", "Pausado"] } } },
        {
          $lookup: {
            from: "clientes",
            localField: "clienteId",
            foreignField: "_id",
            as: "cliente",
          },
        },
        { $unwind: "$cliente" },
        { $sort: { fechaCreacion: -1 } },
      ])
      .toArray()

    return proyectos
  }

  // Crear nuevo entregable
  async crearEntregable(entregableData) {
    // Validar que el proyecto existe
    const proyecto = await this.validarProyectoExiste(entregableData.proyectoId)

    // Convertir fecha string a Date si es necesario
    if (typeof entregableData.fechaLimite === "string") {
      entregableData.fechaLimite = new Date(entregableData.fechaLimite)
    }

    // Obtener el siguiente número de orden
    const ultimoEntregable = await this.db
      .collection("entregables")
      .findOne({ proyectoId: new ObjectId(entregableData.proyectoId) }, { sort: { orden: -1 } })

    const siguienteOrden = ultimoEntregable ? ultimoEntregable.orden + 1 : 1

    // Crear el entregable
    const entregable = new Entregable({
      proyectoId: entregableData.proyectoId,
      nombre: entregableData.nombre,
      descripcion: entregableData.descripcion,
      fechaLimite: entregableData.fechaLimite,
      observaciones: entregableData.observaciones || "",
      orden: siguienteOrden,
    })

    // Validar fechas con el proyecto
    const { errors } = await entregable.validarFechasConProyecto(this.db)
    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(", ")}`)
    }

    // Insertar en la base de datos
    const resultado = await this.db.collection("entregables").insertOne(entregable.toDBObject())

    return {
      ...entregable.toDBObject(),
      _id: resultado.insertedId,
      proyecto: {
        nombre: proyecto.nombre,
        codigoProyecto: proyecto.codigoProyecto,
      },
    }
  }

  // Listar entregables de un proyecto
  async listarEntregablesPorProyecto(proyectoId) {
    const entregables = await this.db
      .collection("entregables")
      .find({ proyectoId: new ObjectId(proyectoId) })
      .sort({ orden: 1 })
      .toArray()

    return entregables
  }

  // Listar todos los entregables con información del proyecto
  async listarEntregables(opciones = {}) {
    const {
      filtroEstado = null,
      filtroProyecto = null,
      soloAtrasados = false,
      ordenarPor = "fechaLimite",
      orden = 1, // 1 para ascendente (más próximos primero), -1 para descendente
      pagina = 1,
      limite = 10,
    } = opciones

    // Construir filtros
    const filtros = {}

    if (filtroEstado && filtroEstado !== "todos") {
      filtros.estado = filtroEstado
    }

    if (filtroProyecto && filtroProyecto !== "todos") {
      filtros.proyectoId = new ObjectId(filtroProyecto)
    }

    if (soloAtrasados) {
      filtros.fechaLimite = { $lt: new Date() }
      filtros.estado = { $nin: ["Entregado", "Aprobado"] }
    }

    // Pipeline de agregación
    const pipeline = []

    // Aplicar filtros
    if (Object.keys(filtros).length > 0) {
      pipeline.push({ $match: filtros })
    }

    // Hacer lookup con proyectos
    pipeline.push({
      $lookup: {
        from: "proyectos",
        localField: "proyectoId",
        foreignField: "_id",
        as: "proyecto",
      },
    })

    pipeline.push({
      $unwind: "$proyecto",
    })

    // Hacer lookup con clientes
    pipeline.push({
      $lookup: {
        from: "clientes",
        localField: "proyecto.clienteId",
        foreignField: "_id",
        as: "cliente",
      },
    })

    pipeline.push({
      $unwind: "$cliente",
    })

    // Ordenar
    const sortObj = {}
    sortObj[ordenarPor] = orden
    pipeline.push({ $sort: sortObj })

    // Contar total de documentos (antes de paginación)
    const countPipeline = [...pipeline, { $count: "total" }]
    const countResult = await this.db.collection("entregables").aggregate(countPipeline).toArray()
    const total = countResult.length > 0 ? countResult[0].total : 0

    // Aplicar paginación
    const skip = (pagina - 1) * limite
    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: limite })

    // Ejecutar consulta
    const entregables = await this.db.collection("entregables").aggregate(pipeline).toArray()

    // Calcular información de paginación
    const totalPaginas = Math.ceil(total / limite)
    const tieneSiguiente = pagina < totalPaginas
    const tieneAnterior = pagina > 1

    return {
      entregables,
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

  // Cambiar estado de entregable
  async cambiarEstadoEntregable(entregableId, nuevoEstado, observaciones = "") {
    const entregableDB = await this.db.collection("entregables").findOne({
      _id: new ObjectId(entregableId),
    })

    if (!entregableDB) {
      throw new Error(`Entregable con ID ${entregableId} no encontrado`)
    }

    const entregable = Entregable.fromDBObject(entregableDB)
    entregable.cambiarEstado(nuevoEstado, observaciones)

    await this.db
      .collection("entregables")
      .updateOne({ _id: new ObjectId(entregableId) }, { $set: entregable.toDBObject() })

    return entregable.toDBObject()
  }

  // Obtener estadísticas de entregables
  async obtenerEstadisticas() {
    const estadisticas = await this.db
      .collection("entregables")
      .aggregate([
        {
          $group: {
            _id: "$estado",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    // Contar entregables atrasados
    const atrasados = await this.db
      .collection("entregables")
      .countDocuments({
        fechaLimite: { $lt: new Date() },
        estado: { $nin: ["Entregado", "Aprobado"] },
      })

    const resultado = {
      Pendiente: { count: 0 },
      "En Progreso": { count: 0 },
      Entregado: { count: 0 },
      Aprobado: { count: 0 },
      Rechazado: { count: 0 },
      Atrasados: { count: atrasados },
    }

    estadisticas.forEach((stat) => {
      if (resultado[stat._id]) {
        resultado[stat._id] = { count: stat.count }
      }
    })

    return resultado
  }

  // Buscar entregable por ID
  async buscarEntregablePorId(entregableId) {
    const entregable = await this.db
      .collection("entregables")
      .aggregate([
        { $match: { _id: new ObjectId(entregableId) } },
        {
          $lookup: {
            from: "proyectos",
            localField: "proyectoId",
            foreignField: "_id",
            as: "proyecto",
          },
        },
        { $unwind: "$proyecto" },
        {
          $lookup: {
            from: "clientes",
            localField: "proyecto.clienteId",
            foreignField: "_id",
            as: "cliente",
          },
        },
        { $unwind: "$cliente" },
      ])
      .toArray()

    if (entregable.length === 0) {
      throw new Error(`Entregable con ID ${entregableId} no encontrado`)
    }

    return entregable[0]
  }
}
