import inquirer from "inquirer";
import { ControladorFinanzas } from "../controllers/controladorFinanzas.js";

const controlador = new ControladorFinanzas();

export async function registrarPagoClienteCommand() {
    const { correo } = await inquirer.prompt([
        { type: "input", name: "correo", message: "Correo del cliente:" }
    ]);

    const proyectos = await controlador.obtenerProyectosCliente(correo);

    if (proyectos.length === 0) {
        console.log("❌ No se encontraron proyectos para este cliente.");
        return;
    }

    const { idProyecto } = await inquirer.prompt([
        {
            type: "list",
            name: "idProyecto",
            message: "Selecciona un proyecto para registrar el pago:",
            choices: proyectos.map(p => ({
                name: `${p.nombre} - (${p._id})`,
                value: p._id
            }))
        }
    ]);

    const { monto } = await inquirer.prompt([
        { type: "number", name: "monto", message: "Monto a pagar:" }
    ]);

    await controlador.registrarPago({ idProyecto, monto });
}
