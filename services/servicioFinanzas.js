import { connection } from "../config/db.js";
import { Finanza } from "../models/finanza.js";
import { ObjectId } from "mongodb";

export class ServicioFinanza {
    constructor() {
        this.ready = connection().then((db) => {
            this.db = db;
            this.collection = db.collection("Finanzas")
        })
    }

    async esperarDB() {
        if (!this.db) await this.ready;
    }

    // guarda un ingreso o egreso.
    async registrarTransaccion(data) {
        await this.esperarDB();
        const finanza = new Finanza(data);
        await this.collection.insertOne(finanza.toDBObject());
        return finanza;
    }

    // devuelve todas las transacciones ordenadas por fecha
    async obtenerTransaccionesPorProyecto(proyectoId) {
        await this.esperarDB();
        return await this.collection
            .find({ proyectoId: new ObjectId(proyectoId) })
            .sort({ fecha: 1 })
            .toArray();
    }

    // suma los ingresos y egresos y calcula el balance total
    async obtenerBalancePorProyecto(proyectoId) {
        await this.esperarDB();
        const transacciones = await this.collection.find({ proyectoId: new ObjectId(proyectoId) }).toArray();

        let totalIngresos = 0;
        let totalEgresos = 0;

        for (const t of transacciones) {
            if (t.tipo === "ingreso") {
                totalIngresos += t.monto;
            } else if (t.tipo === "egreso") {
                totalEgresos += t.monto;
            }
        }

        return {
            totalIngresos,
            totalEgresos,
            balance: totalIngresos - totalEgresos
        }
    }

    async obtenerBalanceMensualPorProyecto (proyectoId) {
        await this.esperarDB();

        const pipeline =[
            {$match: {proyectoId: new ObjectId(proyectoId)}},
            {
                $group: {
                    _id: {
                        mes: {$month: "$fecha"},
                        anio: {$year: "$fecha"},
                        tipo: "$tipo"
                    },
                    total: {$sum: "$monto"}
                }
            },
            {
                $group:{
                    _id: {mes: "$_id.mes", anio: "$_id.anio"},
                    ingresos: {
                        $sum: {
                            $cond: [{ $eq: ["$_id.tipo","egreso"]}, "$total", 0]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    mes: "$_id.mes",
                    anio:"$_id.anio",
                    ingresos: 1,
                    egresso: 1,
                    balance: {$subtract:["$ingresos","$egresos"]}
                }
            },{$sort : {anio: 1, mes: 1}}
        ];

        return await this.collection.aggregate(pipeline).toArray();
    }
}