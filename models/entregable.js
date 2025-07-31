import { ObjectId } from "mongodb"

export class Entregable {
  constructor({
    proyectoId,
    nombre,
    descripcion,
    fechaLimite,
    estado = "Pendiente",
    fechaEntrega = null,
    observaciones = "",
    orden = 1,
  }) {
    // Validaciones
    if (!proyectoId || !ObjectId.isValid(proyectoId)) {
      throw new Error("El proyectoId es obligatorio y debe ser un ObjectId válido.")
    }
    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
      throw new Error("El nombre del entregable es obligatorio y debe ser una cadena no vacía.")
    }
    if (!descripcion || typeof descripcion !== "string" || descripcion.trim().length === 0) {
      throw new Error("La descripción del entregable es obligatoria y debe ser una cadena no vacía.")
    }
    if (!(fechaLimite instanceof Date) || isNaN(fechaLimite.getTime())) {
      throw new Error("La fecha límite debe ser una fecha válida.")
    }
    if (fechaLimite <= new Date()) {
      throw new Error("La fecha límite debe ser una fecha futura.")
    }

    const estadosValidos = ["Pendiente", "En Progreso", "Entregado", "Aprobado", "Rechazado"]
    if (!estadosValidos.includes(estado)) {
      throw new Error(`El estado debe ser uno de: ${estadosValidos.join(", ")}`)
    }

    if (fechaEntrega && (!(fechaEntrega instanceof Date) || isNaN(fechaEntrega.getTime()))) {
      throw new Error("La fecha de entrega debe ser una fecha válida o null.")
    }

    if (typeof orden !== "number" || orden < 1) {
      throw new Error("El orden debe ser un número mayor a 0.")
    }

    this._id = new ObjectId()
    this.proyectoId = new ObjectId(proyectoId)
    this.nombre = nombre.trim()
    this.descripcion = descripcion.trim()
    this.fechaLimite = fechaLimite
    this.estado = estado
    this.fechaEntrega = fechaEntrega
    this.observaciones = observaciones.trim()
    this.orden = orden
    this.fechaCreacion = new Date()
    this.fechaActualizacion = new Date()
  }

  // Validar que la fecha límite esté dentro del rango del proyecto
  async validarFechasConProyecto(db) {
    const proyecto = await db.collection("proyectos").findOne({ _id: this.proyectoId })
    if (!proyecto) {
      throw new Error("Proyecto no encontrado")
    }

    const errors = []
    
    // La fecha límite no puede ser anterior al inicio del proyecto
    if (this.fechaLimite < new Date(proyecto.fechaInicio)) {
      errors.push("La fecha límite del entregable no puede ser anterior al inicio del proyecto")
    }

    // Si el proyecto tiene fecha de fin, la fecha límite no puede ser posterior
    if (proyecto.fechaFin && this.fechaLimite > new Date(proyecto.fechaFin)) {
      errors.push("La fecha límite del entregable no puede ser posterior al fin del proyecto")
    }

    return { errors, proyecto }
  }

  // Cambiar estado del entregable
  cambiarEstado(nuevoEstado, observaciones = "") {
    const estadosValidos = ["Pendiente", "En Progreso", "Entregado", "Aprobado", "Rechazado"]
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(`El estado debe ser uno de: ${estadosValidos.join(", ")}`)
    }

    // Validaciones de transición de estados
    if (this.estado === "Aprobado" && nuevoEstado !== "Aprobado") {
      throw new Error("No se puede cambiar el estado de un entregable ya aprobado")
    }

    this.estado = nuevoEstado
    this.observaciones = observaciones.trim()
    this.fechaActualizacion = new Date()

    // Si se marca como entregado, registrar fecha de entrega
    if (nuevoEstado === "Entregado" && !this.fechaEntrega) {
      this.fechaEntrega = new Date()
    }
  }

  // Verificar si está atrasado
  estaAtrasado() {
    return this.fechaLimite < new Date() && !["Entregado", "Aprobado"].includes(this.estado)
  }

  // Calcular días restantes
  diasRestantes() {
    const ahora = new Date()
    const diferencia = this.fechaLimite.getTime() - ahora.getTime()
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24))
  }

  // Obtener color por estado
  getEstadoConColor() {
    const colores = {
      Pendiente: "yellow",
      "En Progreso": "blue",
      Entregado: "cyan",
      Aprobado: "green",
      Rechazado: "red",
    }
    return { estado: this.estado, color: colores[this.estado] || "white" }
  }

  toDBObject() {
    return {
      _id: this._id,
      proyectoId: this.proyectoId,
      nombre: this.nombre,
      descripcion: this.descripcion,
      fechaLimite: this.fechaLimite,
      estado: this.estado,
      fechaEntrega: this.fechaEntrega,
      observaciones: this.observaciones,
      orden: this.orden,
      fechaCreacion: this.fechaCreacion,
      fechaActualizacion: this.fechaActualizacion,
    }
  }

  static fromDBObject(obj) {
    const entregable = new Entregable({
      proyectoId: obj.proyectoId,
      nombre: obj.nombre,
      descripcion: obj.descripcion,
      fechaLimite: obj.fechaLimite,
      estado: obj.estado,
      fechaEntrega: obj.fechaEntrega,
      observaciones: obj.observaciones || "",
      orden: obj.orden || 1,
    })
    entregable._id = obj._id
    entregable.fechaCreacion = obj.fechaCreacion
    entregable.fechaActualizacion = obj.fechaActualizacion
    return entregable
  }
}
