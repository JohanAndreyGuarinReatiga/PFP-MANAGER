const inquirer = require('inquirer');
const { MongoClient } = require('mongodb');
const ServicioProyecto = require('../services/servicioProyecto');

async function crearProyecto() {
    const cliente = new MongoClient('mongodb://localhost:27017');
    await cliente.connect();
    const db = cliente.db('freelancerPortfolio');
    const ServicioProyecto = new ServicioProyecto(db);

    const respuestas = await inquirer.prompt([
        { type: 'input', name: 'nombre', message: 'Nombre del proyecto:' },
        { type: 'input', name: 'descripcion', message: 'Descripción del proyecto:' },
        { type: 'input', name: 'fechaInicio', message: 'Fecha de inicio (YYYY-MM-DD):' },
        { type: 'input', name: 'fechaFin', message: 'Fecha de fin (YYYY-MM-DD):' },
        { type: 'input', name: 'valor', message: 'Valor del proyecto:' },
        { type: 'input', name: 'clienteId', message: 'ID del cliente asociado:' }
    ]);

    try {
        const nuevoProyecto = await ServicioProyecto.crearProyecto(respuestas);
        console.log('Proyecto creado con éxito:', nuevoProyecto);
    } catch (error) {
        console.error('Error al crear el proyecto:', error.message);
    } finally {
        await cliente.close();
    }
}

async function crearProyectoPorPropuesta() {
    const cliente = new MongoClient('mongodb://localhost:27017');
    await cliente.connect();
    const db = cliente.db('freelancerPortfolio');
    const ServicioProyecto = new ServicioProyecto(db);

    const respuestasPropuesta = await inquirer.prompt([
        { type: 'input', name: 'nombre', message: 'Nombre de la propuesta aceptada:' },
        { type: 'input', name: 'descripcion', message: 'Descripción de la propuesta:' },
        { type: 'input', name: 'fechaInicio', message: 'Fecha de inicio (YYYY-MM-DD):' },
        { type: 'input', name: 'fechaFin', message: 'Fecha de fin (YYYY-MM-DD):' },
        { type: 'input', name: 'valor', message: 'Valor de la propuesta:' },
        { type: 'input', name: 'clienteId', message: 'ID del clientee asociado:' }
    ]);

    try {
        const nuevoProyecto = await ServicioProyecto.crearProyectoPorPropuesta(respuestasPropuesta, respuestasPropuesta.clienteId);
        console.log('Proyecto creado a partir de la propuesta con éxito:', nuevoProyecto);
    } catch (error) {
        console.error('Error al crear el proyecto desde la propuesta:', error.message);
    } finally {
        await cliente.close();
    }
}

module.exports = { crearProyecto, crearProyectoPorPropuesta };
