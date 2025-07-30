class Proyecto {
    constructor(data = {}) {
      this.id = data.id || this.generateId();
      this.clienteId = data.clienteId || '';
      this.nombre = data.nombre || '';
      this.descripcion = data.descripcion || '';
      this.fechaInicio = data.fechaInicio || new Date();
      this.fechaFin = data.fechaFin || null;
      this.valor = data.valor || 0;
      this.estado = data.estado || 'activo';
      this.progreso = data.progreso || 0;
      this.fechaCreacion = data.fechaCreacion || new Date();
      this.fechaActualizacion = data.fechaActualizacion || new Date();
    }
  
    generateId() {
      return "PRJ_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    }
  
    validate() {
      const errors = [];
  
      if (!this.nombre || this.nombre.trim().length === 0) {
        errors.push('El nombre del proyecto es obligatorio');
      }
      if (!this.clienteId || this.clienteId.trim().length === 0) {
        errors.push('El ID del cliente es obligatorio');
      }
      if (this.valor < 0) {
        errors.push('El valor del proyecto no puede ser negativo');
      }
      if (this.fechaFin && this.fechaFin < this.fechaInicio) {
        errors.push('La fecha de fin no puede ser anterior a la fecha de inicio');
      }
      const estadosValidos = ['activo', 'pausado', 'finalizado', 'cancelado'];
      if (!estadosValidos.includes(this.estado)) {
        errors.push('Estado de proyecto inválido. Estados válidos: ' + estadosValidos.join(', '));
      }
      if (this.progreso < 0 || this.progreso > 100) {
        errors.push('El progreso debe estar entre 0 y 100');
      }
      return errors;
    }
  
    toJSON() {
      return {
        id: this.id,
        clienteId: this.clienteId,
        nombre: this.nombre,
        descripcion: this.descripcion,
        fechaInicio: this.fechaInicio,
        fechaFin: this.fechaFin,
        valor: this.valor,
        estado: this.estado,
        progreso: this.progreso,
        fechaCreacion: this.fechaCreacion,
        fechaActualizacion: this.fechaActualizacion
      };
    }
  
    static fromJSON(data) {
      return new Proyecto(data);
    }
 
    getDuracionDias() {
      if (!this.fechaFin) return null;
      const diffTime = Math.abs(this.fechaFin - this.fechaInicio);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  
    getEstadoColor() {
      const colores = {
        'activo': 'green',
        'pausado': 'yellow',
        'finalizado': 'blue',
        'cancelado': 'red'
      };
      return colores[this.estado] || 'white';
    }
  
    isVencido() {
      if (!this.fechaFin) return false;
      return new Date() > this.fechaFin && this.estado === 'activo';
    }
  }
  
  module.exports = Proyecto;
  