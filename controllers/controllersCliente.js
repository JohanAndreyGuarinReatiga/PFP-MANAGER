import chalk from "chalk";
import { ServicioCliente } from "../services/servicioCliente.js";

export async function controladorAgregarClientes(servicio, datos) {
    const resultado = await servicio.registrarCliente(datos);

    if (!resultado.ok) {
        console.log(resultado.mensaje);
        return;
    }

    console.log(resultado.mensaje)
}

export async function controladorListaClientes(servicio) {
    const clientes = await servicio.obtenerTodosLosClientes();

    if (!clientes || clientes.length === 0) {
        console.log("⚠️  No hay clientes registrados.");
        return;
    }

    console.table(
        clientes.map(c => ({
            Nombre: c.nombre,
            Correo: c.correo,
            Teléfono: c.telefono,
            Empresa: c.empresa
        }))
    );
}

export async function controladorActualizarClientes(id, nuevosDatos) {
    try {
        const resultado = await servicio.actualizarCliente(id, nuevosDatos);

        if (resultado.ok) {
            console.log(resultado.mensaje);
        } else {
            console.warn(resultado.mensaje);
        }
    } catch (error) {
        console.error(chalk.redBright("Error inesperado al actualizar el cliente:"), error.mensaje);
    }
}

export async function controladorEliminarCliente(servicio, id) {
    const resultado = await servicio.eliminarCliente(id);

    if (!resultado.ok) {
        console.log(resultado.mensaje);
        return;
    }

    console.log(resultado.mensaje)
}

export async function buscarClientePorCorreo(servicio, correo) {
    try {
        const cliente = await servicio.buscarClientePorCorreo(correo);

        if (!cliente) {
            console.log(chalk.red("No se encontró un cliente con ese correo."));
            return null;
        }

        return cliente;
    } catch (error) {
        console.error(chalk.redBright("Error al buscar cliente por correo:"), error);
        return null;
    }
}