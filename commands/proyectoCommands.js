// commands/proyectoCommands.js

import inquirer from 'inquirer';
import chalk from 'chalk';
import dayjs from 'dayjs';
import { ProyectoService } from '../services/servicioProyecto.js';
import { ServicioPropuesta } from '../services/servicioPropuesta.js';
import { ServicioCliente } from '../services/servicioCliente.js'; 
function mostrarEstadoConColor(estado) {
  const colores = {
    Activo: chalk.green,
    Pausado: chalk.yellow,
    Finalizado: chalk.blue,
    Cancelado: chalk.red,
  };
  return colores[estado]?.(estado) || estado;
}

function formatearFecha(fecha) {
  return dayjs(fecha).format('DD/MM/YYYY');
}

export async function menuProyectos() {
  let salir = false;
  while (!salir) {
    const { accion } = await inquirer.prompt({
      type: 'list',
      name: 'accion',
      message: '📊 Gestión de Proyectos',
      choices: [
        { name: '➕ Crear proyecto manualmente', value: 'crearManual' },
        { name: '➕ Crear proyecto desde propuesta', value: 'crearDesdePropuesta' },
        { name: '📄 Ver proyectos', value: 'listar' },
        { name: '✏️ Modificar proyecto', value: 'modificar' },
        { name: '📈 Registrar avance', value: 'avanzar' },
        { name: '⬅️ Volver al menú principal', value: 'salir' },
      ],
    });

    switch (accion) {
      case 'crearManual':
        await crearProyectoManualCLI();
        break;
      case 'crearDesdePropuesta':
        await crearProyectoDesdePropuestaCLI();
        break;
      case 'listar':
        await listarProyectosCLI();
        break;
      case 'modificar':
        await modificarProyectoCLI();
        break;
      case 'avanzar':
        await registrarAvanceCLI();
        break;
      case 'salir':
        salir = true;
        break;
    }
  }
}

async function crearProyectoManualCLI() {
  try {
    const clientes = await ServicioCliente.obtenerClientes();
    if (!clientes || clientes.length === 0) {
      console.log(chalk.red('No hay clientes registrados.'));
      return;
    }

    const respuestas = await inquirer.prompt([
      {
        type: 'list',
        name: 'clienteId',
        message: 'Selecciona el cliente:',
        choices: clientes.map(c => ({ name: `${c.nombre}`, value: c._id.toString() })),
      },
      { type: 'input', name: 'nombre', message: 'Nombre del proyecto:', validate: v => v.trim() !== '' },
      { type: 'input', name: 'descripcion', message: 'Descripción:' },
      {
        type: 'input',
        name: 'fechaInicio',
        message: 'Fecha inicio (YYYY-MM-DD):',
        default: dayjs().format('YYYY-MM-DD'),
        validate: v => dayjs(v, 'YYYY-MM-DD', true).isValid() || 'Formato inválido',
      },
      {
        type: 'input',
        name: 'fechaFin',
        message: 'Fecha fin (YYYY-MM-DD) [opcional]:',
        validate: v => !v || dayjs(v, 'YYYY-MM-DD', true).isValid() || 'Formato inválido',
      },
      {
        type: 'number',
        name: 'valor',
        message: 'Valor:',
        default: 0,
        validate: v => v >= 0 || 'Debe ser ≥ 0',
      },
    ]);

    const data = {
      clienteId: respuestas.clienteId,
      nombre: respuestas.nombre,
      descripcion: respuestas.descripcion,
      fechaInicio: new Date(respuestas.fechaInicio),
      fechaFin: respuestas.fechaFin ? new Date(respuestas.fechaFin) : null,
      valor: respuestas.valor,
    };

    const proyecto = await ProyectoService.crearProyecto(data);
    console.log(chalk.green('✅ Proyecto creado:'));
    console.log(`Código: ${chalk.white.bold(proyecto.codigoProyecto)}`);
    console.log(`Estado: ${mostrarEstadoConColor(proyecto.estado)}`);
  } catch (err) {
    console.error(chalk.red('❌ Error al crear proyecto:'), err.message);
  }
}

async function crearProyectoDesdePropuestaCLI() {
  try {
    const propuestas = await ServicioPropuesta.listarPropuestasPendientes();
    if (!propuestas.length) {
      console.log(chalk.yellow('⚠️ No hay propuestas pendientes.'));
      return;
    }

    const { propuestaId } = await inquirer.prompt({
      type: 'list',
      name: 'propuestaId',
      message: 'Selecciona propuesta aceptada:',
      choices: propuestas.map(p => ({
        name: `${p.numero} – ${p.titulo}`,
        value: p._id.toString(),
      })),
    });

    const proyecto = await ProyectoService.crearProyectoDesdePropuesta(propuestaId);
    console.log(chalk.green('✅ Proyecto creado desde propuesta:'));
    console.log(`Código: ${chalk.white.bold(proyecto.codigoProyecto)}`);
    console.log(`Estado: ${mostrarEstadoConColor(proyecto.estado)}`);
  } catch (err) {
    console.error(chalk.red('❌ Error al crear desde propuesta:'), err.message);
  }
}

async function listarProyectosCLI() {
  try {
    const { clienteId, estado } = await inquirer.prompt([
      {
        type: 'list',
        name: 'clienteId',
        message: 'Filtrar por cliente:',
        choices: [{ name: 'Todos', value: 'todos' }, ...(await ServicioCliente.obtenerClientes()).map(c => ({
          name: c.nombre, value: c._id.toString()
        }))],
      },
      {
        type: 'list',
        name: 'estado',
        message: 'Filtrar por estado:',
        choices: [
          { name: 'Todos', value: 'todos' },
          ...['Activo','Pausado','Finalizado','Cancelado'].map(e => ({ name: e, value: e })),
        ],
      },
    ]);

    const proyectos = await ProyectoService.listarProyectos({ clienteId , estado });
    if (!proyectos.length) {
      console.log(chalk.yellow('⚠️ No se encontraron proyectos.'));
      return;
    }

    console.log(chalk.blue('📋 Proyectos:'));
    proyectos.forEach(p => {
      const progreso = p.avances.length 
        ? Math.round((p.avances.filter(a => a.descripcion).length / p.avances.length) * 100) 
        : 0;
      console.log(
        `${chalk.white.bold(p.codigoProyecto)} | ${p.nombre} | ${mostrarEstadoConColor(p.estado)} | ` +
        `${formatearFecha(p.fechaInicio)} - ${p.fechaFin ? formatearFecha(p.fechaFin) : '---'} | ` +
        `Progreso: ${progreso}%`
      );
    });
  } catch (err) {
    console.error(chalk.red('Error al listar proyectos:'), err.message);
  }
}

async function modificarProyectoCLI() {
  try {
    const proyectos = await ProyectoService.listarProyectos();
    if (!proyectos.length) {
      console.log(chalk.yellow('⚠️ No hay proyectos para modificar.'));
      return;
    }

    const { proyectoId } = await inquirer.prompt({
      type: 'list',
      name: 'proyectoId',
      message: 'Selecciona proyecto:',
      choices: proyectos.map(p => ({ name: `${p.codigoProyecto} – ${p.nombre}`, value: p._id.toString() })),
    });

    const respuestas = await inquirer.prompt([
      { type: 'input', name: 'descripcion', message: 'Nueva descripción (enter=sin cambio):' },
      {
        type: 'input', name: 'fechaInicio', message: 'Nueva fecha inicio (YYYY-MM-DD):',
        validate: v => !v || dayjs(v,'YYYY-MM-DD',true).isValid() || 'Formato inválido'
      },
      {
        type: 'input', name: 'fechaFin', message: 'Nueva fecha fin (YYYY-MM-DD):',
        validate: v => !v || dayjs(v,'YYYY-MM-DD',true).isValid() || 'Formato inválido'
      },
      {
        type: 'number', name: 'valor', message: 'Nuevo valor (0=sin cambio):',
        validate: v => v >= 0 || 'Debe ser ≥ 0'
      },
      {
        type: 'list', name: 'estado', message: 'Nuevo estado:',
        choices: ['Activo','Pausado','Finalizado','Cancelado','(mantener)'],
      },
    ]);

    const cambios = {};
    if (respuestas.descripcion) cambios.descripcion = respuestas.descripcion;
    if (respuestas.fechaInicio) cambios.fechaInicio = new Date(respuestas.fechaInicio);
    if (respuestas.fechaFin) cambios.fechaFin = new Date(respuestas.fechaFin);
    if (respuestas.valor > 0) cambios.valor = respuestas.valor;
    if (respuestas.estado && respuestas.estado !== '(mantener)') cambios.estado = respuestas.estado;

    const res = await ProyectoService.actualizarProyecto(proyectoId, cambios);
    console.log(res.actualizado ? chalk.green('✅ Proyecto actualizado.') : chalk.red('❌ No se actualizó.'));
  } catch (err) {
    console.error(chalk.red('❌ Error al modificar proyecto:'), err.message);
  }
}

async function registrarAvanceCLI() {
  try {
    const proyectos = await ProyectoService.listarProyectos();
    if (!proyectos.length) {
      console.log(chalk.yellow('⚠️ No hay proyectos para avanzar.'));
      return;
    }

    const { proyectoId, descripcion } = await inquirer.prompt([
      {
        type: 'list',
        name: 'proyectoId',
        message: 'Selecciona proyecto:',
        choices: proyectos.map(p => ({ name: `${p.codigoProyecto} – ${p.nombre}`, value: p._id.toString() })),
      },
      { type: 'input', name: 'descripcion', message: 'Descripción del avance:' },
    ]);

    const res = await ProyectoService.registrarAvance(proyectoId, descripcion);
    console.log(res.avanceRegistrado ? chalk.green('✅ Avance registrado.') : chalk.red('❌ No registrado.'));
  } catch (err) {
    console.error(chalk.red('❌ Error al registrar avance:'), err.message);
  }
}
