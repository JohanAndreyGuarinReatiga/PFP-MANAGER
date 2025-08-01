import inquirer from "inquirer";
import chalk from "chalk";
import {
    controladorAgregarClientes,
    controladorListaClientes,
    controladorActualizarClientes,
    controladorEliminarCliente
} from "../controllers/controllersCliente.js";
import { ServicioCliente } from "../services/servicioCliente.js";

const servicio = new ServicioCliente();

export async function menuGestionClientes() {
    let salir = false;

    while (!salir) {
        console.clear();
        console.log(chalk.bold.magentaBright("=== GESTIÓN DE CLIENTES ==="));
        const { opcion } = await inquirer.prompt([
            {
                type: "list",
                name: "opcion",
                message: "Que accion deseas realizar con los clientes?",
                choices: [
                    { name: "Registrar cliente", value: "registrar" },
                    { name: "Listar clientes", value: "listar" },
                    { name: "Actualizar clientes", value: "actualizar" },
                    { name: "Eliminar clientes", value: "eliminar" },
                    { name: "Volver a menu principal", value: "salir" },
                ],
            },
        ]);

        switch (opcion) {
            case "registrar":
                await agregarCliente();
                break;
            case "listar":
                await listarClientes(servicio);
                break;
            case "actualizar":
                await actualizarCliente();
                break;
            case "eliminar":
                await eliminarCliente();
                break;
            case "salir":
                salir = true;
                break;
        }
    }
}

async function agregarCliente() {
    const datosRegistro = await inquirer.prompt([
        { type: "input", name: "nombre", message: "Nombre del cliente" },
        { type: "input", name: "correo", message: "Correo electronico" },
        { type: "input", name: "telefono", message: "Telefono" },
        { type: "input", name: "empresa", message: "Empresa" },
    ]);

    await controladorAgregarClientes(servicio, datosRegistro);
}

async function listarClientes(servicio) {
  await controladorListaClientes(servicio);

  await inquirer.prompt([
        {
            type: "input",
            name: "continuar",
            message: "Presiona ENTER para volver al menú..."
        }
    ]);
}

async function actualizarCliente() {
    const { id } = await inquirer.prompt([
        { name: "id", message: "Id del cliente a actualizar; " }
    ]);

    const nuevosDatos = await inquirer.prompt([
        { type: "input", name: "nombre", message: "NUevo nombre (dejar vacío para no cambiar): " },
        { type: "input", name: "correo", message: "Nuevo correo electronico (dejar vacío para no cambiar): " },
        { type: "input", name: "telefono", message: "Nuevo telefono (dejar vacío para no cambiar): " },
        { type: "input", name: "empresa", message: "Nueva empresa (dejar vacío para no cambiar): " },
    ]);

    const datosFiltrados = Object.fromEntries(
        Object.entries(nuevosDatos).filter(([_, val]) => val !== "")
    );

    if (Object.keys(datosFiltrados).length === 0) {
        console.log(chalk.yellow("no se ingresaron cambios"));
        return;
    }

    await controladorActualizarClientes(id, datosFiltrados)
}

async function eliminarCliente() {
    const { id } = await inquirer.prompt([
        { name: "id", message: "ID del cliente a eliminar: " }
    ]);

    const { confirmacion } = await inquirer.prompt([
        {
            type: "confirm",
            name: "confirmacion",
            message: `Estas seguro de eliminar el cliente con ID ${id}`
        }
    ]);

    if (confirmacion) {
        await controladorEliminarCliente(servicio, id);
    } else {
        console.log(chalk.green("Elminacion cancelada."))
    }
}