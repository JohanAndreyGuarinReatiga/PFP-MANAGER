import { ObjectId } from "mongodb";

export class Finanza {
  constructor({ proyectoId = null, tipo, descripcion, monto, fecha = new Date(), categoria = "otros" }) {
    if (proyectoId && !ObjectId.isValid(proyectoId)) {
      throw new Error("El proyectoId debe ser un ObjectId válido o null");
    }

    if (!["ingreso", "egreso"].includes(tipo)) {
      throw new Error("El tipo debe ser 'ingreso' o 'egreso'");
    }

    if (!descripcion || typeof descripcion !== "string") {
      throw new Error("La descripción es obligatoria y debe ser una cadena");
    }

    if (typeof monto !== "number" || monto <= 0) {
      throw new Error("El monto debe ser un número mayor que 0");
    }

    if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
      throw new Error("La fecha debe ser una fecha válida");
    }

    this._id = new ObjectId();
    this.proyectoId = proyectoId ? new ObjectId(proyectoId) : null;
    this.tipo = tipo;
    this.descripcion = descripcion.trim();
    this.monto = monto;
    this.fecha = fecha;
    this.categoria = categoria;
  }

  toDBObject() {
    return {
      _id: this._id,
      proyectoId: this.proyectoId,
      tipo: this.tipo,
      descripcion: this.descripcion,
      monto: this.monto,
      fecha: this.fecha,
      categoria: this.categoria,
    };
  }
}
