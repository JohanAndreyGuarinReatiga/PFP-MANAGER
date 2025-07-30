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
  if (!fecha) return "N/A"
  return new Date(fecha).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Función para formatear precio
function formatearPrecio(precio) {
  return `$${precio.toLocaleString()}`
}

// Función para mostrar detalles de la propuesta
function mostrarDetallesPropuesta(propuesta) {
  console.log(chalk.blue.bold("\n📋 DETALLES DE LA PROPUESTA\n"))
  console.log(chalk.cyan("Número:"), chalk.white.bold(propuesta.numero))
  console.log(chalk.cyan("Título:"), chalk.white(propuesta.titulo))
  console.log(chalk.cyan("Cliente:"), chalk.white(`${propuesta.cliente.nombre} - ${propuesta.cliente.empresa}`))
  console.log(chalk.cyan("Precio:"), chalk.white(formatearPrecio(propuesta.precio)))
  console.log(chalk.cyan("Estado Actual:"), mostrarEstadoConColor(propuesta.estado))
  console.log(chalk.cyan("Fecha Límite:"), chalk.white(formatearFecha(propuesta.fechaLimite)))
  console.log(chalk.cyan("Fecha Creación:"), chalk.white(formatearFecha(propuesta.fechaCreacion)))
  if (propuesta.fechaCambioEstado) {
    console.log(chalk.cyan("Último Cambio:"), chalk.white(formatearFecha(propuesta.fechaCambioEstado)))
  }
  console.log(chalk.gray("─".repeat(60)))
  console.log(chalk.white(propuesta.descripcion.substring(0, 200) + (propuesta.descripcion.length > 200 ? "..." : "")))
  console.log(chalk.gray("─".repeat(60)))
}

export async function cambiarEstadoPropuesta() {
  const cliente = new MongoClient(process.env.MONGO_URI)

  try {
    await cliente.connect()
    const db = cliente.db(process.env.DB_NAME)
    const servicioPropuesta = new ServicioPropuesta(db)

    console.log(chalk.blue.bold("\n=== CAMBIAR ESTADO DE PROPUESTA ===\n"))

    // Listar propuestas pendientes
    const propuestasPendientes = await servicioPropuesta.listarPropuestasPendientes()

    if (propuestasPendientes.length === 0) {
      console.log(chalk.yellow("📭 No hay propuestas pendientes para cambiar de estado.\n"))
      return
    }

    console.log(chalk.cyan(`Se encontraron ${propuestasPendientes.length} propuestas pendientes:\n`))

    // Mostrar lista de propuestas pendientes
    propuestasPendientes.forEach((propuesta, index) => {
      console.log(
        chalk.white(
          `${index + 1}. ${propuesta.numero} - ${propuesta.titulo} (${propuesta.cliente.nombre}) - ${formatearPrecio(propuesta.precio)}`,
        ),
      )
    })

    const seleccion = await inquirer.prompt([
      {
        type: "list",
        name: "propuestaSeleccionada",
        message: "Selecciona la propuesta a modificar:",
        choices: propuestasPendientes.map((propuesta, index) => ({
          name: `${propuesta.numero} - ${propuesta.titulo} (${propuesta.cliente.nombre})`,
          value: propuesta._id.toString(),
        })),
      },
    ])

    // Buscar la propuesta seleccionada para mostrar detalles
    const propuestaSeleccionada = propuestasPendientes.find((p) => p._id.toString() === seleccion.propuestaSeleccionada)

    // Mostrar detalles de la propuesta
    mostrarDetallesPropuesta(propuestaSeleccionada)

    // Confirmar que quiere cambiar el estado
    const confirmacion = await inquirer.prompt([
      {
        type: "confirm",
        name: "continuar",
        message: "¿Deseas cambiar el estado de esta propuesta?",
        default: true,
      },
    ])

    if (!confirmacion.continuar) {
      console.log(chalk.yellow("\n⏹️  Operación cancelada.\n"))
      return
    }

    // Seleccionar nuevo estado
    const cambioEstado = await inquirer.prompt([
      {
        type: "list",
        name: "nuevoEstado",
        message: "Selecciona el nuevo estado:",
        choices: [
          {
            name: `${chalk.green("✅ Aceptada")} - La propuesta fue aceptada por el cliente`,
            value: "Aceptada",
          },
          {
            name: `${chalk.red("❌ Rechazada")} - La propuesta fue rechazada por el cliente`,
            value: "Rechazada",
          },
        ],
      },
    ])

    // Mostrar advertencia especial para propuestas aceptadas
    if (cambioEstado.nuevoEstado === "Aceptada") {
      console.log(chalk.yellow.bold("\n⚠️  IMPORTANTE:"))
      console.log(chalk.yellow("Al aceptar esta propuesta se creará automáticamente un proyecto."))
      console.log(chalk.yellow("Esta acción no se puede deshacer.\n"))

      const confirmacionFinal = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmarAceptacion",
          message: "¿Estás seguro de que quieres aceptar esta propuesta?",
          default: false,
        },
      ])

      if (!confirmacionFinal.confirmarAceptacion) {
        console.log(chalk.yellow("\n⏹️  Operación cancelada.\n"))
        return
      }
    }

    // Cambiar estado de la propuesta
    console.log(chalk.blue("\n🔄 Procesando cambio de estado..."))

    const resultado = await servicioPropuesta.cambiarEstadoPropuesta(
      seleccion.propuestaSeleccionada,
      cambioEstado.nuevoEstado,
    )

    // Mostrar resultado exitoso
    console.log(chalk.green.bold("\n✅ ESTADO CAMBIADO CON ÉXITO\n"))
    console.log(chalk.cyan("Propuesta:"), chalk.white.bold(resultado.numero))
    console.log(chalk.cyan("Estado Anterior:"), mostrarEstadoConColor("Pendiente"))
    console.log(chalk.cyan("Estado Nuevo:"), mostrarEstadoConColor(resultado.estado))
    console.log(chalk.cyan("Fecha de Cambio:"), chalk.white(formatearFecha(resultado.fechaCambioEstado)))

    // Si se creó un proyecto, mostrar información
    if (cambioEstado.nuevoEstado === "Aceptada") {
      console.log(chalk.green.bold("\n🎉 PROYECTO CREADO AUTOMÁTICAMENTE\n"))
      console.log(chalk.cyan("Se ha generado un nuevo proyecto basado en la propuesta aceptada."))
      console.log(chalk.cyan("Puedes encontrarlo en la sección de proyectos."))
    }

    console.log(chalk.blue.bold("\n📊 RESUMEN:"))
    console.log(chalk.gray("─".repeat(50)))
    console.log(chalk.white(`Propuesta: ${resultado.titulo}`))
    console.log(chalk.white(`Cliente: ${resultado.cliente.nombre}`))
    console.log(chalk.white(`Valor: ${formatearPrecio(resultado.precio)}`))
    console.log(chalk.white(`Estado: ${resultado.estado}`))
    console.log(chalk.gray("─".repeat(50)))
  } catch (error) {
    console.log(chalk.red.bold("\n❌ ERROR AL CAMBIAR ESTADO DE PROPUESTA"))
    console.log(chalk.red(error.message))

    // Mostrar información adicional si es un error de validación
    if (error.message.includes("No se puede cambiar el estado")) {
      console.log(chalk.yellow("\n💡 Recuerda:"))
      console.log(chalk.yellow("• Solo las propuestas 'Pendiente' pueden cambiar de estado"))
      console.log(chalk.yellow("• Las propuestas 'Aceptada' o 'Rechazada' son estados finales"))
    }
  } finally {
    await cliente.close()
  }
}
