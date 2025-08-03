import inquirer from "inquirer";
import { ControladorFinanzas } from "../controllers/controladorFinanzas.js";

const controlador = new ControladorFinanzas();

export async function verBalanceClienteCommand() {
    const { correo } = await inquirer.prompt([
        { type: "input", name: "correo", message: "Ingresa tu correo:" }
    ]);

    const { tipo } = await inquirer.prompt([
        {
            type: "list",
            name: "tipo",
            message: "¿Qué tipo de balance deseas ver?",
            choices: ["General", "Mensual"]
        }
    ]);

    if (tipo === "General") {
        await controlador.verBalanceGeneralCliente(correo);
    } else {
        const { mes, anio } = await inquirer.prompt([
            { type: "input", name: "mes", message: "Mes (1-12):", validate: v => /^[1-9]|1[0-2]$/.test(v) },
            { type: "input", name: "anio", message: "Año (e.g. 2025):", validate: v => /^\d{4}$/.test(v) },
        ]);

        await controlador.verBalanceMensualCliente(correo, parseInt(mes), parseInt(anio));
    }
}
