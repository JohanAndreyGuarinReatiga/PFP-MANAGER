const inquirer = require("inquirer")
const chalk = require("chalk")

async function crearPropuesta() {
  try {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "titulo",
        message: "Ingrese el título de la propuesta:",
        validate: (input) => {
          if (input.length === 0) {
            return "El título no puede estar vacío"
          }
          return true
        },
      },
      {
        type: "input",
        name: "descripcion",
        message: "Ingrese la descripción de la propuesta:",
        validate: (input) => {
          if (input.length === 0) {
            return "La descripción no puede estar vacía"
          }
          return true
        },
      },
      {
        type: "number",
        name: "monto",
        message: "Ingrese el monto de la propuesta:",
        validate: (input) => {
          if (isNaN(input) || input <= 0) {
            return "El monto debe ser un número positivo"
          }
          return true
        },
      },
    ])

    console.log(chalk.green("Propuesta creada exitosamente:"))
    console.log(chalk.blue(`Título: ${answers.titulo}`))
    console.log(chalk.blue(`Descripción: ${answers.descripcion}`))
    console.log(chalk.blue(`Monto: $${answers.monto}`))
  } catch (error) {
    console.error(chalk.red("Error al crear la propuesta:"), error)
  }
}

module.exports = { crearPropuesta }
