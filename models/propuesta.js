import { ObjectId } from "mongodb"

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

  // Método para obtener color por estado
  getEstadoConColor() {
    const colores = {
      Pendiente: "yellow",
      Aceptada: "green",
      Rechazada: "red",
    }
    return { estado: this.estado, color: colores[this.estado] || "white" }
  }

  // Cambiar estado
  cambiarEstado(nuevoEstado) {
    const estadosValidos = ["Pendiente", "Aceptada", "Rechazada"]
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(`El estado debe ser uno de: ${estadosValidos.join(", ")}`)
    }
    this.estado = nuevoEstado
    this.fechaActualizacion = new Date()
  }

  // Validar si está vigente
  estaVigente() {
    return this.fechaLimite > new Date() && this.estado === "Pendiente"
  }

  toDBObject() {
    return {
      _id: this._id,
      clienteId: this.clienteId,
      titulo: this.titulo,
      descripcion: this.descripcion,
      precio: this.precio,
      fechaLimite: this.fechaLimite,
      condiciones: this.condiciones,
      estado: this.estado,
      numero: this.numero,
      fechaCreacion: this.fechaCreacion,
      fechaActualizacion: this.fechaActualizacion,
    }
  }

  static fromDBObject(obj) {
    const propuesta = new Propuesta({
      clienteId: obj.clienteId,
      titulo: obj.titulo,
      descripcion: obj.descripcion,
      precio: obj.precio,
      fechaLimite: obj.fechaLimite,
      condiciones: obj.condiciones,
      estado: obj.estado,
      numero: obj.numero,
    })
    propuesta._id = obj._id
    propuesta.fechaCreacion = obj.fechaCreacion
    propuesta.fechaActualizacion = obj.fechaActualizacion
    return propuesta
  }
}
