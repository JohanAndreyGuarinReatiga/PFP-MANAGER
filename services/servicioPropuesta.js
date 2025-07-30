import { ObjectId } from "mongodb"
import { Propuesta } from "../models/propuesta.js"

export class ServicioPropuesta {
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

  // Listar clientes disponibles para selección
  async listarClientes() {
    const clientes = await this.db.collection("clientes").find({}).toArray()
    return clientes
  }

  // Crear nueva propuesta
  async crearPropuesta(propuestaData) {
    // Validar que el cliente existe
    const cliente = await this.validarClienteExiste(propuestaData.clienteId)

    // Convertir fecha string a Date si es necesario
    if (typeof propuestaData.fechaLimite === "string") {
      propuestaData.fechaLimite = new Date(propuestaData.fechaLimite)
    }

    // Crear la propuesta
    const propuesta = new Propuesta({
      clienteId: propuestaData.clienteId,
      titulo: propuestaData.titulo,
      descripcion: propuestaData.descripcion,
      precio: Number.parseFloat(propuestaData.precio),
      fechaLimite: propuestaData.fechaLimite,
      condiciones: propuestaData.condiciones,
    })

    // Insertar en la base de datos
    const resultado = await this.db.collection("propuestas").insertOne(propuesta.toDBObject())

    return {
      ...propuesta.toDBObject(),
      _id: resultado.insertedId,
      cliente: {
        nombre: cliente.nombre,
        correo: cliente.correo,
      },
    }
  }

  // Buscar propuesta por ID
  async buscarPropuestaPorId(propuestaId) {
    const propuesta = await this.db.collection("propuestas").findOne({
      _id: new ObjectId(propuestaId),
    })
    if (!propuesta) {
      throw new Error(`Propuesta con ID ${propuestaId} no encontrada`)
    }
    return propuesta
  }

  // Listar propuestas con información de cliente
  async listarPropuestas(opciones = {}) {
    const {
      filtroEstado = null,
      filtroCliente = null,
      ordenarPor = "fechaCreacion",
      orden = -1, // -1 para descendente (más reciente primero), 1 para ascendente
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

    // Ordenar
    const sortObj = {}
    sortObj[ordenarPor] = orden
    pipeline.push({ $sort: sortObj })

    // Contar total de documentos (antes de paginación)
    const countPipeline = [...pipeline, { $count: "total" }]
    const countResult = await this.db.collection("propuestas").aggregate(countPipeline).toArray()
    const total = countResult.length > 0 ? countResult[0].total : 0

    // Aplicar paginación
    const skip = (pagina - 1) * limite
    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: limite })

    // Ejecutar consulta
    const propuestas = await this.db.collection("propuestas").aggregate(pipeline).toArray()

    // Calcular información de paginación
    const totalPaginas = Math.ceil(total / limite)
    const tieneSiguiente = pagina < totalPaginas
    const tieneAnterior = pagina > 1

    return {
      propuestas,
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

  // Obtener estadísticas de propuestas
  async obtenerEstadisticas() {
    const estadisticas = await this.db
      .collection("propuestas")
      .aggregate([
        {
          $group: {
            _id: "$estado",
            count: { $sum: 1 },
            totalValor: { $sum: "$precio" },
          },
        },
      ])
      .toArray()

    const resultado = {
      Pendiente: { count: 0, totalValor: 0 },
      Aceptada: { count: 0, totalValor: 0 },
      Rechazada: { count: 0, totalValor: 0 },
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
}
