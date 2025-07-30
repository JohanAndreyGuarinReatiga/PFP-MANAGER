import inquirer from "inquirer"
import chalk from "chalk"
import { MongoClient } from "mongodb"
import { ServicioProyecto } from "../services/servicioProyecto.js"

function mostrarEstadoConColor(estado) {
  const colores = {
    Activo: chalk.green,
    Pausado: chalk.yellow,
    Finalizado: chalk.blue,
    Cancelado: chalk.red,
  }
  return colores[estado] ? colores[estado](estado) : chalk.white(estado)
}

export async function crearProyecto() {
  const cliente = new MongoClient(process.env.MONGO_URI)

  try {
    await cliente.connect()
    const db = cliente.db(process.env.DB_NAME)
    const servicioProyecto = new ServicioProyecto(db)

    console.log(chalk.blue.bold("CREAR PROYECTO MANUALMENTE"))

    const respuestas = await inquirer.prompt([
      {
        type: "input",
        name: "nombre",
        message: "Nombre del proyecto:",
        validate: (input) => input.trim().length > 0 || "El nombre es requerido",
      },
      {
        type: "input",
        name: "descripcion",
        message: "Descripción del proyecto:",
      },
      {
        type: "input",
        name: "fechaInicio",
        message: "Fecha de inicio (YYYY-MM-DD):",
        default: new Date().toISOString().split("T")[0],
        validate: (input) => {
          const fecha = new Date(input)
          return !isNaN(fecha.getTime()) || "Formato de fecha inválido"
        },
      },
      {
        type: "input",
        name: "fechaFin",
        message: "Fecha de fin (YYYY-MM-DD) [opcional]:",
        validate: (input) => {
          if (!input.trim()) return true
          const fecha = new Date(input)
          return !isNaN(fecha.getTime()) || "Formato de fecha inválido"
        },
      },
      {
        type: "number",
        name: "valor",
        message: "Valor del proyecto:",
        default: 0,
        validate: (input) => input >= 0 || "El valor debe ser mayor o igual a 0",
      },
      {
        type: "input",
        name: "clienteId",
        message: "ID del cliente asociado:",
        validate: (input) => input.trim().length === 24 || "ID de cliente inválido (debe tener 24 caracteres)",
      },
    ])

    // Limpiar fecha fin si está vacía
    if (!respuestas.fechaFin.trim()) {
      respuestas.fechaFin = null
    }

    const nuevoProyecto = await servicioProyecto.crearProyecto(respuestas)

    console.log(chalk.green.bold("PROYECTO CREADO"))
    console.log(chalk.cyan("Código:"), chalk.white.bold(nuevoProyecto.codigoProyecto))
    console.log(chalk.cyan("Nombre:"), chalk.white(nuevoProyecto.nombre))
    console.log(chalk.cyan("Estado:"), mostrarEstadoConColor(nuevoProyecto.estado))
    console.log(chalk.cyan("Valor:"), chalk.white(`$${nuevoProyecto.valor}`))
  } catch (error) {
    console.log(chalk.red.bold("ERROR AL CREAR"))
    console.log(chalk.red(error.message))
  } finally {
    await cliente.close()
  }
}

export async function crearProyectoPorPropuesta() {
  const cliente = new MongoClient(process.env.MONGO_URI)

  try {
    await cliente.connect()
    const db = cliente.db(process.env.DB_NAME)
    const servicioProyecto = new ServicioProyecto(db)

    console.log(chalk.blue.bold("CREAR PROYECTO DESDE PROPUESTA"))

    const respuestas = await inquirer.prompt([
      {
        type: "input",
        name: "propuestaId",
        message: "ID de la propuesta aceptada:",
        validate: (input) => input.trim().length === 24 || "ID de propuesta inválido (debe tener 24 caracteres)",
      },
      {
        type: "input",
        name: "clienteId",
        message: "ID del cliente asociado:",
        validate: (input) => input.trim().length === 24 || "ID de cliente inválido (debe tener 24 caracteres)",
      },
    ])

    const nuevoProyecto = await servicioProyecto.crearProyectoPorPropuesta(respuestas.propuestaId, respuestas.clienteId)

    console.log(chalk.green.bold("PROYECTO CREADO"))
    console.log(chalk.cyan("Código:"), chalk.white.bold(nuevoProyecto.codigoProyecto))
    console.log(chalk.cyan("Nombre:"), chalk.white(nuevoProyecto.nombre))
    console.log(chalk.cyan("Estado:"), mostrarEstadoConColor(nuevoProyecto.estado))
    console.log(chalk.cyan("Valor:"), chalk.white(`$${nuevoProyecto.valor}`))
    console.log(chalk.cyan("Heredado de propuesta:"), chalk.yellow("Sí"))
  } catch (error) {
    console.log(chalk.red.bold("ERROR AL CREAR EL PROYECTO"))
    console.log(chalk.red(error.message))
  } finally {
    await cliente.close()
  }
}

export async function generarContrato() {
  const cliente = new MongoClient(process.env.MONGO_URI)

  try {
    await cliente.connect()
    const db = cliente.db(process.env.DB_NAME)
    const servicioProyecto = new ServicioProyecto(db)

    console.log(chalk.blue.bold("GENERAR CONTRATO PARA PROYECTO"))

    const respuestas = await inquirer.prompt([
      {
        type: "input",
        name: "proyectoId",
        message: "ID del proyecto:",
        validate: (input) => input.trim().length === 24 || "ID de proyecto inválido (debe tener 24 caracteres)",
      },
      {
        type: "editor",
        name: "condiciones",
        message: "Condiciones del contrato:",
        validate: (input) => input.trim().length >= 10 || "Las condiciones deben tener al menos 10 caracteres",
      },
      {
        type: "input",
        name: "fechaInicio",
        message: "Fecha de inicio del contrato (YYYY-MM-DD):",
        default: new Date().toISOString().split("T")[0],
        validate: (input) => {
          const fecha = new Date(input)
          return !isNaN(fecha.getTime()) || "Formato de fecha inválido"
        },
      },
      {
        type: "input",
        name: "fechaFin",
        message: "Fecha de fin del contrato (YYYY-MM-DD):",
        validate: (input) => {
          const fecha = new Date(input)
          return !isNaN(fecha.getTime()) || "Formato de fecha inválido"
        },
      },
      {
        type: "number",
        name: "valorTotal",
        message: "Valor total del contrato:",
        validate: (input) => input > 0 || "El valor debe ser mayor a 0",
      },
      {
        type: "input",
        name: "terminosPago",
        message: "Términos de pago:",
        validate: (input) => input.trim().length >= 5 || "Los términos de pago son requeridos",
      },
    ])

    const nuevoContrato = await servicioProyecto.generarContrato(respuestas)

    console.log(chalk.green.bold("CONTRATO GENERADO"))
    console.log(chalk.cyan("Número:"), chalk.white.bold(nuevoContrato.numero))
    console.log(chalk.cyan("Estado:"), chalk.yellow(nuevoContrato.estado))
    console.log(chalk.cyan("Valor Total:"), chalk.white(`$${nuevoContrato.valorTotal}`))
    console.log(chalk.cyan("Términos de Pago:"), chalk.white(nuevoContrato.terminosPago))
  } catch (error) {
    console.log(chalk.red.bold("\n❌ ERROR AL GENERAR EL CONTRATO"))
    console.log(chalk.red(error.message))
  } finally {
    await cliente.close()
  }
}
