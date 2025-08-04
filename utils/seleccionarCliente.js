import inquirer from "inquirer";
import chalk from "chalk";

export async function seleccionarCliente(clientes) {
  const opciones = clientes.map((cliente) => ({
    name: `${cliente.nombre} - ${cliente.empresa}`,
    value: cliente._id.toString()
  }));

  opciones.push({
    name: chalk.yellow("<< Volver"),
    value: "volver"
  });

  const { clienteId } = await inquirer.prompt([
    {
      type: "list",
      name: "clienteId",
      message: "Selecciona un cliente:",
      choices: opciones
    }
  ]);

  if (clienteId === "volver") return null;

  return clienteId;
}