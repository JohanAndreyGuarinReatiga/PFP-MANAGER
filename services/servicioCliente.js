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

    async obtenerTodosLosClientes() {
  await this.esperarDB();

  return await this.db.collection("clientes").find({}).toArray();
}


    async buscarClientes(texto, pagina = 1, limite = 10) {
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
            .find(filtro)
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

     async buscarClientePorCorreo(correo) {
        await this.esperarDB();
        return await this.db.collection("clientes").findOne({ correo });
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

       async eliminarCliente(id) {
        await this.esperarDB();

        const cliente = await this.db.collection("clientes").findOne({_id: new ObjectId(id)});

        if (!cliente) {
            return {
                ok: false,
                mensaje: chalk.redBright("Cliente no encontrado")
            };
        }

        const proyectoActivo = await this.db.collection("proyectos").findOne({
            clienteId: new ObjectId(id), 
            estado: "activo"
        });

        if (proyectoActivo) {
            return{
                ok: false,
                mensaje: chalk.yellowBright("No se puede eliminar el cliente porque tiene proyectos activos.")
            }
        }

        const resultado = await this.db.collection("clientes").deleteOne({_id: new ObjectId(id)});

        if (resultado.deletedCount !== 0){
            return {
                ok: true,
                mensaje: chalk.greenBright(`Cliente ${cliente.nombre} eliminado correctamente.`)
            };
        } else {
            return {
                ok: false,
                mensaje:chalk.redBright("No se pudo eliminar el cliente. Intente nuevamente.")
            }
        }
    }

    async actualizarCliente(id, nuevosDatos){
        await this.esperarDB();

        //buscar el cliente
        const clienteExistente = await this.db.collection("clientes").findOne({_id: new ObjectId(id)});

        if(!clienteExistente) {
            return{
                ok: false,
                mensaje: chalk.redBright("Cliente no encontrado.")
            }
        }

        //si el correo no es repetido
        if (nuevosDatos.correo) {
            const correoRepetido = await this.db.collection("clientes").findOne({
                correo: nuevosDatos.correo,
                _id: {$ne: new ObjectId(id)}
            });

            if(correoRepetido) {
                return{
                    ok: false,
                    mensaje: chalk.yellowBright("El correo ya está siendo usado por otro cliente.")
                }
            }
        }

        const resultado = await this.db.collection("clientes").updateOne(
            {_id: new ObjectId(id)},
            {$set: nuevosDatos}
        );

        if (resultado.modifiedCount > 0) {
            return{
                ok: true,
                mensaje: chalk.greenBright(`Cliente ${clienteExistente.nombre} actualizado correctamente.`)
            }
        } else {
            return{
                ok:false,
                mensaje: chalk.yellowBright("No se realizaron cambios.")
            }
        }
    }
}