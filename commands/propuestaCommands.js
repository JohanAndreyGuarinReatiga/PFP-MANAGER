import inquirer from 'inquirer';
import chalk from 'chalk';
import { ServicioPropuesta } from '../services/servicioPropuesta.js';
import { ServicioCliente } from '../services/servicioCliente.js';

function mostrarEstado(estado) {
  const colores = {
    Pendiente: chalk.yellow,
    Aceptada: chalk.green,
    Rechazada: chalk.red,
  };
  return colores[estado]?.(estado) || estado;
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-CO');
}

function formatearPrecio(valor) {
  return `$${valor.toLocaleString()}`;
}

export async function menuPropuestas() {
  let salir = false;
  while (!salir) {
    const { accion } = await inquirer.prompt([
      {
        type: 'list',
        name: 'accion',
        message: '📋 Gestión de Propuestas:',
        choices: [
          { name: '➕ Crear propuesta', value: 'crear' },
          { name: '📄 Listar propuestas', value: 'listar' },
          { name: '🔁 Cambiar estado', value: 'estado' },
          { name: '🗑️ Eliminar propuesta', value: 'eliminar' },
          new inquirer.Separator(),
          { name: '⬅️ Volver al menú principal', value: 'salir' },
        ],
      },
    ]);

    switch (accion) {
      case 'crear':
        await crearPropuestaCLI();
        break;
      case 'listar':
        await listarPropuestasCLI();
        break;
      case 'estado':
        await cambiarEstadoCLI();
        break;
      case 'eliminar':
        await eliminarPropuestaCLI();
        break;
      case 'salir':
        salir = true;
        break;
    }
  }
}

async function crearPropuestaCLI() {
  try {
    const clientes = await ServicioCliente.obtenerClientes();
    if (!clientes || clientes.length === 0) {
      console.log(chalk.red('No hay clientes registrados.'));
      return;
    }

    const { clienteId, titulo, descripcion, precio, fechaLimite, condiciones } = await inquirer.prompt([
      {
        type: 'list',
        name: 'clienteId',
        message: 'Selecciona el cliente:',
        choices: clientes.map(c => ({ name: `${c.nombre} (${c.empresa})`, value: c._id.toString() })),
      },
      { type: 'input', name: 'titulo', message: 'Título:', validate: v => v.trim() !== '' },
      { type: 'editor', name: 'descripcion', message: 'Descripción:' },
      {
        type: 'number',
        name: 'precio',
        message: 'Precio:',
        validate: v => v > 0 || 'Debe ser mayor a 0',
      },
      {
        type: 'input',
        name: 'fechaLimite',
        message: 'Fecha límite (YYYY-MM-DD):',
        validate: v => {
          const d = new Date(v);
          return d > new Date() || 'Debe ser una fecha futura';
        },
      },
      { type: 'editor', name: 'condiciones', message: 'Condiciones:' },
    ]);

    const propuesta = await ServicioPropuesta.crearPropuesta({
      clienteId,
      titulo,
      descripcion,
      precio,
      fechaLimite,
      condiciones,
    });

    console.log(chalk.green('✅ Propuesta creada con éxito.'));
    console.log(`Número: ${propuesta.numero}`);
    console.log(`Estado: ${mostrarEstado(propuesta.estado)}`);
  } catch (error) {
    console.error(chalk.red('Error al crear la propuesta:'), error.message);
  }
}

async function listarPropuestasCLI() {
  try {
    const { estado } = await inquirer.prompt([
      {
        type: 'list',
        name: 'estado',
        message: 'Filtrar por estado:',
        choices: [
          { name: 'Todas', value: 'todos' },
          { name: 'Pendientes', value: 'Pendiente' },
          { name: 'Aceptadas', value: 'Aceptada' },
          { name: 'Rechazadas', value: 'Rechazada' },
        ],
      },
    ]);

    const propuestas = await ServicioPropuesta.listarPropuestas({ estado });
    if (propuestas.length === 0) {
      console.log(chalk.yellow('No hay propuestas registradas.'));
      return;
    }

    console.log(chalk.blue('📄 Listado de propuestas:'));
    propuestas.forEach(p => {
      console.log(
        `${chalk.white.bold(p.numero)} | ${p.titulo} | ${formatearPrecio(p.precio)} | ${mostrarEstado(
          p.estado,
        )} | ${formatearFecha(p.fechaCreacion)}`
      );
    });
  } catch (error) {
    console.error(chalk.red('Error al listar propuestas:'), error.message);
  }
}

async function cambiarEstadoCLI() {
  try {
    const propuestas = await ServicioPropuesta.listarPropuestas({ estado: 'Pendiente' });
    if (propuestas.length === 0) {
      console.log(chalk.yellow('No hay propuestas pendientes.'));
      return;
    }

    const { propuestaId, nuevoEstado } = await inquirer.prompt([
      {
        type: 'list',
        name: 'propuestaId',
        message: 'Selecciona una propuesta:',
        choices: propuestas.map(p => ({
          name: `${p.numero} - ${p.titulo}`,
          value: p._id.toString(),
        })),
      },
      {
        type: 'list',
        name: 'nuevoEstado',
        message: 'Nuevo estado:',
        choices: ['Aceptada', 'Rechazada'],
      },
    ]);

    const resultado = await ServicioPropuesta.cambiarEstadoPropuesta(propuestaId, nuevoEstado);
    console.log(chalk.green(`✅ Estado cambiado a ${nuevoEstado}`));

    if (resultado.proyecto) {
      console.log(chalk.green('🎉 Proyecto generado automáticamente'));
      console.log(`Nombre: ${resultado.proyecto.nombre}`);
      console.log(`Código: ${resultado.proyecto.codigoProyecto}`);
    }
  } catch (error) {
    console.error(chalk.red('Error al cambiar estado:'), error.message);
  }
}

async function eliminarPropuestaCLI() {
  try {
    const propuestas = await ServicioPropuesta.listarPropuestas();
    if (propuestas.length === 0) {
      console.log(chalk.yellow('No hay propuestas registradas.'));
      return;
    }

    const { propuestaId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'propuestaId',
        message: 'Selecciona una propuesta a eliminar:',
        choices: propuestas.map(p => ({
          name: `${p.numero} - ${p.titulo}`,
          value: p._id.toString(),
        })),
      },
    ]);

    const { confirmar } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmar',
        message: '¿Estás seguro de eliminar esta propuesta?',
        default: false,
      },
    ]);

    if (!confirmar) {
      console.log(chalk.gray('Operación cancelada.'));
      return;
    }

    const resultado = await ServicioPropuesta.eliminarPropuesta(propuestaId);
    if (resultado.eliminado) {
      console.log(chalk.green('✅ Propuesta eliminada con éxito.'));
    } else {
      console.log(chalk.red('No se pudo eliminar la propuesta.'));
    }
  } catch (error) {
    console.error(chalk.red('Error al eliminar propuesta:'), error.message);
  }
}
