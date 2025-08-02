import { ObjectId } from "mongodb"
import { connection } from "../config/db.js"
import { Proyecto } from "../models/proyecto.js"

export class ProyectoService {
  static collection = "proyectos"

  // para crear un proyecto
  static async crearProyecto(data) {
    const db = await connection()
    const proyecto = new Proyecto(data)
    const resultado = await db.collection(this.collection).insertOne(proyecto.toDBObject())
    // crea un nuevo objeto con los nuevos datos expandidos dentro de el
    return { id: resultado.insertedId, ...proyecto.toDBObject() }
  }
  //este es para todos los proyectos
  static async listarProyectos({ clienteId, estado } = {}) {
    // espera un arguumento o devuelve un objeto vacio si no los hay
    const db = await connection()

    const filtro = {}
    if (clienteId && clienteId !== "todos") filtro.clienteId = new ObjectId(clienteId)
    if (estado && estado !== "todos") filtro.estado = estado

    return await db.collection(this.collection).find(filtro).sort({ fechaCreacion: -1 }).toArray()
  }

  // ahora para obtener por id - CORREGIDO 
  static async obtenerProyectoPorId(id) {
    const db = await connection()
    return await db.collection(this.collection).findOne({ _id: new ObjectId(id) })
  }

  // para actualizar datos
  static async actualizarProyecto(id, cambios) {
    const db = await connection()
    if (cambios.estado && !["Activo", "Pausado", "Finalizado", "Cancelado"].includes(cambios.estado)) {
      throw new Error("Estado invalido")
    }

    const resultado = await db.collection(this.collection).updateOne({ _id: new ObjectId(id) }, { $set: cambios })
    return { actualizado: resultado.modifiedCount === 1 }
  }

  static async registrarAvance(id, descripcionAvance) {
    const db = await connection()

    const avance = {
      fecha: new Date(),
      descripcion: descripcionAvance,
    }
    const resultado = await db
      .collection(this.collection)
      .updateOne({ _id: new ObjectId(id) }, { $push: { avances: avance } })

    return { avanceRegistrado: resultado.modifiedCount === 1 }
  }

  static async eliminarProyecto(id) {
    const db = await connection()
    const resultado = await db.collection(this.collection).deleteOne({ _id: new ObjectId(id) })

    return { eliminado: resultado.deletedCount === 1 }
  }

  static async crearProyectoDesdePropuesta(propuestaId) {
    const db = await connection()

    // Validar existencia y estado de la propuesta
    const propuesta = await db.collection("propuestas").findOne({
      _id: new ObjectId(propuestaId),
      estado: "Aceptada",
    })

    if (!propuesta) {
      throw new Error("Propuesta no encontrada o no está en estado 'Aceptada'.")
    }

    const proyectoData = {
      clienteId: propuesta.clienteId,
      propuestaId: propuesta._id,
      nombre: propuesta.titulo,
      descripcion: propuesta.descripcion || "",
      fechaInicio: new Date(),
      fechaFin: propuesta.fechaLimite ? new Date(propuesta.fechaLimite) : null,
      valor: propuesta.precio || 0,
      estado: "Activo",
    }

    const nuevoProyecto = new Proyecto(proyectoData)
    const resultado = await db.collection(this.collection).insertOne(nuevoProyecto.toDBObject())

    return {
      id: resultado.insertedId,
      ...nuevoProyecto.toDBObject(),
    }
  }
}
