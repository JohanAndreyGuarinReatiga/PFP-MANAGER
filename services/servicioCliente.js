import { ObjectId } from "mongodb";
import { connection } from "../config/db.js";
import { Cliente } from "../models/cliente.js";
import chalk from "chalk";

export class ServicioCliente {
    constructor() {
        this.ready = connection().then((db) => {
            this.db = db;
        })
    };

    async esperarDB() {
        if (!this.db) await this.ready;
    }

    async obtenerClientesPaginados(pagina = 1, limite = 10) {
        await this.esperarDB();

        const skip = (pagina - 1) * limite;

        const clientes = await this.db
            .collection("clientes")
            .find({})
            .skip(skip)
            .limit(limite)
            .toArray();

        const total = await this.db.collection("clientes").countDocuments();

        return {
            clientes,
            total,
            paginaActual: pagina,
            totalPaginas: Math.ceil(total / limite)
        };
    }

    async buscarClientes(pagina = 1, limite = 10) {
        await this.esperarDB();


        const skip = (pagina - 1) * limite;
        const filtro = {
            $or: [
                { nombre: { $regex: texto, $options: "i" } },
                { empresa: { $regex: texto, $options: "i" } }
            ]
        }

        const clientes = await this.db
            .collection("clientes")
            .find({})
            .skip(skip)
            .limit(limite)
            .toArray();

        const total = await this.db.collection("clientes").countDocuments();

        return {
            clientes,
            total,
            paginaActual: pagina,
            totalPaginas: Math.ceil(total / limite)
        };
    }

    async obtenerClienteId(id) {
        await this.esperarDB();

        return await this.db
            .collection("clientes")
            .findOne({ _id: new ObjectId(id) });
    }

    async registrarCliente(clienteData) {
        await this.esperarDB();
        
        try {
            const correoExistente = await this.db.collection("clientes").findOne({ correo: clienteData.correo });

            if (correoExistente) {
                const mensaje = chalk.yellowBright("EL correo ya fue registrado. Intente con otro")
                return { ok: false, mensaje }
            }

            const nuevoCliente = new Cliente(clienteData);

            const resultado = await this.db.collection("clientes").insertOne(nuevoCliente.toDBObject());
            const mensajeRegistrado = chalk.greenBright(`Cliente registrado con ID: ${resultado.insertedId}`)
            return { ok: true, mensaje: mensajeRegistrado }
        } catch (error) {
            const mensaje = chalk.redBright(`Error al registrar cliente: ${error.message}`);
            return {
                ok: false,
                mensaje: mensaje
            }
        }
    }

}