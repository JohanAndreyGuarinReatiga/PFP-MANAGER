import inquirer from "inquirer";
import chalk from "chalk";
import {
    controladorAgregarClientes,
    controladorListaClientes,
    controladorActualizarClientes,
    controladorEliminarCliente
} from "../controllers/controllersCliente.js";
import { ServicioCliente } from "../services/servicioCliente.js";
import { seleccionarCliente } from "../utils/seleccionarCliente.js";

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

    const resultado = await controladorAgregarClientes(servicio, datosRegistro);

    console.log(resultado.mensaje);

    await inquirer.prompt([
        {
            type: "input",
            name: "continuar",
            message: chalk.gray("Presiona ENTER para volver al menú...")
        }
    ])
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
    const clientes = await servicio.obtenerClientes();
    const id = await seleccionarCliente(clientes, "Selecciona el cliente a actualizar");

    if (!id) return;

    const nuevosDatos = await inquirer.prompt([
        { type: "input", name: "nombre", message: "Nuevo nombre (dejar vacío para no cambiar): " },
        { type: "input", name: "correo", message: "Nuevo correo electrónico (dejar vacío para no cambiar): " },
        { type: "input", name: "telefono", message: "Nuevo teléfono (dejar vacío para no cambiar): " },
        { type: "input", name: "empresa", message: "Nueva empresa (dejar vacío para no cambiar): " },
    ]);

    const datosFiltrados = Object.fromEntries(
        Object.entries(nuevosDatos).filter(([_, val]) => val !== "")
    );

    if (Object.keys(datosFiltrados).length === 0) {
        console.log(chalk.yellow("No se ingresaron cambios"));
        return;
    }

    await controladorActualizarClientes(servicio, id, datosFiltrados);

    await inquirer.prompt([
        {
            type: "input",
            name: "continuar",
            message: chalk.gray("Presiona ENTER para volver al menú...")
        }
    ]);
}

async function eliminarCliente() {
   const clientes = await servicio.obtenerClientes();
    const id = await seleccionarCliente(clientes, "Selecciona el cliente a eliminar");

    if (!id) return;

    const { confirmacion } = await inquirer.prompt([
        {
            type: "confirm",
            name: "confirmacion",
            message: `¿Estás seguro de eliminar el cliente seleccionado?`
        }
    ]);

    if (confirmacion) {
        await controladorEliminarCliente(servicio, id);
    } else {
        console.log(chalk.green("Eliminación cancelada."));
    }
}