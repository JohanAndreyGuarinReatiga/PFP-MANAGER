import { ObjectId } from 'mongodb';
import { connection } from '../config/db.js';
import { Contrato } from '../models/contrato.js';

export class ContratoService {
  static collection = 'contratos';

    // Crea un contrato para un proyecto existente

  static async crearContrato(data) {
    const db = await connection();

    // Validar existencia del proyecto
    const proyecto = await db.collection("proyectos").findOne({ _id: new ObjectId(data.proyectoId) });
    if (!proyecto) throw new Error("Proyecto no encontrado.");

    // Validar coherencia fechas contrato <-> proyecto
    const fechaInicio = new Date(data.fechaInicio);
    const fechaFin = new Date(data.fechaFin);
    if (fechaInicio < new Date(proyecto.fechaInicio) || fechaFin > new Date(proyecto.fechaFin)) {
      throw new Error("Las fechas del contrato deben estar dentro del rango del proyecto.");
    }

    const contrato = new Contrato(data);
    const errores = contrato.validate();
    if (errores.length > 0) throw new Error(errores.join("; "));

    await db.collection(this.collection).insertOne(contrato);

    return {
      id: contrato._id,
      numero: contrato.numero,
      estado: contrato.estado,
      creado: true,
    };
  }

  
//    Modifica un contrato si está en borrador

  static async actualizarContrato(id, cambios) {
    const db = await connection();
    const contrato = await db.collection(this.collection).findOne({ _id: new ObjectId(id) });

    if (!contrato) throw new Error("Contrato no encontrado.");
    if (contrato.estado.toLowerCase() !== "borrador") {
      throw new Error("Solo se puede modificar un contrato en estado 'borrador'.");
    }

    // Validar fechas con proyecto
    const proyecto = await db.collection("proyectos").findOne({ _id: contrato.proyectoId });
    if (!proyecto) throw new Error("Proyecto asociado no encontrado.");

    if (cambios.fechaInicio || cambios.fechaFin) {
      const f1 = new Date(cambios.fechaInicio || contrato.fechaInicio);
      const f2 = new Date(cambios.fechaFin || contrato.fechaFin);

      if (f1 < new Date(proyecto.fechaInicio) || f2 > new Date(proyecto.fechaFin)) {
        throw new Error("Las fechas deben estar dentro del rango del proyecto.");
      }
    }

    cambios.fechaActualizacion = new Date();

    const resultado = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { $set: cambios }
    );

    return { actualizado: resultado.modifiedCount === 1 };
  }


// Firmar contrato

  static async firmarContrato(id) {
    const db = await connection();
    const contrato = await db.collection(this.collection).findOne({ _id: new ObjectId(id) });

    if (!contrato) throw new Error("Contrato no encontrado.");
    if (contrato.estado.toLowerCase() !== "borrador") {
      throw new Error("Solo se puede firmar un contrato en estado borrador");
    }

    const resultado = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          estado: "firmado",
          fechaFirma: new Date(),
          fechaActualizacion: new Date(),
        },
      }
    );

    return { firmado: resultado.modifiedCount === 1 };
  }

//    Cancelar contrato
  static async cancelarContrato(id) {
    const db = await connection();
    const contrato = await db.collection(this.collection).findOne({ _id: new ObjectId(id) });

    if (!contrato) throw new Error("Contrato no encontrado.");
    if (contrato.estado.toLowerCase() !== "borrador") {
      throw new Error("Solo se puede cancelar un contrato en estado 'borrador'.");
    }

    const resultado = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          estado: "cancelado",
          fechaActualizacion: new Date(),
        },
      }
    );

    return { cancelado: resultado.modifiedCount === 1 };
  }

  
//    Obtener contrato por proyecto

  static async obtenerPorProyecto(proyectoId) {
    const db = await connection();
    return await db.collection(this.collection).findOne({
      proyectoId: new ObjectId(proyectoId),
    });
  }


//    Listar con filtros

  static async listarContratos({ estado, proyectoId } = {}) {
    const db = await connection();
    const filtro = {};

    if (estado) filtro.estado = estado;
    if (proyectoId) filtro.proyectoId = new ObjectId(proyectoId);

    return await db.collection(this.collection).find(filtro).toArray();
  }
}
