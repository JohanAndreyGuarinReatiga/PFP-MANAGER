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

// Función para mostrar tabla de propuestas
function mostrarTablaPropuestas(propuestas) {
  if (propuestas.length === 0) {
    console.log(chalk.yellow("\n📭 No se encontraron propuestas con los filtros aplicados.\n"))
    return
  }

  console.log(chalk.blue.bold("\n📋 LISTADO DE PROPUESTAS\n"))

  // Encabezados de la tabla
  console.log(
    chalk.cyan.bold(
      "Número".padEnd(18) +
        "Cliente".padEnd(25) +
        "Título".padEnd(30) +
        "Precio".padEnd(15) +
        "Estado".padEnd(12) +
        "Fecha",
    ),
  )
  console.log(chalk.gray("─".repeat(120)))

  // Filas de datos
  propuestas.forEach((propuesta) => {
    const numero = propuesta.numero.padEnd(18)
    const cliente = (propuesta.cliente.nombre.substring(0, 22) + "...").padEnd(25)
    const titulo = (propuesta.titulo.substring(0, 27) + "...").padEnd(30)
    const precio = formatearPrecio(propuesta.precio).padEnd(15)
    const estado = mostrarEstadoConColor(propuesta.estado).padEnd(12)
    const fecha = formatearFecha(propuesta.fechaCreacion)

    console.log(`${numero}${cliente}${titulo}${precio}${estado}${fecha}`)
  })

  console.log(chalk.gray("─".repeat(120)))
}

function mostrarInfoPaginacion(paginacion) {
  const { paginaActual, totalPaginas, total, limite } = paginacion

  console.log(chalk.blue(`\n📄 Página ${paginaActual} de ${totalPaginas}`))
  console.log(chalk.gray(`Total de propuestas: ${total} | Mostrando: ${Math.min(limite, total)} por página`))
}

function mostrarEstadisticas(estadisticas) {
  console.log(chalk.blue.bold("ESTADÍSTICAS DE PROPUESTAS"))

  Object.entries(estadisticas).forEach(([estado, datos]) => {
    const estadoColoreado = mostrarEstadoConColor(estado)
    console.log(`${estadoColoreado}: ${datos.count} propuestas - ${formatearPrecio(datos.totalValor)}`)
  })
  console.log()
}
// funcion listar propuestas
export async function listarPropuestas() {
  const cliente = new MongoClient(process.env.MONGO_URI)

  try {
    await cliente.connect()
    const db = cliente.db(process.env.DB_NAME)
    const servicioPropuesta = new ServicioPropuesta(db)

    console.log(chalk.blue.bold("\n=== VER TODAS MIS PROPUESTAS ===\n"))

    // Obtener clientes para filtros
    const clientes = await servicioPropuesta.listarClientes()

    // Mostrar estadísticas primero
    const estadisticas = await servicioPropuesta.obtenerEstadisticas()
    mostrarEstadisticas(estadisticas)

    let continuar = true
    const opciones = {
      filtroEstado: null,
      filtroCliente: null,
      ordenarPor: "fechaCreacion",
      orden: -1,
      pagina: 1,
      limite: 10,
    }

    while (continuar) {
      // filtros y opciones
      const configuracion = await inquirer.prompt([
        {
          type: "list",
          name: "filtroEstado",
          message: "Filtrar por estado:",
          choices: [
            { name: "Todos los estados", value: "todos" },
            { name: "Pendientes", value: "Pendiente" },
            { name: "Aceptadas", value: "Aceptada" },
            { name: "Rechazadas", value: "Rechazada" },
          ],
          default: opciones.filtroEstado || "todos",
        },
        {
          type: "list",
          name: "filtroCliente",
          message: "Filtrar por cliente:",
          choices: [
            { name: "Todos los clientes", value: "todos" },
            ...clientes.map((cliente) => ({
              name: `${cliente.nombre} - ${cliente.empresa}`,
              value: cliente._id.toString(),
            })),
          ],
          default: opciones.filtroCliente || "todos",
        },
        {
          type: "list",
          name: "ordenamiento",
          message: "Ordenar por:",
          choices: [
            { name: "Fecha de creación (más reciente primero)", value: "fechaCreacion_desc" },
            { name: "Fecha de creación (más antigua primero)", value: "fechaCreacion_asc" },
            { name: "Precio (mayor a menor)", value: "precio_desc" },
            { name: "Precio (menor a mayor)", value: "precio_asc" },
            { name: "Estado", value: "estado_asc" },
          ],
          default: "fechaCreacion_desc",
        },
        {
          type: "number",
          name: "limite",
          message: "Propuestas por página:",
          default: opciones.limite,
          validate: (input) => (input > 0 && input <= 50) || "Debe ser entre 1 y 50",
        },
      ])

      //  ordenamiento
      const [campo, direccion] = configuracion.ordenamiento.split("_")
      opciones.filtroEstado = configuracion.filtroEstado
      opciones.filtroCliente = configuracion.filtroCliente
      opciones.ordenarPor = campo
      opciones.orden = direccion === "desc" ? -1 : 1
      opciones.limite = configuracion.limite
      opciones.pagina = 1 // Resetear a primera página con nuevos filtros

      const resultado = await servicioPropuesta.listarPropuestas(opciones)
      mostrarTablaPropuestas(resultado.propuestas)
      mostrarInfoPaginacion(resultado.paginacion)

      const navegacionOpciones = [
        { name: "Cambiar filtros", value: "filtros" },
        { name: "Volver al menú principal", value: "salir" },
      ]

      if (resultado.paginacion.tieneSiguiente) {
        navegacionOpciones.unshift({ name: "Página siguiente", value: "siguiente" })
      }

      if (resultado.paginacion.tieneAnterior) {
        navegacionOpciones.unshift({ name: "Página anterior", value: "anterior" })
      }

      const { accion } = await inquirer.prompt([
        {
          type: "list",
          name: "accion",
          message: "¿Qué deseas hacer?",
          choices: navegacionOpciones,
        },
      ])

      switch (accion) {
        case "siguiente":
          opciones.pagina++
          const resultadoSiguiente = await servicioPropuesta.listarPropuestas(opciones)
          mostrarTablaPropuestas(resultadoSiguiente.propuestas)
          mostrarInfoPaginacion(resultadoSiguiente.paginacion)
          break
        case "anterior":
          opciones.pagina--
          const resultadoAnterior = await servicioPropuesta.listarPropuestas(opciones)
          mostrarTablaPropuestas(resultadoAnterior.propuestas)
          mostrarInfoPaginacion(resultadoAnterior.paginacion)
          break
        case "filtros":
          break
        case "salir":
          continuar = false
          break
      }
    }
  } catch (error) {
    console.log(chalk.red.bold("ERROR AL LISTAR PROPUESTAS"))
    console.log(chalk.red(error.message))
  } finally {
    await cliente.close()
  }
}
