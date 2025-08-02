import { ObjectId } from 'mongodb';
import { connection } from '../config/db.js';
import { Propuesta } from '../models/propuesta.js';
import { Proyecto } from '../models/proyecto.js';

export class ServicioPropuesta {
  static collection = 'propuestas';

  // Crear propuesta
  static async crearPropuesta(data) {
    try {
      const db = await connection();
      const propuesta = new Propuesta(data);
  
      console.log("propuesta a crear",propuesta.toDBObject())// solo para ver tambien
      // Inserta el objeto plano, no la instancia con métodos
      await db.collection(this.collection).insertOne(propuesta.toDBObject());
  
      return propuesta;
    } catch (error) {
      console.error("Error al insertar propuesta:", error.message);
      throw new Error("Error al crear la propuesta: " + error.message);
    }
  }
  
  // Listar propuestas con filtros, orden y paginación
  static async listarPropuestas({ estado, clienteId, pagina = 1, limite = 10, ordenarPor = 'fechaCreacion', orden = -1 } = {}) {
    const db = await connection();
    const filtro = {};

    if (estado && estado !== 'todos') filtro.estado = estado;
    if (clienteId && clienteId !== 'todos') filtro.clienteId = new ObjectId(clienteId);

    const skip = (pagina - 1) * limite;

    const cursor = db.collection(this.collection)
      .find(filtro)
      .sort({ [ordenarPor]: orden })
      .skip(skip)
      .limit(limite);

    const total = await db.collection(this.collection).countDocuments(filtro);
    const propuestas = await cursor.toArray();

    // Obtener los clientes para mapearlos dentro de las propuestas
    const clientesMap = {};
    const clienteIds = [...new Set(propuestas.map(p => p.clienteId.toString()))];
    const clientes = await db.collection("clientes").find({ _id: { $in: clienteIds.map(id => new ObjectId(id)) } }).toArray();
    clientes.forEach(c => {
      clientesMap[c._id.toString()] = { nombre: c.nombre, empresa: c.empresa };
    });

    propuestas.forEach(p => {
      p.cliente = clientesMap[p.clienteId.toString()] || { nombre: "Desconocido", empresa: "" };
    });

    return {
      propuestas,
      paginacion: {
        paginaActual: pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
        tieneSiguiente: pagina * limite < total,
        tieneAnterior: pagina > 1,
      },
    };
  }

  // Cambiar estado con transacción y creación de proyecto
  static async cambiarEstadoPropuesta(id, nuevoEstado) {
    const db = await connection();
    const session = db.client.startSession();
    const propuestaId = new ObjectId(id);
    let resultado = {};

    try {
      await session.withTransaction(async () => {
        const doc = await db.collection(this.collection).findOne({ _id: propuestaId }, { session });
        if (!doc) throw new Error("Propuesta no encontrada");

        const propuesta = new Propuesta({ ...doc, clienteId: doc.clienteId.toString() });

        if (["Aceptada", "Rechazada"].includes(propuesta.estado)) {
          throw new Error("No se puede cambiar el estado de una propuesta ya aceptada o rechazada");
        }

        propuesta.cambiarEstado(nuevoEstado);

        await db.collection(this.collection).updateOne(
          { _id: propuestaId },
          {
            $set: {
              estado: propuesta.estado,
              fechaCambioEstado: propuesta.fechaCambioEstado,
              fechaActualizacion: propuesta.fechaActualizacion,
            },
          },
          { session }
        );

        resultado = {
          id: propuesta._id,
          numero: propuesta.numero,
          titulo: propuesta.titulo,
          cliente: await db.collection("clientes").findOne({ _id: new ObjectId(propuesta.clienteId) }, { session }),
          precio: propuesta.precio,
          estado: propuesta.estado,
          fechaCambioEstado: propuesta.fechaCambioEstado,
        };

        if (nuevoEstado === "Aceptada") {
          const nuevoProyecto = Proyecto.crearDesdePropuesta(doc, propuesta.clienteId);
          console.log("Proyecto a insertar:", nuevoProyecto.toDBObject());// para ver nada mas
          const resultProyecto = await db.collection("proyectos").insertOne(nuevoProyecto.toDBObject(), { session });

          resultado.proyecto = {
            id: resultProyecto.insertedId,
            nombre: nuevoProyecto.nombre,
            codigoProyecto: nuevoProyecto.codigoProyecto,
            estado: nuevoProyecto.estado,
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

  // Listar clientes para usar en formularios CLI
  static async listarClientes() {
    const db = await connection();
    return await db.collection('clientes').find().sort({ nombre: 1 }).toArray();
  }

  // Listar propuestas pendientes
  static async listarPropuestasPendientes() {
    const db = await connection();
    const propuestas = await db.collection(this.collection).find({ estado: "Pendiente" }).sort({ fechaCreacion: -1 }).toArray();

    // Añadir datos del cliente
    const clienteIds = propuestas.map(p => p.clienteId.toString());
    const clientes = await db.collection("clientes").find({ _id: { $in: clienteIds.map(id => new ObjectId(id)) } }).toArray();
    const clienteMap = Object.fromEntries(clientes.map(c => [c._id.toString(), c]));

    return propuestas.map(p => ({
      ...p,
      cliente: clienteMap[p.clienteId.toString()] || { nombre: "Desconocido" },
    }));
  }

  // Obtener una propuesta por ID con cliente
  static async obtenerPropuestaDetallada(id) {
    const db = await connection();
    const propuesta = await db.collection(this.collection).findOne({ _id: new ObjectId(id) });
    if (!propuesta) return null;

    const cliente = await db.collection("clientes").findOne({ _id: new ObjectId(propuesta.clienteId) });

    return {
      ...propuesta,
      cliente: cliente || { nombre: "Desconocido", empresa: "" },
    };
  }

  // Estadísticas para resumen
  static async obtenerEstadisticas() {
    const db = await connection();
    const agregacion = await db.collection(this.collection).aggregate([
      {
        $group: {
          _id: "$estado",
          count: { $sum: 1 },
          totalValor: { $sum: "$precio" },
        },
      },
    ]).toArray();

    const resultado = {};
    agregacion.forEach(e => {
      resultado[e._id] = {
        count: e.count,
        totalValor: e.totalValor,
      };
    });

    return resultado;
  }
}
