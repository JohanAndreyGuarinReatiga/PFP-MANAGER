import inquirer from "inquirer";
import chalk from "chalk";
import { mostrarMenuUsuario } from "./views/dashboardUsuarioPFP.js";
import { mostrarMenuCliente } from "./views/dashboardCliente.js";

export async function mostrarMenuPrincipal() {
    let salir = false;

    console.clear();
    console.log(chalk.cyanBright.bold("\n === Bienvenido a PFP Manager === \n"));

    while (!salir) {
        const { tipoUsuario } = await inquirer.prompt([
            {
                type: "list",
                name: "tipoUsuario",
                message: "Que deseas hacer? ",
                choices: [
                    { name: "Ingresar como freelancer (usuario de PFP)", value: "freelancer" },
                    { name: "Ingresar como cliente", value: "cliente" },
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
                process.exit(0);
        }
    }
}

mostrarMenuPrincipal();