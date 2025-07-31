import inquirer from "inquirer"
import chalk from "chalk"
import { MongoClient, ObjectId } from "mongodb"
import { ServicioProyecto } from "../services/servicioProyecto.js"
import { ServicioPropuesta } from "../services/servicioPropuesta.js"

// Función para formatear fecha
function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

// Función para formatear precio
function formatearPrecio(precio) {
  return `$${precio.toLocaleString()}`
}

export async function crearProyecto() {
  const cliente = new MongoClient(process.env.MONGO_URI)

  try {
    await cliente.connect()
    const db = cliente.db(process.env.DB_NAME)
    const servicioProyecto = new ServicioProyecto(db)

    console.log(chalk.blue.bold("\n=== CREAR PROYECTO MANUALMENTE ===\n"))

    const respuestas = await inquirer.prompt([
      {
        type: "input",
        name: "clienteId",
        message: "ID del cliente:",
        validate: (input) => {
          if (!ObjectId.isValid(input)) {
            return "El ID del cliente debe ser un ObjectId válido"
          }
          return true
        },
      },
      {
        type: "input",
        name: "nombre",
        message: "Nombre del proyecto:",
        validate: (input) => input.trim().length > 0 || "El nombre es requerido",
      },
      {
        type: "editor",
        name: "descripcion",
        message: "Descripción del proyecto:",
        default: "",
      },
      {
        type: "input",
        name: "fechaInicio",
        message: "Fecha de inicio (YYYY-MM-DD):",
        validate: (input) => {
          const fecha = new Date(input)
          if (isNaN(fecha.getTime())) {
            return "Formato de fecha inválido"
          }
          return true
        },
      },
      {
        type: "input",
        name: "fechaFin",
        message: "Fecha de fin (YYYY-MM-DD, opcional):",
        validate: (input) => {
          if (!input) return true // Opcional, permite vacío
          const fecha = new Date(input)
          if (isNaN(fecha.getTime())) {
            return "Formato de fecha inválido"
          }
          return true
        },
      },
      {
        type: "number",
        name: "valor",
        message: "Valor del proyecto:",
        validate: (input) => {
          if (isNaN(input) || input < 0) {
            return "El valor debe ser un número mayor o igual a 0"
          }
          return true
        },
      },
    ])

    const nuevoProyecto = await servicioProyecto.crearProyecto({
      clienteId: respuestas.clienteId,
      nombre: respuestas.nombre,
      descripcion: respuestas.descripcion,
      fechaInicio: respuestas.fechaInicio,
      fechaFin: respuestas.fechaFin || null,
      valor: respuestas.valor,
    })

    console.log(chalk.green.bold("\n✅ PROYECTO CREADO CON ÉXITO\n"))
    console.log(chalk.cyan("ID:"), chalk.white.bold(nuevoProyecto._id))
    console.log(chalk.cyan("Nombre:"), chalk.white(nuevoProyecto.nombre))
    console.log(chalk.cyan("Fecha Inicio:"), chalk.white(formatearFecha(nuevoProyecto.fechaInicio)))
    console.log(chalk.cyan("Valor:"), chalk.white(formatearPrecio(nuevoProyecto.valor)))
  } catch (error) {
    console.log(chalk.red.bold("\n❌ ERROR AL CREAR EL PROYECTO"))
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
    const servicioPropuesta = new ServicioPropuesta(db)

    console.log(chalk.blue.bold("\n=== CREAR PROYECTO DESDE PROPUESTA ACEPTADA ===\n"))

    const respuestas = await inquirer.prompt([
      {
        type: "input",
        name: "propuestaId",
        message: "ID de la propuesta aceptada:",
        validate: async (input) => {
          if (!ObjectId.isValid(input)) {
            return "El ID de la propuesta debe ser un ObjectId válido"
          }
          try {
            const propuesta = await servicioPropuesta.buscarPropuestaPorId(input)
            if (propuesta.estado !== "Aceptada") {
              return "La propuesta debe estar en estado 'Aceptada'"
            }
            return true
          } catch (error) {
            return "Propuesta no encontrada"
          }
        },
      },
      {
        type: "input",
        name: "clienteId",
        message: "ID del cliente:",
        validate: (input) => {
          if (!ObjectId.isValid(input)) {
            return "El ID del cliente debe ser un ObjectId válido"
          }
          return true
        },
      },
    ])

    const nuevoProyecto = await servicioProyecto.crearProyectoPorPropuesta(respuestas.propuestaId, respuestas.clienteId)

    console.log(chalk.green.bold("\n✅ PROYECTO CREADO CON ÉXITO A PARTIR DE PROPUESTA\n"))
    console.log(chalk.cyan("ID:"), chalk.white.bold(nuevoProyecto._id))
    console.log(chalk.cyan("Nombre:"), chalk.white(nuevoProyecto.nombre))
  } catch (error) {
    console.log(chalk.red.bold("\n❌ ERROR AL CREAR EL PROYECTO DESDE PROPUESTA"))
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

    console.log(chalk.blue.bold("\n=== GENERAR CONTRATO PARA PROYECTO ===\n"))

    const respuestas = await inquirer.prompt([
      {
        type: "input",
        name: "proyectoId",
        message: "ID del proyecto:",
        validate: (input) => {
          if (!ObjectId.isValid(input)) {
            return "El ID del proyecto debe ser un ObjectId válido"
          }
          return true
        },
      },
      {
        type: "editor",
        name: "condiciones",
        message: "Condiciones del contrato:",
        validate: (input) => input.trim().length > 0 || "Las condiciones son requeridas",
      },
      {
        type: "input",
        name: "fechaInicio",
        message: "Fecha de inicio (YYYY-MM-DD):",
        validate: (input) => {
          const fecha = new Date(input)
          if (isNaN(fecha.getTime())) {
            return "Formato de fecha inválido"
          }
          return true
        },
      },
      {
        type: "input",
        name: "fechaFin",
        message: "Fecha de fin (YYYY-MM-DD):",
        validate: (input) => {
          const fecha = new Date(input)
          if (isNaN(fecha.getTime())) {
            return "Formato de fecha inválido"
          }
          return true
        },
      },
      {
        type: "number",
        name: "valorTotal",
        message: "Valor total del contrato:",
        validate: (input) => {
          if (isNaN(input) || input <= 0) {
            return "El valor debe ser un número mayor a 0"
          }
          return true
        },
      },
      {
        type: "editor",
        name: "terminosPago",
        message: "Términos de pago:",
        validate: (input) => input.trim().length > 0 || "Los términos de pago son requeridos",
      },
    ])

    const nuevoContrato = await servicioProyecto.generarContrato({
      proyectoId: respuestas.proyectoId,
      condiciones: respuestas.condiciones,
      fechaInicio: respuestas.fechaInicio,
      fechaFin: respuestas.fechaFin,
      valorTotal: respuestas.valorTotal,
      terminosPago: respuestas.terminosPago,
    })

    console.log(chalk.green.bold("\n✅ CONTRATO GENERADO CON ÉXITO\n"))
    console.log(chalk.cyan("ID:"), chalk.white.bold(nuevoContrato._id))
  } catch (error) {
    console.log(chalk.red.bold("\n❌ ERROR AL GENERAR EL CONTRATO"))
    console.log(chalk.red(error.message))
  } finally {
    await cliente.close()
  }
}

