// commands/entregableCommands.js

import inquirer from 'inquirer';
import chalk from 'chalk';
import dayjs from 'dayjs';
import { EntregableService } from '../services/servicioEntregable.js';
import { ProyectoService } from '../services/servicioProyecto.js';

export async function gestionEntregablesCommand() {
  try {
    const { accion } = await inquirer.prompt([
      {
        type: 'list',
        name: 'accion',
        message: '¿Qué deseas hacer con los entregables?',
        choices: [
          { name: '📄 Crear entregables', value: 'crear' },
          { name: '📄 Listar entregables por proyecto', value: 'listar' },
          { name: '✏️ Cambiar estado de un entregable', value: 'estado' },
          { name: '📄 Ver historial de cambio entregables ', value: 'historial' },
          { name: '🗑️ Eliminar un entregable', value: 'eliminar' },
        ],
      },
    ]);

    if (accion === 'crear') {
      const { respuestas } = await inquirer.prompt([
        { type: "input", name: "proyectoId", message: "id del proyecto" },
        { type: "input", name: "titulo", message: "titulo del entregable" },
        { type: "input", name: "descripcion", message: "descripcion del entregable" },
        { type: "input", name: "fechaLimite", message: "fecha limite" },
        { type: "input", name: "fechaEntrega", message: "fecha entrega" },
        { type: "input", name: "estado", message: "escribe el estado del proyecto" },
      ]);

      const data = {
        proyectoId: respuestas.proyectoId,
        titulo: respuestas.titulo,
        descripcion: respuestas.descripcion,
        fechaLimite: new Date(respuestas.fechaLimite),
        fechaEntrega: new Date(fechaEntrega),
        estado: respuestas.estado
      };
  
      await EntregableService.crearEntregable(data);
      console.log(chalk.green(`✅ Entregable creado`));
    }


    // Obtener proyectos existentes
    const proyectos = await ProyectoService.listarProyectos();
    if (!proyectos.length) {
      console.log(chalk.red("❌ No hay proyectos registrados."));
      return;
    }

    const { proyectoId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'proyectoId',
        message: 'Selecciona un proyecto:',
        choices: proyectos.map(p => ({
          name: `${p.nombre} (${dayjs(p.fechaInicio).format('DD/MM/YYYY')} - ${dayjs(p.fechaFin).format('DD/MM/YYYY')})`,
          value: p._id.toString()
        }))
      }
    ]);

    const entregables = await EntregableService.listarPorProyecto(proyectoId);

    if (!entregables.length) {
      console.log(chalk.yellow("⚠️ Este proyecto no tiene entregables."));
      return;
    }

    if (accion === 'listar') {
      console.log(chalk.blueBright(`📦 Entregables del proyecto:`));
      entregables.forEach(e => {
        console.log(`- ${chalk.cyan(e.titulo)} | Estado: ${e.estado} | Fecha límite: ${dayjs(e.fechaLimite).format('DD/MM/YYYY')}`);
      });
      await inquirer.prompt([
        {
          type: "input",
          name: "continuar",
          message: "Presiona ENTER para volver al menú..."
        }
      ]);
      return;
    }

    // Selección de entregable
    const { entregableId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'entregableId',
        message: 'Selecciona el entregable:',
        choices: entregables.map(e => ({
          name: `${e.titulo} [${e.estado}] - ${dayjs(e.fechaLimite).format('DD/MM/YYYY')}`,
          value: e._id.toString()
        }))
      }
    ]);

    if (accion === 'estado') {
      const { nuevoEstado } = await inquirer.prompt([
        {
          type: 'list',
          name: 'nuevoEstado',
          message: 'Selecciona el nuevo estado:',
          choices: ['Pendiente', 'En progreso', 'Entregado', 'Aprobado', 'Rechazado'],
        }
      ]);

      await EntregableService.cambiarEstado(entregableId, nuevoEstado);
      console.log(chalk.green(`✅ Estado actualizado correctamente a "${nuevoEstado}".`));
    }

    if (accion === 'eliminar') {
      const { confirmar } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmar',
          message: '¿Estás seguro de eliminar este entregable?',
          default: false
        }
      ]);

      if (!confirmar) {
        console.log(chalk.gray("Operación cancelada."));
        return;
      }

      const res = await EntregableService.eliminarEntregable(entregableId);
      if (res.eliminado) {
        console.log(chalk.green("🗑️ Entregable eliminado correctamente."));
      } else {
        console.log(chalk.red("❌ No se pudo eliminar el entregable."));
      }
    }

    if ( accion === 'historial'){
      EntregableService.visualizarHistorial(id)
    }


  } catch (error) {
    console.error(chalk.red("❌ Error al gestionar entregables:"), error.message);
  }
}
