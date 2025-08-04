import inquirer from "inquirer";
import chalk from "chalk";
import { menuGestionClientes } from "../commands/clientesCommands.js";
import {menuPropuestas} from "../commands/propuestaCommands.js"
import {menuProyectos} from "../commands/proyectoCommands.js"
import {gestionarContratos} from "../commands/contratoCommands.js"
import {gestionEntregablesCommand} from "../commands/entregableCommands.js"
import {menuFinanzas} from "../commands/finanzasCommands.js"

export async function mostrarMenuUsuario() {
    let salir = false;

    while (!salir) {
        console.clear();
        console.log(chalk.bold.magentaBright("=== PPF-MANAGER ==="));
        
        const {opcion} = await inquirer.prompt([
            {
                type: "list",
                name: "opcion",
                message: "Selecciona una opcion",
                choices: [
                    {name: "Gestionar clientes", value: "clientes"},
                    {name: "Gestionar propuestas", value: "propuestas"},
                    {name: "Gestionar proyectos", value: "proyectos"},
                    {name: "Gestionar contratos", value: "contratos"},
                    {name: "Gestionar entregables", value: "entregables"},
                    {name: "Gestionar finanzas", value: "finanzas"},
                    {name: chalk.red("Salir"), value:"salir"}
                ]
            }
        ]);

        switch (opcion) {
            case "clientes":
                await menuGestionClientes()
                break;

            case "propuestas":
                await menuPropuestas()
                break;

            case "proyectos":
                await menuProyectos()
                break;

            case "contratos":
                await gestionarContratos()
                break;

            case "entregables":
                await gestionEntregablesCommand()
                break;

            case "finanzas":
                await menuFinanzas()
                break;

            case "salir":
                console.log(chalk.greenBright("\n Hasta luego"));
                salir = true;
                break
        }

        if (!salir) {
            await new Promise (resolve => setTimeout(resolve, 1000));
        }

    }
}

