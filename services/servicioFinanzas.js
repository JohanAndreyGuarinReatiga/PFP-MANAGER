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
    static async registrarGasto({ proyectoId = null, descripcion, monto, fecha = new Date(), categoria = "otros"}){
        const db = await connection();
        const session = db.client.startSession();
        const categoriasValidas = ["herramientas", "marketing", "oficina", "otros"];
        if(!categoriasValidas.includes(categoria)){
            throw new Error("categoria no valida, pruebe con:" + categoriasValidas.join(", "));
        }
        try{
            await session.withTransaction(async()=>{
                const egreso = new Finanza({proyectoId: proyectoId ? new ObjectId(proyectoId) : null,
                    tipo: "egreso",
                    descripcion,
                    monto,
                    fecha,
                    categoria,
                });
                await db.collection(this.collection).insertOne(egreso.toDBObject(), { session });
            })
        }catch(error){
            console.log("Error al registrar gasto", error.message)
            throw new Error("no se pudo registrar el gasto" + error.message)
        }finally{
            await session.endSession();
        }
    }
    static async consultarBalance({desde = null, hasta = null, clienteId = null, proyectoId = null}){
        const db = await connection();
        const match = {};

        if (proyectoId)match.proyectoId = new ObjectId(proyectoId);
        if(desde || hasta){ match.fecha = {}
            if (desde) match.fecha.$gte = new Date(desde)
            if (hasta) match.fecha.$lte = new Date(hasta)    
        }

        if (clienteId) {
            const proyectosCliente = await db.collection("proyectos").find({ clienteId: new ObjectId(clienteId) }, { projection: { _id: 1 } }).toArray();
            const ids = proyectosCliente.map(p => p._id);
            match.proyectoId = { $in: ids };
          }
      
          const pipeline = [
            { $match: match },
            {
              $group: {
                _id: "$tipo",
                total: { $sum: "$monto" },
              },
            },
          ];
      
          const resultados = await db.collection(this.collection).aggregate(pipeline).toArray();
      
          const resumen = { ingresos: 0, egresos: 0, balance: 0 };
          for (const r of resultados) {
            if (r._id === "ingreso") resumen.ingresos = r.total;
            if (r._id === "egreso") resumen.egresos = r.total;
          }
          resumen.balance = resumen.ingresos - resumen.egresos;
          return resumen;
        }


}