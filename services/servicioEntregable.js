import { ObjectId } from "mongodb"
import { connection } from "../config/db.js"
import { Entregable } from "../models/entregable.js"

export class EntregableService {
  static collection = "entregables"
  static proyectoCollection = "proyectos"

  static async crearEntregable(data) {
    const db = await connection()

    // Validar proyecto existente
    const proyecto = await db.collection(this.proyectoCollection).findOne({ _id: new ObjectId(data.proyectoId) })
    if (!proyecto) throw new Error("Proyecto no encontrado")

    // Validar fecha límite dentro del rango del proyecto
    const fechaLimite = new Date(data.fechaLimite)
    if (fechaLimite < new Date(proyecto.fechaInicio) || fechaLimite > new Date(proyecto.fechaFin)) {
      throw new Error("La fecha límite del entregable debe estar dentro del rango del proyecto.")
    }

    const entregable = new Entregable(data)
    const resultado = await db.collection(this.collection).insertOne(entregable.toDBObject())
    return { id: resultado.insertedId, ...entregable }
  }

  static async cambiarEstado(id, nuevoEstado) {
    const db = await connection()
    const session = db.client.startSession()

    try {
      await session.withTransaction(async () => {
        const entregables = db.collection(this.collection)
        const proyectos = db.collection(this.proyectoCollection)

        const doc = await entregables.findOne({ _id: new ObjectId(id) }, { session })
        if (!doc) throw new Error("Entregable no encontrado")

        // Validar que el nuevo estado sea válido
        const estadosValidos = ["Pendiente", "En progreso", "Entregado", "Aprobado", "Rechazado"]
        if (!estadosValidos.includes(nuevoEstado)) {
          throw new Error(`Estado inválido. Valores permitidos: ${estadosValidos.join(", ")}`)
        }

        // Preparar los datos de actualización
        const datosActualizacion = {
          estado: nuevoEstado,
        }

        // Si el estado es "Entregado" o "Aprobado", establecer fecha de entrega
        if (["Entregado", "Aprobado"].includes(nuevoEstado)) {
          datosActualizacion.fechaEntrega = new Date()
        }

        // Actualizar entregable
        await entregables.updateOne({ _id: new ObjectId(id) }, { $set: datosActualizacion }, { session })

        // Si el entregable cambia a estado final, actualizar progreso del proyecto
        const estadosFinales = ["Aprobado", "Rechazado", "Entregado"]
        if (estadosFinales.includes(nuevoEstado)) {
          const entregablesProyecto = await entregables.find({ proyectoId: doc.proyectoId }, { session }).toArray()

          const total = entregablesProyecto.length
          const completados = entregablesProyecto.filter((e) => ["Aprobado", "Entregado"].includes(e.estado)).length

          const progreso = Math.round((completados / total) * 100)

          await proyectos.updateOne({ _id: doc.proyectoId }, { $set: { progreso } }, { session })
        }
      })

      return { success: true, nuevoEstado }
    } catch (error) {
      await session.abortTransaction()
      throw new Error("Error al cambiar estado: " + error.message)
    } finally {
      await session.endSession()
    }
  }

  static async eliminarEntregable(id) {
    const db = await connection()
    const resultado = await db.collection(this.collection).deleteOne({ _id: new ObjectId(id) })
    return { eliminado: resultado.deletedCount === 1 }
  }

  static async listarPorProyecto(proyectoId) {
    const db = await connection()
    return db
      .collection(this.collection)
      .find({ proyectoId: new ObjectId(proyectoId) })
      .toArray()
  }
}
