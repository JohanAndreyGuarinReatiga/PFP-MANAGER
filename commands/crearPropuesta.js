import inquirer from "inquirer"
import chalk from "chalk"
import { MongoClient } from "mongodb"
import { ServicioPropuesta } from "../services/servicioPropuesta.js"

// Función para mostrar estado con color
function mostrarEstadoConColor(estado) {
  const colores = {
    Pendiente: chalk.yellow,
    Aceptada: chalk.green,
    Rechazada: chalk.red,
  }
  return colores[estado] ? colores[estado](estado) : chalk.white(estado)
}

// Función para formatear fecha
function formatearFecha(fecha) {
  return fecha.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export async function crearPropuesta() {
  const cliente = new MongoClient(process.env.MONGO_URI)

  try {
    await cliente.connect()
    const db = cliente.db(process.env.DB_NAME)
    const servicioPropuesta = new ServicioPropuesta(db)

    console.log(chalk.blue.bold("\n=== CREAR PROPUESTA PARA CLIENTE ===\n"))

    // listar clientes disponibles
    const clientes = await servicioPropuesta.listarClientes()

    if (clientes.length === 0) {
      console.log(chalk.red("No hay clientes registrados. Crea un cliente primero."))
      return
    }

    // Mostrar clientes disponibles
    console.log(chalk.cyan("Clientes disponibles:"))
    clientes.forEach((cliente, index) => {
      console.log(chalk.white(`${index + 1}. ${cliente.nombre} (${cliente.correo})`))
    })
    console.log()

    const respuestas = await inquirer.prompt([
      {
        type: "list",
        name: "clienteSeleccionado",
        message: "Selecciona un cliente:",
        choices: clientes.map((cliente) => ({
          name: `${cliente.nombre} - ${cliente.correo}`,
          value: cliente._id.toString(),
        })),
      },
      {
        type: "input",
        name: "titulo",
        message: "Título de la propuesta:",
        validate: (input) => input.trim().length > 0 || "El título es requerido",
      },
      {
        type: "editor",
        name: "descripcion",
        message: "Descripción detallada de la propuesta:",
        validate: (input) => input.trim().length > 0 || "La descripción es requerida",
      },
      {
        type: "number",
        name: "precio",
        message: "Precio de la propuesta:",
        validate: (input) => {
          if (isNaN(input) || input <= 0) {
            return "El precio debe ser un número mayor a 0"
          }
          return true
        },
      },
      {
        type: "input",
        name: "fechaLimite",
        message: "Fecha límite para respuesta (YYYY-MM-DD):",
        validate: (input) => {
          const fecha = new Date(input)
          if (isNaN(fecha.getTime())) {
            return "Formato de fecha inválido"
          }
          if (fecha <= new Date()) {
            return "La fecha límite debe ser futura"
          }
          return true
        },
      },
      {
        type: "editor",
        name: "condiciones",
        message: "Condiciones y términos de la propuesta:",
        validate: (input) => input.trim().length > 0 || "Las condiciones son requeridas",
      },
    ])

    // Crear
    const nuevaPropuesta = await servicioPropuesta.crearPropuesta({
      clienteId: respuestas.clienteSeleccionado,
      titulo: respuestas.titulo,
      descripcion: respuestas.descripcion,
      precio: respuestas.precio,
      fechaLimite: respuestas.fechaLimite,
      condiciones: respuestas.condiciones,
    })

    // Mostrar resultado 
    console.log(chalk.green.bold("PROPUESTA CREADA CON ÉXITO"))
    console.log(chalk.cyan("Número:"), chalk.white.bold(nuevaPropuesta.numero))
    console.log(chalk.cyan("Título:"), chalk.white(nuevaPropuesta.titulo))
    console.log(
      chalk.cyan("Cliente:"),
      chalk.white(`${nuevaPropuesta.cliente.nombre} (${nuevaPropuesta.cliente.correo})`),
    )
    console.log(chalk.cyan("Precio:"), chalk.white(`$${nuevaPropuesta.precio.toLocaleString()}`))
    console.log(chalk.cyan("Fecha Límite:"), chalk.white(formatearFecha(nuevaPropuesta.fechaLimite)))
    console.log(chalk.cyan("Estado:"), mostrarEstadoConColor(nuevaPropuesta.estado))

    // Mostrar resumen
    console.log(chalk.blue.bold("RESUMEN DE LA PROPUESTA:"))
    console.log(chalk.gray("─".repeat(50)))
    console.log(
      chalk.white(
        nuevaPropuesta.descripcion.substring(0, 200) + (nuevaPropuesta.descripcion.length > 200 ? "..." : ""),
      ),
    )
  } catch (error) {
    console.log(chalk.red.bold("ERROR AL CREAR LA PROPUESTA"))
    console.log(chalk.red(error.message))
  } finally {
    await cliente.close()
  }
}
