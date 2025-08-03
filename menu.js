import inquirer from "inquirer";
import chalk from "chalk";
import { mostrarMenuUsuario } from "./views/dashboardUsuarioPFP.js";
import { mostrarMenuCliente } from "./views/dashboardCliente.js";

export async function mostrarMenuPrincipal() {
    let salir = false;

    console.clear();
    console.log(chalk.cyanBright.bold("\n === Bienvenidos a PFP Manager === \n"));

    while (!salir) {
        const { tipoUsuario } = await inquirer.prompt([
            {
                type: "list",
                name: "tipoUsuario",
                message: "Como deseas ingresar? ",
                choices: [
                    { name: "Soy freelancer (usuario de PPF)", value: "freelancer" },
                    { name: "Soy cliente", value: "cliente" },
                    {name: "Salir", value: "salir"}
                ]
            }
        ]);

        console.log();
        
        switch (tipoUsuario) {
            case "freelancer":
                await mostrarMenuUsuario();
                break;
            case "cliente":
                await mostrarMenuCliente();
                break;
            case "salir":
                salir = true;
                console.log("Gracias por usar PFP MANAGER");
                break;
        }
    }
}

mostrarMenuPrincipal();