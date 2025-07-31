import inquirer from "inquirer";
import chalk from "chalk";
import { connection } from "../config/db.js";
import { ObjectId } from "mongodb";

export async function mostrarMenuCliente() {
    const { correo } = await inquirer.prompt([
        {
            type: "input",
            name: "correo",
            message: "Ingresa tu correo para ver tus proyectos: ",
            validate: input => /\S+@\S+\.\S+/.test(input) || "Correo invalido"
        }
    ]);

    const db = await connection();
    const cliente = await db.collection("clientes").findOne({correo});

    if (!cliente) {
        console.log(chalk.redBright(`\n No se encontro cliente con este correo \n`));
        return;
    }

    const proyectos = await db.collection("proyectos").findOne({ clienteId: cliente._id}).toArray();

    console.log(chalk.greenBright(`\n Cliente: ${cliente.nombre} \n`))
    console.log(chalk.red(`Empresa: ${cliente.empresa || "N/A"}`))

    if (proyectos.length === 0) {
        console.log(chalk.yellowBright("No tienes proyectos registrados aun \n"));
        return
    }

     for (const proyecto of proyectos) {
    console.log(chalk.cyan(`\n Proyecto: ${proyecto.nombre}`));
    console.log(`Estado: ${proyecto.estado || 'sin estado'}\n`);

    // Mostrar avances
    if (proyecto.avances?.length) {
      console.log(chalk.blue('Avances:'));
      proyecto.avances.forEach((a, i) => {
        console.log(`${i + 1}. ${a.descripcion} (${a.fecha.toISOString().split('T')[0]})`);
      });
    } else {
      console.log('Avances: ninguno.');
    }

    // Contrato asociado
    if (proyecto.contratoId) {
      const contrato = await db.collection('contratos').findOne({ _id: proyecto.contratoId });
      if (contrato) {
        console.log(chalk.magenta('\n   📄 Contrato:'));
        console.log(`**** Condiciones: ${contrato.condiciones}`);
        console.log(`**** Duración: ${contrato.fechaInicio.toISOString().split('T')[0]} → ${contrato.fechaFin.toISOString().split('T')[0]}`);
        console.log(`**** Valor total: $${contrato.valorTotal}\n`);
      }
    }

    // Entregables
    const entregables = await db.collection('entregables').find({ proyectoId: proyecto._id }).toArray();
    if (entregables.length) {
      console.log(chalk.yellow('Entregables:'));
      entregables.forEach((e, i) => {
        console.log(`${i + 1}. ${e.nombre} | Estado: ${e.estado} | Fecha límite: ${e.fechaLimite.toISOString().split('T')[0]}`);
      });
    } else {
      console.log('Entregables: ninguno.\n');
    }

    // Finanzas
    const finanzas = await db.collection('finanzas').find({ proyectoId: proyecto._id }).toArray();
    if (finanzas.length) {
      console.log(chalk.green('Finanzas:'));
      finanzas.forEach(f => {
        console.log(`- [${f.tipo}] $${f.monto} | ${f.descripcion} | ${f.fecha?.toISOString()?.split('T')[0]}`);
      });
    } else {
      console.log('Finanzas: ninguna.\n');
    }

    console.log(chalk.gray('--------------------------------------------------'));
  }
}
