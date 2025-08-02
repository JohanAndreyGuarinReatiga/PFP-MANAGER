import inquirer from "inquirer";
import chalk from "chalk";
import dayjs from "dayjs";
import {EntregableService} from "../services/servicioEntregable.js"
import {ProyectoService} from "../services/servicioProyecto.js";

export async function crearEntregable() {
    try{
        const proyectos = await ProyectoService.listarProyectos();
        
        if (proyectos.length === 0){
            console.log(chalk.red("No hay proyectos disponibles para asignar entregable"));
            return
        }
        const {proyectoId} = await inquirer.prompt([
            {
                type: 'list',
                name: 'proyectoId',
                message: 'Escoge el proyecto al que pertenece el entregable',
                choices: proyectos.map(p=>({
                    name: `${p.nombre}(${dayjs(p.fechaInicio).format("DD/MM/YYYY")} - ${dayjs(p.fechaFin).format("DD/MM/YYYY")})`,
                    value: p._id.toString()
                }))
            }
        ]);

        const respuestas = await inquirer.prompt([
            {
              type: 'input',
              name: 'titulo',
              message: 'Título del entregable:',
              validate: (input) => input.trim() !== '' || 'El título es obligatorio.'
            },
            {
              type: 'input',
              name: 'descripcion',
              message: 'Descripción:',
              validate: (input) => input.trim() !== '' || 'La descripción es obligatoria.'
            },
            {
              type: 'input',
              name: 'fechaLimite',
              message: 'Fecha límite (YYYY-MM-DD):',
              validate: (input) => {
                const fecha = dayjs(input, 'YYYY-MM-DD', true);
                return fecha.isValid() || 'Formato de fecha inválido.';
              }
            }
          ]);

          const entregableData = {
            ...respuestas, proyectoId,}

            const resultado = await EntregableService.crearEntregable(entregableData);
            console.log(chalk.green("Entregable creado ID:"), resultado.id)


     }catch(error){
    console.error(chalk.red("error al crear entregable"), error.message)
     }
    
}