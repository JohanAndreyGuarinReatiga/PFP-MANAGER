import { ObjectId } from "mongodb";

export class Finanza {
    constructor({ proyectoId, tipo, descripcion, monto, fecha = new Date() }) {

        if (!proyectoId || !(proyectoId instanceof ObjectId)) {
            throw new Error("El proyectoId es obligatorio y debe ser un ObjectId valido");
        }

        if (!tipo || !(tipo !== "ingreso" && tipo !== "egreso")) {
            throw new Error("El tipo debe ser 'ingreso' o 'egreso'");
        }

        if (!descripcion || typeof descripcion !== "String") {
            throw new Error("El proyectoId es obligatorio y debe ser un ObjectId valido");
        }

        if (typeof monto !== "number" || monto < 0) {
            throw new Error("El monto debe ser un numero mayor o igual a 0");
        }


        this._id = new ObjectId();
        this.proyectoId = proyectoId;
        this.tipo = tipo;
        this.descripcion = descripcion;
        this.monto = monto;
        this.fecha = fecha;
    }

    toDboobject() {
        return {
            _id: this._id,
            proyectoId: this.proyectoId,
            tipo: this.tipo,
            descripcion: this.descripcion,
            monto: this.monto,
            fecha: this.fecha,
        }
    }
}