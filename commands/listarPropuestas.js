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
