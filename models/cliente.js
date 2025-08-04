import { ObjectId } from "mongodb";

export class Cliente {
    constructor({ nombre, correo, telefono, empresa, fechaRegistro = new Date() }) {

        if (!nombre || typeof nombre !== "string") {
            throw new Error("El nombre es obligatorio y debe ser una cadena.");
        }

        if (!correo || !this.#esCorreoValido(correo)) {
            throw new Error("El correo electronico es invalido")
        }

        if (!telefono || typeof telefono !== "string" || !/^\d{10}$/.test(telefono)) {
            throw new Error("El telefono debe ser una cadena numerica")
        }

        if (!empresa || typeof empresa !== "string") {
            throw new Error("La empresa debe ser una cadena")
        }


        this._id = new ObjectId();
        this.nombre = nombre;
        this.correo = correo;
        this.telefono = telefono;
        this.empresa = empresa;
        this.fechaRegistro = fechaRegistro;
    }

    #esCorreoValido(correo) {
        const regex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
        return regex.test(correo)
    }

    toDBObject() {
        return {
            _id: this._id,
            nombre: this.nombre,
            correo: this.correo,
            telefono: this.telefono,
            empresa: this.empresa,
            fechaRegistro: this.fechaRegistro,
        }
    }
}