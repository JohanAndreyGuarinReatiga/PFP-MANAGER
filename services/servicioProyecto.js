const { MongoClient } = require('mongodb');
const Proyecto = require('../models/proyecto');

class ServicioProyecto {
    constructor(db) {
        this.db = db;
    }

    async crearProyecto(proyectoData) {
        const proyecto = new Proyecto(
            proyectoData.nombre,
            proyectoData.descripcion,
            proyectoData.fechaInicio,
            proyectoData.fechaFin,
            proyectoData.valor,
            proyectoData.clientId
        );

        proyecto.validate();

        const resultado = await this.db.collection('proyectos').insertOne(proyecto);
        return resultado.ops[0];
    }

    async creardePropuesta(propuestaData, clientId) {
        const proyecto = new Project(
            propuestaData.nombre,
            propuestaData.descripcion,
            propuestaData.fechaInicio,
            propuestaData.fechaFin,
            propuestaData.valor,
            clientId
        );
        proyecto.validate();
        const result = await this.db.collection('proyectos').insertOne(proyecto);
        return result.ops[0];}
}

module.exports = ServicioProyecto;
