import { ObjectId } from "mongodb"

export class Contrato {
  constructor(data) {
    this._id = data._id || new ObjectId()
    this.numero = data.numero || this.generateNumero()
    this.proyectoId = data.proyectoId
    this.condiciones = data.condiciones
    this.fechaInicio = data.fechaInicio
    this.fechaFin = data.fechaFin
    this.valorTotal = data.valorTotal
    this.terminosPago = data.terminosPago 
    this.estado = data.estado || "borrador"
    this.fechaFirma = data.fechaFirma
    this.fechaCreacion = data.fechaCreacion || new Date()
    this.fechaActualizacion = new Date()
  }

  validate() {
    const errors = []
    if (!this.proyectoId || !ObjectId.isValid(this.proyectoId)) {
      errors.push("El contrato debe estar asociado a un proyecto válido")
    }
    if (!this.condiciones || this.condiciones.trim().length < 10) {
      errors.push("Las condiciones deben tener al menos 10 caracteres")
    }
    if (!this.fechaInicio) {
      errors.push("La fecha de inicio es requerida")
    }
    if (!this.fechaFin) {
      errors.push("La fecha de fin es requerida")
    }
    if (this.fechaInicio && this.fechaFin && new Date(this.fechaInicio) >= new Date(this.fechaFin)) {
      errors.push("La fecha de inicio debe ser anterior a la fecha de fin")
    }
    if (!this.valorTotal || this.valorTotal <= 0) {
      errors.push("El valor total debe ser mayor a 0")
    }
    if (!this.terminosPago || this.terminosPago.trim().length < 5) {
      errors.push("Los términos de pago son requeridos")
    }
    if (!["borrador", "firmado", "cancelado"].includes(this.estado)) {
      errors.push("Estado de contrato inválido")
    }
    return errors
  }

  async validarFechasConProyecto(db) {
    const proyecto = await db.collection("proyectos").findOne({ _id: new ObjectId(this.proyectoId) })
    if (!proyecto) {
      throw new Error("Proyecto no encontrado")
    }

    const errors = []
    if (new Date(this.fechaInicio) < new Date(proyecto.fechaInicio)) {
      errors.push("La fecha de inicio del contrato no puede ser anterior a la del proyecto")
    }
    if (proyecto.fechaFin && new Date(this.fechaFin) > new Date(proyecto.fechaFin)) {
      errors.push("La fecha de fin del contrato no puede ser posterior a la del proyecto")
    }

    return errors
  }

  firmar() {
    if (this.estado !== "borrador") {
      throw new Error("Solo se pueden firmar contratos en borrador")
    }

    this.estado = "firmado"
    this.fechaFirma = new Date()
    this.fechaActualizacion = new Date()
  }

  cancelar() {
    if (this.estado === "cancelado") {
      throw new Error("El contrato ya está cancelado")
    }

    this.estado = "cancelado"
    this.fechaActualizacion = new Date()
  }

  generateNumero() {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, "0")
    const day = String(new Date().getDate()).padStart(2, "0")
    const timestamp = Date.now().toString().slice(-4)
    return `CTR-${year}${month}${day}-${timestamp}`
  }

  toDBObject() {
    return {
      _id: this._id,
      numero: this.numero,
      proyectoId: new ObjectId(this.proyectoId),
      condiciones: this.condiciones,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      valorTotal: this.valorTotal,
      terminosPago: this.terminosPago,
      estado: this.estado,
      fechaFirma: this.fechaFirma,
      fechaCreacion: this.fechaCreacion,
      fechaActualizacion: this.fechaActualizacion,
    }
  }

  static fromDBObject(obj) {
    const contrato = new Contrato({
      _id: obj._id,
      numero: obj.numero,
      proyectoId: obj.proyectoId,
      condiciones: obj.condiciones,
      fechaInicio: obj.fechaInicio,
      fechaFin: obj.fechaFin,
      valorTotal: obj.valorTotal,
      terminosPago: obj.terminosPago,
      estado: obj.estado,
      fechaFirma: obj.fechaFirma,
      fechaCreacion: obj.fechaCreacion,
    })
    contrato.fechaActualizacion = obj.fechaActualizacion
    return contrato
  }
}
