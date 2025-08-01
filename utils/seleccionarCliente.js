import inquirer from "inquirer";

export async function seleccionarCliente(clientes) {
  const { clienteId } = await inquirer.prompt([
    {
      type: "list",
      name: "clienteId",
      message: "Selecciona un cliente:",
      choices: clientes.map((cliente) => ({
        name: `${cliente.nombre} - ${cliente.empresa}`,
        value: cliente._id.toString()
      }))
    }
  ]);

  return clienteId;
}
