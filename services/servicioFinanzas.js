import { connection } from "../config/db.js";
import { Finanza } from "../models/finanza.js";
import { ObjectId } from "mongodb";

export class ServicioFinanza {
    static collection = "finanzas";

    static async registrarIngreso({ proyectoId = null, descripcion, monto, fecha = new Date(), categoria = "otros" }) {
        const db = await connection();
        const session = db.client.startSession();
    
        try {
          await session.withTransaction(async () => {
            const ingreso = new Finanza({
              proyectoId: proyectoId ? new ObjectId(proyectoId) : null,
              tipo: "ingreso",
              descripcion,
              monto,
              fecha,
              categoria,
            });
    
            await db.collection(this.collection).insertOne(ingreso.toDBObject(), { session });
          });
        } catch (error) {
          console.error("Error al registrar ingreso:", error.message);
          throw new Error("No se pudo registrar el ingreso: " + error.message);
        } finally {
          await session.endSession();
        }
      }
    
}