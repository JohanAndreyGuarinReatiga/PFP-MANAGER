import { ObjectId } from "mongodb"

export class Proyecto {
  constructor({
    clienteId,
    propuestaId = null,
    contratoId = null,
    nombre,
    descripcion = "",
    fechaInicio = new Date(),
    fechaFin = null,
    valor = 0,
    estado = "activo",
    codigoProyecto = null,
    avances = [],
  }) {
    if (!clienteId || !ObjectId.isValid(clienteId)) {
      throw new Error("El clienteId es obligatorio y debe ser un ObjectId válido.")
    }
    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
      throw new Error("El nombre del proyecto es obligatorio y debe ser una cadena no vacía.")
    }
    if (typeof descripcion !== "string") {
      throw new Error("La descripción debe ser una cadena.")
    }
    if (!(fechaInicio instanceof Date) || isNaN(fechaInicio.getTime())) {
      throw new Error("La fecha de inicio debe ser una fecha válida.")
    }
    if (fechaFin && (!(fechaFin instanceof Date) || isNaN(fechaFin.getTime()))) {
      throw new Error("La fecha de fin debe ser una fecha válida o null.")
    }
    if (fechaFin && fechaFin <= fechaInicio) {
      throw new Error("La fecha de fin debe ser posterior a la fecha de inicio.")
    }
    if (typeof valor !== "number" || valor < 0) {
      throw new Error("El valor debe ser un número mayor o igual a 0.")
    }

    const estadosValidos = ["activo", "pausado", "finalizado", "cancelado"]
    if (!estadosValidos.includes(estado)) {
      throw new Error(`El estado debe ser uno de: ${estadosValidos.join(", ")}`)
    }
    if (propuestaId && !ObjectId.isValid(propuestaId)) {
      throw new Error("El propuestaId debe ser un ObjectId válido o null.")
    }
    if (contratoId && !ObjectId.isValid(contratoId)) {
      throw new Error("El contratoId debe ser un ObjectId válido o null.")
    }

    this._id = new ObjectId()
    this.clienteId = new ObjectId(clienteId)
    this.propuestaId = propuestaId ? new ObjectId(propuestaId) : null
    this.contratoId = contratoId ? new ObjectId(contratoId) : null
    this.nombre = nombre.trim()
    this.descripcion = descripcion.trim()
    this.fechaInicio = fechaInicio
    this.fechaFin = fechaFin
    this.valor = valor
    this.estado = estado
    this.codigoProyecto = codigoProyecto || this.#generarCodigoProyecto()
    this.avances = Array.isArray(avances) ? avances : []
    this.fechaCreacion = new Date()
  }

  #generarCodigoProyecto() {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `PROJ-${timestamp}-${random}`
  }

  agregarAvance(descripcion) {
    if (!descripcion || typeof descripcion !== "string") {
      throw new Error("La descripción del avance es obligatoria.")
    }
    this.avances.push({
      fecha: new Date(),
      descripcion: descripcion.trim(),
    })
  }

  cambiarEstado(nuevoEstado) {
    const estadosValidos = ["activo", "pausado", "finalizado", "cancelado"]
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(`El estado debe ser uno de: ${estadosValidos.join(", ")}`)
    }
    this.estado = nuevoEstado
  }

  toDBObject() {
    return {
      _id: this._id,
      clienteId: this.clienteId,
      propuestaId: this.propuestaId,
      contratoId: this.contratoId,
      nombre: this.nombre,
      descripcion: this.descripcion,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      valor: this.valor,
      estado: this.estado,
      codigoProyecto: this.codigoProyecto,
      avances: this.avances,
      fechaCreacion: this.fechaCreacion,
    }
  }

  static fromDBObject(obj) {
    return new Proyecto({
      clienteId: obj.clienteId,
      propuestaId: obj.propuestaId,
      contratoId: obj.contratoId,
      nombre: obj.nombre,
      descripcion: obj.descripcion,
      fechaInicio: obj.fechaInicio,
      fechaFin: obj.fechaFin,
      valor: obj.valor,
      estado: obj.estado,
      codigoProyecto: obj.codigoProyecto,
      avances: obj.avances || [],
    })
  }
}
