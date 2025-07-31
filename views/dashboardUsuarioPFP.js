import inquirer from "inquirer";
import chalk from "chalk";

export async function mostrarMenuUsuario() {
    let salir = false;

    while (!salir) {
        console.clear();
        console.log(chalk.bold.cyanBright("=== PPF-MANAGER ==="));
        
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
                console.log(chalk.red("modulo no  implementada"));
                break;

            case "propuestas":
                console.log(chalk.red("modulo no  implementada"));
                break;

            case "proyecto":
                console.log(chalk.red("modulo proyecto no  implementada"));
                break;

            case "contratos":
                console.log(chalk.red("modulo no  implementada"));
                break;

            case "entregables":
                console.log(chalk.red("modulo no  implementada"));
                break;

            case "finanzas":
                console.log(chalk.red("modulo no  implementada"));
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

