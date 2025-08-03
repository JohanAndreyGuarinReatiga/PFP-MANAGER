import { ObjectId, Double } from "mongodb"

export class Propuesta {
  constructor({
    clienteId,
    titulo,
    descripcion,
    precio,
    fechaLimite,
    condiciones,
    estado = "Pendiente", 
    numero = null,
  }) {
    if (!clienteId || !ObjectId.isValid(clienteId)) {
      throw new Error("El clienteId es obligatorio y debe ser un ObjectId válido.")
    }
    if (!titulo || typeof titulo !== "string" || titulo.trim().length === 0) {
      throw new Error("El título de la propuesta es obligatorio y debe ser una cadena no vacía.")
    }
    if (!descripcion || typeof descripcion !== "string" || descripcion.trim().length === 0) {
      throw new Error("La descripción de la propuesta es obligatoria y debe ser una cadena no vacía.")
    }
    if (typeof precio !== "number" || precio <= 0) {
      throw new Error("El precio debe ser un número mayor a 0.")
    }
    if (!(fechaLimite instanceof Date) || isNaN(fechaLimite.getTime())) {
      throw new Error("La fecha límite debe ser una fecha válida.")
    }
    if (fechaLimite <= new Date()) {
      throw new Error("La fecha límite debe ser una fecha futura.")
    }
    if (!condiciones || typeof condiciones !== "string" || condiciones.trim().length === 0) {
      throw new Error("Las condiciones de la propuesta son obligatorias.")
    }

    const estadosValidos = ["Pendiente", "Aceptada", "Rechazada"]
    if (!estadosValidos.includes(estado)) {
      throw new Error(`El estado debe ser uno de: ${estadosValidos.join(", ")}`)
    }

    this._id = new ObjectId()
    this.clienteId = new ObjectId(clienteId)
    this.titulo = titulo.trim()
    this.descripcion = descripcion.trim()
    this.precio = precio
    this.fechaLimite = fechaLimite
    this.condiciones = condiciones.trim()
    this.estado = estado
    this.numero = numero || this.#generarNumeroPropuesta()
    this.fechaCreacion = new Date()
    this.fechaActualizacion = new Date()
  }

  #generarNumeroPropuesta() {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, "0")
    const day = String(new Date().getDate()).padStart(2, "0")
    const timestamp = Date.now().toString().slice(-4)
    return `PROP-${year}${month}${day}-${timestamp}`
  }

  // Validar si está vigente
  estaVigente() {
    return this.fechaLimite > new Date() && this.estado === "Pendiente"
  }

  cambiarEstado(nuevoEstado) {
    const estadosValidos = ["Pendiente", "Aceptada", "Rechazada"]
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(`El estado debe ser uno de: ${estadosValidos.join(", ")}`)
    }

    this.estado = nuevoEstado
    this.fechaActualizacion = new Date()
  }

  toDBObject() {
    return {
      _id: new ObjectId(this._id),  // Convertir a ObjectId
      clienteId: this.clienteId,
      titulo: this.titulo,
      descripcion: this.descripcion,
      precio: new Double(this.precio),  // Convertir a Double
      fechaLimite: new Date(this.fechaLimite),  // Asegurar que sea Date
      condiciones: this.condiciones,
      estado: this.estado,
      numero: this.numero,
      fechaCreacion: new Date(this.fechaCreacion),
      fechaActualizacion: new Date(this.fechaActualizacion),
    };
  }
}
