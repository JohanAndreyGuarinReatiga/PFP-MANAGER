import { ObjectId } from "mongodb"
import {connection} from '../config/db.js'
import { Entregable } from "../models/entregable.js"

export class EntregableService{
    static collection = 'entregables';

    static async crearEntregable(data){
        const db = await connection();
        const entregable = new Entregable(data);
        const resultado = await db.collection(this.collection).insertOne(entregable.toDBObject());
        return{ id: resultado.insertedId, ...entregable}
    }
    static async cambiarEstado(id, nuevoEstado) {
        const db = await connection();
        const doc = await db.collection(this.collection).findOne({ _id: new ObjectId(id) });
    
        if (!doc) throw new Error("Entregable no encontrado");
    
        const entregable = Entregable.fromDBObject(doc);
        entregable.cambiarEstado(nuevoEstado);
    
        await db.collection(this.collection).updateOne(
          { _id: new ObjectId(id) },
          { $set: { estado: entregable.estado } }
        );
    
        return { success: true, nuevoEstado: entregable.estado };
      }
    
      // Eliminar 
      static async eliminarEntregable(id) {
        const db = await connection();
        const resultado = await db.collection(this.collection).deleteOne({ _id: new ObjectId(id) });
    
        return { eliminado: resultado.deletedCount === 1 };
      }
    
      // Listar 
      static async listarPorProyecto(proyectoId) {
        const db = await connection();
        return db.collection(this.collection)
          .find({ proyectoId: new ObjectId(proyectoId) })
          .toArray();
      }
}