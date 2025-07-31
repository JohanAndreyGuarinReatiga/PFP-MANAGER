import chalk, { Chalk } from "chalk";
import { ServicioCliente } from "../services/servicioCliente.js";

const servicio = new ServicioCliente

export async function controladorAgregarClientes(servicio, datos) {
    const resultado = await servicio.registrarCliente(datos);

    if (!resultado.ok) {
        console.log(resultado.mensaje);
        return;
    }

    console.log(resultado.mensaje)
}

export async function controladorListaClientes(servicio, pagina = 1, limite = 10 ) {
    const resultado = await servicio.obtenerClientesPaginados(pagina, limite);

    console.table(resultado.clientes);
    console.log(`Pagina ${resultado.paginaActual} de ${resultado.totalPaginas}`);
}

export async function controladorActualizarClientes(id, nuevosDatos) {
    try {
        const resultado = await servicio.actualizarCliente(id,nuevosDatos);

        if(resultado.ok) {
            console.log(resultado.mensaje);
        }else {
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

    console.log(resultado. mensaje)
}