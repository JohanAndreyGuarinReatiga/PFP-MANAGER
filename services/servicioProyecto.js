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
}
