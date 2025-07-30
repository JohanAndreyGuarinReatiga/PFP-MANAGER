import { ObjectId } from "mongodb"
import { Propuesta } from "../models/propuesta.js"

class ServicioPropuesta {
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
  async listarPropuestas(filtros = {}) {
    const pipeline = [
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
    ]

    // Agregar filtros si existen
    if (Object.keys(filtros).length > 0) {
      pipeline.unshift({ $match: filtros })
    }

    const propuestas = await this.db.collection("propuestas").aggregate(pipeline).toArray()

    return propuestas
  }
}

module.exports = ServicioPropuesta
