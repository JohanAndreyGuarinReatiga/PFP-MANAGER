import {ObjectId} from "mongodb"
import {connection} from "../config/db.js"
import {Proyecto} from "../models/proyecto.js"

export class ProyectoService{
  static collection = 'proyectos';

  // para crear un proyecto
  static async crearProyecto(data){
    const db = await connection();
    const proyecto = new Proyecto(data);
    const resultado = await db.collection(this.collection).insertOne(proyecto.toDBObject());
   // crea un nuevo objeto con los nuevos datos expandidos dentro de el
    return { id: resultado.insertedId, ...proyecto.toDBObject(),}
  }
//este es para todos los proyectos
  static async listarProyectos({clienteId, estado} = {}){
    // espera un arguumento o devuelve un objeto vacio si no los hay
    const db = await connection();

    const filtro = {};
    if (clienteId) filtro.clienteId = new ObjectId(clienteId);
    if (estado) filtro.estado = estado;

    return await db.collection(this.collection)
    .find(filtro)
    .sort({fechaCreacion: -1}) 
    .toArray();
  }

  // ahora para obtener por id 
  static async obtenerProyectoPorId(Id){
    const db = await connection();
    return await db.collection(this.collection).findOne({_id: new ObjectId(id)});
  }

  // para actualizar datos
  static async actualizarProyecto(id, cambios){
    const db = await connection();
    if (cambios.estado && !["Activo", "Pausado", "Finalizado", "Cancelado"].includes(cambios,estado)){
      throw new Error("Estado invalido")
    }

    const resultado = await db.collection(this.collection).updateOne( 
      {_id: new ObjectId(id)},
      {$set: cambios}
    );
    return{ actualizado: resultado.modifiedCount === 1}
}

static async registrarAvance(id, descripcionAvance){
  const db = await connection();

  const avance = {
    fecha: new Date(),
    descripcion: descripcionAvance,
  }
  const resultado = await db.collection(this.collection).updateOne(
    {_id: new ObjectId(id)},
    {$push: {avances: avance}}
  );

  return {avanceRegistrado: resultado.modifiedCount === 1};

}

static async eliminarProyecto(id){
  const db = await connection();
  const resultado = await db.collection(this.collection).deleteOne({_id: new ObjectId(id)});
  
  return{ eliminado: resultado.modifiedCount === 1 }
}


}