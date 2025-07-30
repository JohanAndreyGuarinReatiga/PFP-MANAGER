class Contrato {
    constructor(data) {
      this.id = data.id || this.generateId()
      this.numero = data.numero || this.generateNumero()
      this.proyectoId = data.proyectoId
      this.condiciones = data.condiciones
      this.fechaInicio = data.fechaInicio
      this.fechaFin = data.fechaFin
      this.valorTotal = data.valorTotal
      this.pago = data.pago
      this.estado = data.estado || "borrador"
      this.fechaFirma = data.fechaFirma
      this.fechaCreacion = data.fechaCreacion || new Date()
      this.fechaActualizacion = new Date()
    }
  
    validate() {
      const errors = []
      if (!this.proyectoId) {
        errors.push("El contrato debe estar asociado a un proyecto")
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
      if (!["borrador", "firmado", "cancelado"].includes(this.estado)) {
        errors.push("Estado de contrato inválido")
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
  
    generateId() {
      return "CTR_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    }
  
    generateNumero() {
      const year = new Date().getFullYear()
      const month = String(new Date().getMonth() + 1).padStart(2, "0")
      const day = String(new Date().getDate()).padStart(2, "0")
      const random = Math.random().toString(36).substr(2, 3).toUpperCase()
      return `CTR-${year}${month}${day}-${random}`
    }
  
    toJSON() {
      return {
        id: this.id,
        numero: this.numero,
        proyectoId: this.proyectoId,
        condiciones: this.condiciones,
        fechaInicio: this.fechaInicio,
        fechaFin: this.fechaFin,
        valorTotal: this.valorTotal,
        pago: this.pago,
        estado: this.estado,
        fechaFirma: this.fechaFirma,
        fechaCreacion: this.fechaCreacion,
        fechaActualizacion: this.fechaActualizacion,
      }
    }
  }
  
  module.exports = Contrato
  