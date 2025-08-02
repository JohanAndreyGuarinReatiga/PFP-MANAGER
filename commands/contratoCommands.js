// commands/contratoCommands.js
import inquirer from 'inquirer';
import chalk from 'chalk';
import dayjs from 'dayjs';
import { ContratoService } from '../services/servicioContrato.js';
import { ProyectoService } from '../services/servicioProyecto.js';

export async function gestionarContratos() {
  const { accion } = await inquirer.prompt([
    {
      type: 'list',
      name: 'accion',
      message: '¿Qué deseas hacer con los contratos?',
      choices: [
        { name: '📄 Crear contrato', value: 'crear' },
        { name: '✏️ Modificar contrato (solo si está en borrador)', value: 'modificar' },
        { name: '🖋️ Firmar contrato', value: 'firmar' },
        { name: '❌ Cancelar contrato', value: 'cancelar' },
        { name: '📋 Listar contratos', value: 'listar' }
      ]
    }
  ]);

  switch (accion) {
    case 'crear':
      await crearContrato();
      break;
    case 'modificar':
      await modificarContrato();
      break;
    case 'firmar':
      await firmarContrato();
      break;
    case 'cancelar':
      await cancelarContrato();
      break;
    case 'listar':
      await listarContratos();
      break;
  }
}

async function crearContrato() {
  try {
    const proyectos = await ProyectoService.listarProyectos();
    if (!proyectos.length) {
      console.log(chalk.red("❌ No hay proyectos disponibles."));
      return;
    }

    const { proyectoId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'proyectoId',
        message: 'Selecciona el proyecto asociado:',
        choices: proyectos.map(p => ({
          name: `${p.nombre} (${dayjs(p.fechaInicio).format("DD/MM/YYYY")} - ${dayjs(p.fechaFin).format("DD/MM/YYYY")})`,
          value: p._id.toString()
        }))
      }
    ]);

    const respuestas = await inquirer.prompt([
      { type: 'input', name: 'condiciones', message: 'Condiciones del contrato:', validate: i => i.trim().length >= 10 || 'Mínimo 10 caracteres.' },
      { type: 'input', name: 'fechaInicio', message: 'Fecha de inicio (YYYY-MM-DD):', validate: i => dayjs(i, 'YYYY-MM-DD', true).isValid() || 'Formato inválido.' },
      { type: 'input', name: 'fechaFin', message: 'Fecha de fin (YYYY-MM-DD):', validate: i => dayjs(i, 'YYYY-MM-DD', true).isValid() || 'Formato inválido.' },
      { type: 'number', name: 'valorTotal', message: 'Valor total del contrato:', validate: i => i > 0 || 'Debe ser mayor a 0.' },
      { type: 'input', name: 'terminosPago', message: 'Términos de pago:', validate: i => i.trim().length >= 5 || 'Mínimo 5 caracteres.' },
    ]);

    const contratoData = {
      ...respuestas,
      proyectoId,
      fechaInicio: new Date(respuestas.fechaInicio),
      fechaFin: new Date(respuestas.fechaFin)
    };

    const resultado = await ContratoService.crearContrato(contratoData);
    console.log(chalk.green("✅ Contrato creado:"), resultado);

  } catch (error) {
    console.error(chalk.red("⚠️ Error al crear contrato:"), error.message);
  }
}

async function modificarContrato() {
  try {
    const contratos = await ContratoService.listarContratos({ estado: 'borrador' });
    if (!contratos.length) {
      console.log(chalk.yellow("⚠️ No hay contratos en estado 'borrador'."));
      return;
    }

    const { contratoId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'contratoId',
        message: 'Selecciona un contrato para modificar:',
        choices: contratos.map(c => ({
          name: `${c.numero} - Proyecto: ${c.proyectoId} (${c.estado})`,
          value: c._id.toString()
        }))
      }
    ]);

    const cambios = await inquirer.prompt([
      { type: 'input', name: 'condiciones', message: 'Nuevas condiciones (deja vacío para mantener):' },
      { type: 'input', name: 'fechaInicio', message: 'Nueva fecha inicio (YYYY-MM-DD):' },
      { type: 'input', name: 'fechaFin', message: 'Nueva fecha fin (YYYY-MM-DD):' },
      { type: 'number', name: 'valorTotal', message: 'Nuevo valor total (0 para mantener):' },
      { type: 'input', name: 'terminosPago', message: 'Nuevos términos de pago (vacío para mantener):' },
    ]);

    const cambiosFiltrados = {};
    if (cambios.condiciones) cambiosFiltrados.condiciones = cambios.condiciones;
    if (cambios.fechaInicio) cambiosFiltrados.fechaInicio = new Date(cambios.fechaInicio);
    if (cambios.fechaFin) cambiosFiltrados.fechaFin = new Date(cambios.fechaFin);
    if (cambios.valorTotal > 0) cambiosFiltrados.valorTotal = cambios.valorTotal;
    if (cambios.terminosPago) cambiosFiltrados.terminosPago = cambios.terminosPago;

    const res = await ContratoService.actualizarContrato(contratoId, cambiosFiltrados);
    console.log(res.actualizado ? chalk.green("✅ Contrato actualizado.") : chalk.red("❌ No se pudo actualizar."));

  } catch (error) {
    console.error(chalk.red("⚠️ Error modificando contrato:"), error.message);
  }
}

async function firmarContrato() {
  try {
    const contratos = await ContratoService.listarContratos({ estado: 'borrador' });
    if (!contratos.length) {
      console.log(chalk.yellow("⚠️ No hay contratos en estado 'borrador'."));
      return;
    }

    const { contratoId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'contratoId',
        message: 'Selecciona contrato a firmar:',
        choices: contratos.map(c => ({ name: c.numero, value: c._id.toString() }))
      }
    ]);

    const res = await ContratoService.firmarContrato(contratoId);
    console.log(res.firmado ? chalk.green("🖋️ Contrato firmado.") : chalk.red("❌ No se pudo firmar."));

  } catch (error) {
    console.error(chalk.red("⚠️ Error al firmar contrato:"), error.message);
  }
}

async function cancelarContrato() {
  try {
    const contratos = await ContratoService.listarContratos({ estado: 'borrador' });
    if (!contratos.length) {
      console.log(chalk.yellow("⚠️ No hay contratos en estado 'borrador'."));
      return;
    }

    const { contratoId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'contratoId',
        message: 'Selecciona contrato a cancelar:',
        choices: contratos.map(c => ({ name: c.numero, value: c._id.toString() }))
      }
    ]);

    const res = await ContratoService.cancelarContrato(contratoId);
    console.log(res.cancelado ? chalk.green("❌ Contrato cancelado.") : chalk.red("⚠️ No se pudo cancelar."));

  } catch (error) {
    console.error(chalk.red("⚠️ Error al cancelar contrato:"), error.message);
  }
}

async function listarContratos() {
  try {
    const filtros = await inquirer.prompt([
      {
        type: 'list',
        name: 'estado',
        message: '¿Filtrar por estado?',
        choices: ['todos', 'borrador', 'firmado', 'cancelado']
      }
    ]);

    const estado = filtros.estado === 'todos' ? undefined : filtros.estado;
    const contratos = await ContratoService.listarContratos({ estado });

    if (!contratos.length) {
      console.log(chalk.yellow("⚠️ No se encontraron contratos con ese filtro."));
      return;
    }

    contratos.forEach(c => {
      console.log(`${chalk.cyan(c.numero)} | Estado: ${c.estado} | Proyecto: ${c.proyectoId} | Valor: $${c.valorTotal}`);
    });

  } catch (error) {
    console.error(chalk.red("⚠️ Error al listar contratos:"), error.message);
  }
}
