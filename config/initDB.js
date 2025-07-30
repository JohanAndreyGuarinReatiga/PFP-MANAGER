// initDB.js
import { connection } from "./db.js";
import { ObjectId } from "mongodb";

const schemas = {
  clientes: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "correo"],
      properties: {
        nombre: { bsonType: "string" },
        correo: { bsonType: "string", pattern: "^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$" },
        telefono: { bsonType: "string" },
        empresa: { bsonType: "string" },
        fechaRegistro: { bsonType: "date" }
      }
    }
  },
  propuestas: {
    $jsonSchema: {
      bsonType: "object",
      required: ["clienteId", "descripcion", "precio", "plazoDias"],
      properties: {
        clienteId: { bsonType: "objectId" },
        descripcion: { bsonType: "string" },
        precio: { bsonType: "double", minimum: 0 },
        plazoDias: { bsonType: "int", minimum: 1 },
        estado: {
          enum: ["pendiente", "aceptada", "rechazada"]
        },
        fechaCreacion: { bsonType: "date" }
      }
    }
  },
  proyectos: {
    $jsonSchema: {
      bsonType: "object",
      required: ["clienteId", "propuestaId", "nombre"],
      properties: {
        clienteId: { bsonType: "objectId" },
        propuestaId: { bsonType: "objectId" },
        contratoId: { bsonType: "objectId" },
        nombre: { bsonType: "string" },
        estado: {
          enum: ["activo", "pausado", "finalizado", "cancelado"]
        },
        avances: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["fecha", "descripcion"],
            properties: {
              fecha: { bsonType: "date" },
              descripcion: { bsonType: "string" }
            }
          }
        }
      }
    }
  },
  contratos: {
    $jsonSchema: {
      bsonType: "object",
      required: ["proyectoId", "condiciones", "fechaInicio", "fechaFin", "valorTotal"],
      properties: {
        proyectoId: { bsonType: "objectId" },
        condiciones: { bsonType: "string" },
        fechaInicio: { bsonType: "date" },
        fechaFin: { bsonType: "date" },
        valorTotal: { bsonType: "double", minimum: 0 }
      }
    }
  },
  entregables: {
    $jsonSchema: {
      bsonType: "object",
      required: ["proyectoId", "nombre", "fechaLimite"],
      properties: {
        proyectoId: { bsonType: "objectId" },
        nombre: { bsonType: "string" },
        fechaLimite: { bsonType: "date" },
        estado: {
          enum: ["pendiente", "entregado", "aprobado", "rechazado"]
        },
        fechaEntrega: { bsonType: "date" }
      }
    }
  },
  finanzas: {
    $jsonSchema: {
      bsonType: "object",
      required: ["proyectoId", "tipo", "descripcion", "monto"],
      properties: {
        proyectoId: { bsonType: "objectId" },
        tipo: {
          enum: ["ingreso", "egreso"]
        },
        descripcion: { bsonType: "string" },
        monto: { bsonType: "double", minimum: 0 },
        fecha: { bsonType: "date" }
      }
    }
  }
};

async function initDB() {
  const db = await connection();

  for (const [nombreColeccion, schema] of Object.entries(schemas)) {
    const existe = await db.listCollections({ name: nombreColeccion }).toArray();

    if (existe.length === 0) {
      await db.createCollection(nombreColeccion, {
        validator: schema
      });
      console.log(`Colección '${nombreColeccion}' creada con schema.`);
    if (nombreColeccion === "clientes") {
      await db.collection("clientes").createIndex({ correo: 1 }, { unique: true });
      console.log("Índice único en 'correo' creado.");
    }
    } else {
      console.log(`Colección '${nombreColeccion}' ya existe.`);
    }
  }

  process.exit(); 
}

initDB().catch(err => {
  console.error("Error al inicializar la base de datos:", err);
});
