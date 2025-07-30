import chalk, { Chalk } from "chalk";
import { Cliente } from "../models/cliente.js";
import { connection } from "../config/db.js";


export async function registrarCliente(datos) {
    try {
        const db = await connection();

        //validacion de correo existente 
        const correoExistente = await db.collection("Clientes").findOne({ correo: datos.correo });
        if (correoExistente) {
            const mensaje = chalk.yellowBright("El correo ya fue registrado. Intenta con otro");
            console.log(mensaje);
            return { ok: false, mensaje }
        }

        //crear cliente nuevo
        const nuevoCliente = new Cliente(datos)
        const resultado = await db.collection("clientes").insertOne(nuevoCliente.toDBObject());
        const mensajeRegistrado = chalk.greenBright(`Cliente registrado con ID: ${resultado.insertedId}`)
        console.log(mensajeRegistrado);
        return { ok: true, mensajeRegistrado }
    } catch (error) {
        const mensaje = chalk.redBright(`Error al registrar cliente: ${error.message}`);
        console.log(mensaje);
        return { ok: false, mensaje }
    }
}
