import dotenv from "dotenv"
import inquirer from "inquirer"
import chalk from "chalk"
import { crearProyecto, crearProyectoPorPropuesta, generarContrato } from "./commands/crearProyecto.js"

dotenv.config()

async function menuPrincipal() {
  console.log(chalk.blue.bold("\n🚀 FREELANCER PORTFOLIO CLI"))
  console.log(chalk.gray("Gestiona tu portafolio profesional\n"))

  const { opcion } = await inquirer.prompt([
    {
      type: "list",
      name: "opcion",
      message: "Selecciona una opción:",
      choices: [
        { name: "📋 Crear proyecto manualmente", value: "crear-proyecto" },
        { name: "📄 Crear proyecto desde propuesta", value: "proyecto-propuesta" },
        { name: "📝 Generar contrato", value: "generar-contrato" },
        { name: "❌ Salir", value: "salir" },
      ],
    },
  ])

  switch (opcion) {
    case "crear-proyecto":
      await crearProyecto()
      break
    case "proyecto-propuesta":
      await crearProyectoPorPropuesta()
      break
    case "generar-contrato":
      await generarContrato()
      break
    case "salir":
      console.log(chalk.green("\n👋 ¡Hasta luego!"))
      process.exit(0)
  }

  // Volver al menú principal
  await menuPrincipal()
}

// Verificar variables de entorno
if (!process.env.MONGO_URI || !process.env.DB_NAME) {
  console.log(chalk.red.bold("❌ ERROR: Variables de entorno faltantes"))
  console.log(chalk.yellow("Asegúrate de configurar MONGO_URI y DB_NAME en tu archivo .env"))
  process.exit(1)
}

// Iniciar la aplicación
menuPrincipal().catch((error) => {
  console.log(chalk.red.bold("\n❌ ERROR FATAL:"))
  console.log(chalk.red(error.message))
  process.exit(1)
})
