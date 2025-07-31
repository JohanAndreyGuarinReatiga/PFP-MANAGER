import inquirer from "inquirer"
import chalk from "chalk"
import { MongoClient } from "mongodb"
import { ServicioProyecto } from "../services/servicioProyecto.js"

// Función para mostrar estado con color
function mostrarEstadoConColor(estado) {
  const colores = {
    Activo: chalk.green,
    Pausado: chalk.yellow,
    Finalizado: chalk.blue,
    Cancelado: chalk.red,
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
  })
}

// Función para formatear precio
function formatearPrecio(precio) {
  return `$${precio.toLocaleString()}`
}

// Función para mostrar barra de progreso
function mostrarBarraProgreso(progreso) {
  const ancho = 20
  const completado = Math.round((progreso / 100) * ancho)
  const pendiente = ancho - completado

  let color = chalk.red
  if (progreso >= 70) color = chalk.green
  else if (progreso >= 40) color = chalk.yellow

  const barra = color("█".repeat(completado)) + chalk.gray("░".repeat(pendiente))
  return `${barra} ${progreso}%`
}

// Función para calcular duración del proyecto
function calcularDuracion(fechaInicio, fechaFin) {
  if (!fechaInicio) return "N/A"

  const inicio = new Date(fechaInicio)
  const fin = fechaFin ? new Date(fechaFin) : new Date()
  const diferencia = fin.getTime() - inicio.getTime()
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24))

  if (dias < 30) return `${dias} días`
  if (dias < 365) return `${Math.round(dias / 30)} meses`
  return `${Math.round(dias / 365)} años`
}

// Función para mostrar tabla de proyectos
function mostrarTablaProyectos(proyectos) {
  if (proyectos.length === 0) {
    console.log(chalk.yellow("\n📭 No se encontraron proyectos con los filtros aplicados.\n"))
    return
  }

  console.log(chalk.blue.bold("\n🚀 LISTADO DE PROYECTOS\n"))

  proyectos.forEach((proyecto, index) => {
    console.log(chalk.cyan.bold(`\n${index + 1}. ${proyecto.codigoProyecto}`))
    console.log(chalk.gray("─".repeat(80)))

    // Información básica
    console.log(chalk.white.bold(`📋 ${proyecto.nombre}`))
    console.log(
      chalk.cyan("Cliente: ") +
        chalk.white(`${proyecto.cliente.nombre} (${proyecto.cliente.empresa || "Sin empresa"})`),
    )
    console.log(chalk.cyan("Estado: ") + mostrarEstadoConColor(proyecto.estado))
    console.log(chalk.cyan("Valor: ") + chalk.white(formatearPrecio(proyecto.valor)))

    // Fechas
    console.log(chalk.cyan("Inicio: ") + chalk.white(formatearFecha(proyecto.fechaInicio)))
    console.log(chalk.cyan("Fin: ") + chalk.white(formatearFecha(proyecto.fechaFin)))
    console.log(chalk.cyan("Duración: ") + chalk.white(calcularDuracion(proyecto.fechaInicio, proyecto.fechaFin)))

    // Progreso
    console.log(chalk.cyan("Progreso: ") + mostrarBarraProgreso(proyecto.progreso))

    // Avances
    if (proyecto.avances && proyecto.avances.length > 0) {
      console.log(chalk.cyan("Avances: ") + chalk.white(`${proyecto.avances.length} registrados`))
      console.log(
        chalk.gray("Último: ") +
          chalk.white(proyecto.avances[proyecto.avances.length - 1]?.descripcion?.substring(0, 50) + "..."),
      )
    } else {
      console.log(chalk.cyan("Avances: ") + chalk.gray("Sin avances registrados"))
    }

    // Contrato
    if (proyecto.contrato && proyecto.contrato.length > 0) {
      console.log(chalk.cyan("Contrato: ") + chalk.green("✅ Generado"))
    } else {
      console.log(chalk.cyan("Contrato: ") + chalk.yellow("⏳ Pendiente"))
    }

    // Descripción (truncada)
    if (proyecto.descripcion) {
      console.log(
        chalk.gray("Descripción: ") +
          chalk.white(proyecto.descripcion.substring(0, 100) + (proyecto.descripcion.length > 100 ? "..." : "")),
      )
    }
  })

  console.log(chalk.gray("\n" + "─".repeat(80)))
}

// Función para mostrar información de paginación
function mostrarInfoPaginacion(paginacion) {
  const { paginaActual, totalPaginas, total, limite } = paginacion

  console.log(chalk.blue(`\n📄 Página ${paginaActual} de ${totalPaginas}`))
  console.log(chalk.gray(`Total de proyectos: ${total} | Mostrando: ${Math.min(limite, total)} por página`))
}

// Función para mostrar estadísticas
function mostrarEstadisticas(estadisticas) {
  console.log(chalk.blue.bold("\n📊 ESTADÍSTICAS DE PROYECTOS\n"))

  let totalProyectos = 0
  let valorTotal = 0

  Object.entries(estadisticas).forEach(([estado, datos]) => {
    totalProyectos += datos.count
    valorTotal += datos.totalValor

    const estadoColoreado = mostrarEstadoConColor(estado)
    const porcentaje = totalProyectos > 0 ? Math.round((datos.count / totalProyectos) * 100) : 0

    console.log(`${estadoColoreado}: ${datos.count} proyectos (${porcentaje}%) - ${formatearPrecio(datos.totalValor)}`)
  })

  console.log(chalk.gray("─".repeat(60)))
  console.log(chalk.white.bold(`Total: ${totalProyectos} proyectos - ${formatearPrecio(valorTotal)}`))
  console.log()
}

// Función para mostrar resumen de filtros activos
function mostrarFiltrosActivos(opciones) {
  const filtrosActivos = []

  if (opciones.filtroEstado && opciones.filtroEstado !== "todos") {
    filtrosActivos.push(`Estado: ${mostrarEstadoConColor(opciones.filtroEstado)}`)
  }

  if (opciones.filtroCliente && opciones.filtroCliente !== "todos") {
    filtrosActivos.push(`Cliente: ${opciones.nombreClienteFiltro}`)
  }

  if (filtrosActivos.length > 0) {
    console.log(chalk.blue.bold("🔍 FILTROS ACTIVOS:"))
    filtrosActivos.forEach((filtro) => console.log(`  • ${filtro}`))
    console.log()
  }
}

export async function listarProyectos() {
  const cliente = new MongoClient(process.env.MONGO_URI)

  try {
    await cliente.connect()
    const db = cliente.db(process.env.DB_NAME)
    const servicioProyecto = new ServicioProyecto(db)

    console.log(chalk.blue.bold("\n=== VER TODOS MIS PROYECTOS ===\n"))

    // Obtener clientes y estadísticas
    const clientes = await servicioProyecto.listarClientesConProyectos()
    const estadisticas = await servicioProyecto.obtenerEstadisticasProyectos()

    // Mostrar estadísticas primero
    mostrarEstadisticas(estadisticas)

    let continuar = true
    const opciones = {
      filtroEstado: null,
      filtroCliente: null,
      nombreClienteFiltro: null,
      ordenarPor: "fechaInicio",
      orden: -1,
      pagina: 1,
      limite: 5, // Menos proyectos por página para mejor visualización
    }

    while (continuar) {
      // Configurar filtros y opciones
      const configuracion = await inquirer.prompt([
        {
          type: "list",
          name: "filtroEstado",
          message: "Filtrar por estado:",
          choices: [
            { name: "Todos los estados", value: "todos" },
            { name: `${chalk.green("🟢")} Activos`, value: "Activo" },
            { name: `${chalk.yellow("🟡")} Pausados`, value: "Pausado" },
            { name: `${chalk.blue("🔵")} Finalizados`, value: "Finalizado" },
            { name: `${chalk.red("🔴")} Cancelados`, value: "Cancelado" },
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
              name: `${cliente.nombre} - ${cliente.empresa || "Sin empresa"} (${cliente.totalProyectos} proyectos)`,
              value: cliente._id.toString(),
              short: cliente.nombre,
            })),
          ],
          default: opciones.filtroCliente || "todos",
        },
        {
          type: "list",
          name: "ordenamiento",
          message: "Ordenar por:",
          choices: [
            { name: "📅 Fecha de inicio (más reciente primero)", value: "fechaInicio_desc" },
            { name: "📅 Fecha de inicio (más antigua primero)", value: "fechaInicio_asc" },
            { name: "📈 Progreso (mayor a menor)", value: "progreso_desc" },
            { name: "📈 Progreso (menor a mayor)", value: "progreso_asc" },
            { name: "💰 Valor (mayor a menor)", value: "valor_desc" },
            { name: "💰 Valor (menor a mayor)", value: "valor_asc" },
            { name: "🏷️ Estado", value: "estado_asc" },
            { name: "👤 Cliente", value: "cliente.nombre_asc" },
          ],
          default: "fechaInicio_desc",
        },
        {
          type: "number",
          name: "limite",
          message: "Proyectos por página:",
          default: opciones.limite,
          validate: (input) => (input > 0 && input <= 20) || "Debe ser entre 1 y 20",
        },
      ])

      // Procesar ordenamiento
      const [campo, direccion] = configuracion.ordenamiento.split("_")
      opciones.filtroEstado = configuracion.filtroEstado
      opciones.filtroCliente = configuracion.filtroCliente
      opciones.ordenarPor = campo
      opciones.orden = direccion === "desc" ? -1 : 1
      opciones.limite = configuracion.limite
      opciones.pagina = 1 // Resetear a primera página con nuevos filtros

      // Guardar nombre del cliente para mostrar en filtros activos
      if (configuracion.filtroCliente !== "todos") {
        const clienteSeleccionado = clientes.find((c) => c._id.toString() === configuracion.filtroCliente)
        opciones.nombreClienteFiltro = clienteSeleccionado?.nombre
      } else {
        opciones.nombreClienteFiltro = null
      }

      // Obtener proyectos
      const resultado = await servicioProyecto.listarProyectosCompleto(opciones)

      // Mostrar filtros activos
      mostrarFiltrosActivos(opciones)

      // Mostrar proyectos
      mostrarTablaProyectos(resultado.proyectos)
      mostrarInfoPaginacion(resultado.paginacion)

      // Opciones de navegación
      const navegacionOpciones = [
        { name: "🔄 Cambiar filtros y ordenamiento", value: "filtros" },
        { name: "🏠 Volver al menú principal", value: "salir" },
      ]

      if (resultado.paginacion.tieneSiguiente) {
        navegacionOpciones.unshift({ name: "➡️ Página siguiente", value: "siguiente" })
      }

      if (resultado.paginacion.tieneAnterior) {
        navegacionOpciones.unshift({ name: "⬅️ Página anterior", value: "anterior" })
      }

      if (resultado.proyectos.length > 0) {
        navegacionOpciones.splice(-1, 0, { name: "🔍 Ver detalles de un proyecto", value: "detalles" })
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
          const resultadoSiguiente = await servicioProyecto.listarProyectosCompleto(opciones)
          mostrarFiltrosActivos(opciones)
          mostrarTablaProyectos(resultadoSiguiente.proyectos)
          mostrarInfoPaginacion(resultadoSiguiente.paginacion)
          break

        case "anterior":
          opciones.pagina--
          const resultadoAnterior = await servicioProyecto.listarProyectosCompleto(opciones)
          mostrarFiltrosActivos(opciones)
          mostrarTablaProyectos(resultadoAnterior.proyectos)
          mostrarInfoPaginacion(resultadoAnterior.paginacion)
          break

        case "detalles":
          await mostrarDetallesProyecto(resultado.proyectos, servicioProyecto)
          break

        case "filtros":
          break

        case "salir":
          continuar = false
          break
      }
    }
  } catch (error) {
    console.log(chalk.red.bold("\n❌ ERROR AL LISTAR PROYECTOS"))
    console.log(chalk.red(error.message))
  } finally {
    await cliente.close()
  }
}

// Función auxiliar para mostrar detalles de un proyecto específico
async function mostrarDetallesProyecto(proyectos, servicioProyecto) {
  const { proyectoSeleccionado } = await inquirer.prompt([
    {
      type: "list",
      name: "proyectoSeleccionado",
      message: "Selecciona un proyecto para ver detalles:",
      choices: proyectos.map((proyecto, index) => ({
        name: `${proyecto.codigoProyecto} - ${proyecto.nombre} (${proyecto.cliente.nombre})`,
        value: index,
      })),
    },
  ])

  const proyecto = proyectos[proyectoSeleccionado]

  console.log(chalk.blue.bold("\n📋 DETALLES COMPLETOS DEL PROYECTO\n"))
  console.log(chalk.cyan("Código:"), chalk.white.bold(proyecto.codigoProyecto))
  console.log(chalk.cyan("Nombre:"), chalk.white.bold(proyecto.nombre))
  console.log(
    chalk.cyan("Cliente:"),
    chalk.white(`${proyecto.cliente.nombre} - ${proyecto.cliente.empresa || "Sin empresa"}`),
  )
  console.log(chalk.cyan("Email:"), chalk.white(proyecto.cliente.correo))
  console.log(chalk.cyan("Teléfono:"), chalk.white(proyecto.cliente.telefono || "N/A"))
  console.log(chalk.cyan("Estado:"), mostrarEstadoConColor(proyecto.estado))
  console.log(chalk.cyan("Valor:"), chalk.white(formatearPrecio(proyecto.valor)))
  console.log(chalk.cyan("Fecha Inicio:"), chalk.white(formatearFecha(proyecto.fechaInicio)))
  console.log(chalk.cyan("Fecha Fin:"), chalk.white(formatearFecha(proyecto.fechaFin)))
  console.log(chalk.cyan("Duración:"), chalk.white(calcularDuracion(proyecto.fechaInicio, proyecto.fechaFin)))
  console.log(chalk.cyan("Progreso:"), mostrarBarraProgreso(proyecto.progreso))
  console.log(chalk.cyan("Fecha Creación:"), chalk.white(formatearFecha(proyecto.fechaCreacion)))

  if (proyecto.descripcion) {
    console.log(chalk.cyan("\nDescripción:"))
    console.log(chalk.white(proyecto.descripcion))
  }

  if (proyecto.avances && proyecto.avances.length > 0) {
    console.log(chalk.cyan(`\nAvances (${proyecto.avances.length}):`))
    proyecto.avances.slice(-5).forEach((avance, index) => {
      console.log(chalk.gray(`  ${index + 1}. ${formatearFecha(avance.fecha)}: ${avance.descripcion}`))
    })
    if (proyecto.avances.length > 5) {
      console.log(chalk.gray(`  ... y ${proyecto.avances.length - 5} avances más`))
    }
  }

  console.log(chalk.gray("\n" + "─".repeat(80)))

  await inquirer.prompt([
    {
      type: "input",
      name: "continuar",
      message: "Presiona Enter para continuar...",
    },
  ])
}
