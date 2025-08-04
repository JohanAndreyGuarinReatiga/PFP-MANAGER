import inquirer from "inquirer";
import chalk from "chalk";
import { ServicioFinanza } from "../services/servicioFinanzas.js";
import { ProyectoService } from "../services/servicioProyecto.js";

export async function menuFinanzas() {
  const opciones = [
    { name: "➕ Registrar ingreso", value: "ingreso" },
    { name: "➖ Registrar gasto", value: "gasto" },
    { name: "📊 Consultar balance", value: "balance" },
    { name: "💵 Registrar pago recibido", value: "pago" },
    { name: "⬅️ Volver", value: "volver" }
  ];

  const { accion } = await inquirer.prompt({
    type: "list",
    name: "accion",
    message: "Selecciona una acción financiera:",
    choices: opciones
  });

  switch (accion) {
    case "ingreso":
      await registrarIngreso();
      break;
    case "gasto":
      await registrarGasto();
      break;
    case "balance":
      await consultarBalance();
      break;
    case "pago":
      await registrarPagoRecibido();
      break;
    case "volver":
      return;
  }

  await menuFinanzas();
}

async function registrarIngreso() {
    const { proyectoId, descripcion, monto, fecha, categoria } = await solicitarDatosFinanza("ingreso");
  
    const ingreso = {
      proyectoId,
      descripcion,
      monto,
      fecha,
      categoria
    };
  
    try {
      await ServicioFinanza.registrarIngreso(ingreso);
      console.log(chalk.green("✅ Ingreso registrado correctamente."));
    } catch (e) {
      console.error(chalk.red("❌ Error:"), e.message);
    }
  }
  

async function registrarGasto() {
  const { proyectoId, descripcion, monto, fecha, categoria } = await solicitarDatosFinanza("egreso");
  try {
    await ServicioFinanza.registrarGasto({ proyectoId, descripcion, monto, fecha, categoria });
    console.log(chalk.green("✅ Gasto registrado correctamente."));
  } catch (e) {
    console.error(chalk.red("❌ Error:"), e.message);
  }
}

async function registrarPagoRecibido() {
  const proyectos = await ProyectoService.listarProyectos();
  const { proyectoId } = await inquirer.prompt({
    type: "list",
    name: "proyectoId",
    message: "Selecciona el proyecto:",
    choices: proyectos.map(p => ({ name: `${p.nombre} (${p.codigoProyecto})`, value: p._id }))
  });

  const { descripcion, monto, fecha } = await inquirer.prompt([
    { name: "descripcion", message: "Descripción del pago:" },
    { name: "monto", message: "Monto:", validate: v => parseFloat(v) > 0 || "Debe ser mayor que 0" },
    { name: "fecha", message: "Fecha (YYYY-MM-DD):", default: new Date().toISOString().slice(0, 10) }
  ]);

  try {
    await ServicioFinanza.registrarPagoRecibido({
      proyectoId,
      descripcion,
      monto: parseFloat(monto),
      fecha: new Date(fecha),
    });
    console.log(chalk.green("✅ Pago recibido registrado correctamente."));
  } catch (e) {
    console.error(chalk.red("❌ Error:"), e.message);
  }
}

async function consultarBalance() {
  const filtros = await inquirer.prompt([
    { name: "desde", message: "Fecha desde (YYYY-MM-DD):", default: "" },
    { name: "hasta", message: "Fecha hasta (YYYY-MM-DD):", default: "" },
    { name: "clienteId", message: "ID del cliente (opcional):", default: "" },
    { name: "proyectoId", message: "ID del proyecto (opcional):", default: "" },
  ]);

  try {
    const resumen = await ServicioFinanza.consultarBalance({
      desde: filtros.desde || null,
      hasta: filtros.hasta || null,
      clienteId: filtros.clienteId || null,
      proyectoId: filtros.proyectoId || null,
    });
    console.log(chalk.blue("\n📊 Resumen financiero:"));
    console.log(`Ingresos: $${resumen.ingresos.toFixed(2)}`);
    console.log(`Egresos:  $${resumen.egresos.toFixed(2)}`);
    console.log(`Balance:  $${resumen.balance.toFixed(2)}\n`);
  } catch (e) {
    console.error(chalk.red("❌ Error al consultar balance:"), e.message);
  }
}

async function solicitarDatosFinanza(tipo) {
  const { asociar, proyectoId, descripcion, monto, fecha, categoria } = await inquirer.prompt([
    {
      type: "confirm",
      name: "asociar",
      message: "¿Desea asociar a un proyecto?",
      default: false
    },
    {
      type: "input",
      name: "proyectoId",
      message: "ID del proyecto:",
      when: a => a.asociar
    },
    { name: "descripcion", message: "Descripción:" },
    {
      name: "monto",
      message: "Monto:",
      validate: v => parseFloat(v) > 0 || "Debe ser mayor que 0"
    },
    {
      name: "fecha",
      message: "Fecha (YYYY-MM-DD):",
      default: new Date().toISOString().slice(0, 10)
    },
    {
      type: "list",
      name: "categoria",
      message: "Categoría:",
      choices: tipo === "egreso"
        ? ["herramientas", "marketing", "oficina", "otros"]
        : ["proyecto", "cliente", "bono", "otros"],
    }
  ]);

  return {
    proyectoId: proyectoId || null,
    descripcion,
    monto: parseFloat(monto),
    fecha: new Date(fecha),
    categoria
  };
}
