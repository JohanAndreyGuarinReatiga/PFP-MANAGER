import inquirer from "inquirer"; 
import chalk from "chalk";
import { buscarClientePorCorreo } from "../controllers/controllersCliente.js";
import { ServicioCliente } from "../services/servicioCliente.js";

export async function mostrarMenuCliente() {
  const { correo } = await inquirer.prompt([
    {
      type: "input",
      name: "correo",
      message: "Ingresa tu correo para ver tu información:",
      validate: input => /\S+@\S+\.\S+/.test(input) || "Correo inválido"
    }
  ]);

  const servicio = new ServicioCliente(); // ✅ Instanciar el servicio
  const cliente = await buscarClientePorCorreo(servicio, correo); // ✅ Pasar instancia + correo

  if (!cliente) {
    console.log(chalk.red("\nNo se encontró un cliente con ese correo.\n"));
    return;
  }

  console.log(chalk.greenBright("\nInformación del cliente:"));
  console.log(chalk.cyan(`Nombre: ${cliente.nombre}`));
  console.log(chalk.cyan(`Empresa: ${cliente.empresa || "N/A"}`));
  console.log(chalk.cyan(`Correo: ${cliente.correo}`));
}
