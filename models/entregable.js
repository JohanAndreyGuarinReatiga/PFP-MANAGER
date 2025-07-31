// models/entregable.js
import { ObjectId } from "mongodb";

export class Entregable {
  constructor({ titulo, descripcion, proyectoId, fechaLimite, estado = "Pendiente", fechaEntrega = null }) {
    // Validaciones
    if (!titulo || typeof titulo !== "string" || !titulo.trim()) {
      throw new Error("El título del entregable es obligatorio.");
    }
    if (!descripcion || typeof descripcion !== "string" || !descripcion.trim()) {
      throw new Error("La descripción es obligatoria.");
    }
    if (!ObjectId.isValid(proyectoId)) {
      throw new Error("El ID del proyecto no es válido.");
    }
    const estadosValidos = ["Pendiente", "Entregado", "Aprobado", "Rechazado"];
    if (!estadosValidos.includes(estado)) {
      throw new Error(`Estado inválido. Valores permitidos: ${estadosValidos.join(", ")}`);
    }
    const fechaLimiteObj = new Date(fechaLimite);
    if (isNaN(fechaLimiteObj.getTime())) {
      throw new Error("La fecha límite no es válida.");
    }

    // Asignación
    this._id = new ObjectId();
    this.titulo = titulo.trim();
    this.descripcion = descripcion.trim();
    this.proyectoId = new ObjectId(proyectoId);
    this.fechaLimite = fechaLimiteObj;
    this.estado = estado;
    this.fechaEntrega = fechaEntrega ? new Date(fechaEntrega) : null;
  }

  cambiarEstado(nuevoEstado) {
    const estadosValidos = ["Pendiente", "Entregado", "Aprobado", "Rechazado"];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(`Estado inválido: ${nuevoEstado}`);
    }

    if (nuevoEstado === "Entregado") {
      this.fechaEntrega = new Date();
    }

    this.estado = nuevoEstado;
  }

  toDBObject() {
    return {
      _id: this._id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      proyectoId: this.proyectoId,
      fechaLimite: this.fechaLimite,
      estado: this.estado,
      fechaEntrega: this.fechaEntrega,
    };
  }
}
