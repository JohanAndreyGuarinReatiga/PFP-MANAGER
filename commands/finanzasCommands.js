import inquirer from "inquirer";
import chalk from "chalk";

export async function menuFinanzas() {
    let salir = false;

    while (!salir) {
        console.clear()
        console.log(chalk.bold.magentaBright("=== GESTIÓN DE FINANZAS ==="));
        
        const {opcion} =await inquirer.prompt([
            {
                type: "list",
                name: "opcion",
                message: "Que accion deseas hacer con tus finanzas?",
                choices: [
                    {name: "Pagar egreso", value:"egreso"},
                    {name: "Volver al menu principal", value:"salir"},
                    {name: "Ver balance financiero", value:"balance"},
                    {name: "Volver al menu principal", value:"salir"}
                ]
            }
        ])

        switch (key) {
            case "egreso":
                console.log("funcion en construccion");
                break
            case "":
                console.log("") 
                break;
            case "balance":
                console.log("funcion en construccion");
                break;
            case "salir":
                salir = true;
                break;
        }
    }
}