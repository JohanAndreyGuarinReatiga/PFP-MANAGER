import chalk from "chalk";

export async function controladorAgregarClientes(servicio, datos) {
    const resultado = await servicio.registrarCliente(datos);
    return resultado;
}

export async function controladorListaClientes(servicio) {
    const clientes = await servicio.obtenerClientes();

    if (!clientes || clientes.length === 0) {
        console.log(" No hay clientes registrados.");
        return;
    }

    const pageSize = 10;
    let page = 0;

    while (page * pageSize < clientes.length) {
        const inicio = page * pageSize;
        const fin = inicio + pageSize;
        const clientesPagina = clientes.slice(inicio, fin);

        console.clear();
        console.log(chalk.blueBright(`Mostrando clientes ${inicio + 1} - ${Math.min(fin, clientes.length)} de ${clientes.length}:\n`));
        console.table(
            clientesPagina.map(c => ({
                Nombre: c.nombre,
                Correo: c.correo,
                Teléfono: c.telefono,
                Empresa: c.empresa
            }))
        );

        if (fin >= clientes.length) break;

        const { continuar } = await inquirer.prompt([
            {
                type: "confirm",
                name: "continuar",
                message: "¿Ver más clientes?",
                default: true
            }
        ]);

        if (!continuar) break;

        page++;
    }
}

export async function controladorActualizarClientes(servicio, id, nuevosDatos) {
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