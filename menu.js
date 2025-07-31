import inquirer from "inquirer";
import chalk from "chalk";
import { mostrarMenuUsuario } from "./views/dashboardUsuarioPFP.js";

export async function mostrarMenuPrincipal() {
    console.clear();
console.log(chalk.cyanBright.bold("\n === Bienvenidos a PFP Manager ==="));

const { tipoUsuario } = await inquirer.prompt([
    {
        type: "list",
        name:"tipoUsuario",
        message: "Como deseas ingresar? ",
        choices: [
            {name: "Soy freelancer (usuario de PPF)", value: "freelancer"},
            {name: "SOy cliente", value: "cliente"}
        ]
    }
]);

if (tipoUsuario === "freelancer") {
    await mostrarMenuUsuario();
}else{
    await mos
}

}

