import { ObjectId } from 'mongodb';
import { connection } from '../config/db.js';
import { Propuesta } from '../models/propuesta.js';
import { Proyecto } from '../models/proyecto.js';

export class PropuestaService {
  static collection = 'propuestas';

  // Crear propuesta
  static async crearPropuesta(data) {
    const db = await connection();

    if (typeof data.fechaLimite === 'string') {
      data.fechaLimite = new Date(data.fechaLimite);
    }

    const propuesta = new Propuesta(data);
    const resultado = await db.collection(this.collection).insertOne(propuesta.toDBObject());

    return {
      id: resultado.insertedId,
      numero: propuesta.numero,
      estado: propuesta.estado,
      fechaCreacion: propuesta.fechaCreacion,
    };
  }

  // Listar propuestas con filtros, orden y paginación
  static async listarPropuestas({ estado, clienteId, pagina = 1, limite = 10 } = {}) {
    const db = await connection();

    const filtro = {};
    if (estado && estado !== 'todos') filtro.estado = estado;
    if (clienteId && clienteId !== 'todos') filtro.clienteId = new ObjectId(clienteId);

    const skip = (pagina - 1) * limite;

    const cursor = db.collection(this.collection)
      .find(filtro)
      .sort({ fechaCreacion: -1 })
      .skip(skip)
      .limit(limite);

    const total = await db.collection(this.collection).countDocuments(filtro);
    const propuestas = await cursor.toArray();

    return {
      propuestas,
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

  // Cambiar estado de una propuesta (transacción si se acepta)
  static async cambiarEstado(id, nuevoEstado) {
    const db = await connection();
    const cliente = db.client;
    const session = cliente.startSession();
    const propuestaId = new ObjectId(id);
    let resultado = {};

    try {
      await session.withTransaction(async () => {
        const doc = await db.collection(this.collection).findOne({ _id: propuestaId }, { session });
        if (!doc) throw new Error("Propuesta no encontrada");

        const propuesta = new Propuesta({ ...doc, clienteId: doc.clienteId.toString() });

        if (["Aceptada", "Rechazada"].includes(propuesta.estado)) {
          throw new Error("No se puede modificar una propuesta ya aceptada o rechazada.");
        }

        propuesta.cambiarEstado(nuevoEstado);

        await db.collection(this.collection).updateOne(
          { _id: propuestaId },
          {
            $set: {
              estado: propuesta.estado,
              fechaActualizacion: propuesta.fechaActualizacion,
            },
          },
          { session }
        );

        resultado.propuesta = {
          id: propuestaId,
          nuevoEstado: propuesta.estado,
        };

        if (nuevoEstado === "Aceptada") {
          const proyecto = Proyecto.crearDesdePropuesta(doc, doc.clienteId.toString());
          const resultadoProyecto = await db.collection("proyectos").insertOne(proyecto.toDBObject(), { session });

          resultado.proyecto = {
            id: resultadoProyecto.insertedId,
            nombre: proyecto.nombre,
            estado: proyecto.estado,
            codigoProyecto: proyecto.codigoProyecto,
          };
        }
      });

      return resultado;
    } finally {
      await session.endSession();
    }
  }

  // Eliminar propuesta
  static async eliminarPropuesta(id) {
    const db = await connection();
    const result = await db.collection(this.collection).deleteOne({ _id: new ObjectId(id) });

    return { eliminado: result.deletedCount === 1 };
  }
}
