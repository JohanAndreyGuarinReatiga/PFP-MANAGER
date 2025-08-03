// initDB.js
import { connection } from "./db.js"

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
        fechaRegistro: { bsonType: "date" },
      },
    },
  },
  propuestas: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "clienteId",
        "titulo",
        "descripcion",
        "precio",
        "fechaLimite",
        "estado",
        "numero",
        "fechaCreacion",
        "fechaActualizacion",
      ],
      properties: {
        _id: { bsonType: "objectId" },
        clienteId: { bsonType: "objectId" },
        titulo: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        condiciones: { bsonType: "string" },
        precio: { bsonType: "double", minimum: 0 },
        fechaLimite: { bsonType: "date" },
        estado: {
          bsonType: "string",
          enum: ["Pendiente", "Aceptada", "Rechazada"],
        },
        numero: {
          bsonType: "string",
          description: "Número único de la propuesta",
        },
        fechaCreacion: { bsonType: "date" },
        fechaActualizacion: { bsonType: "date" },
      },
    },
  },
  proyectos: {
    $jsonSchema: {
      bsonType: "object",
      required: ["clienteId", "nombre", "estado", "fechaInicio", "valor", "codigoProyecto"],
      properties: {
        clienteId: { bsonType: "objectId" },
        propuestaId: { bsonType: ["objectId", "null"] },
        contratoId: { bsonType: ["objectId", "null"] },
        nombre: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        fechaInicio: { bsonType: "date" },
        fechaFin: { bsonType: ["date", "null"] },
        valor: { bsonType: "double", minimum: 0 },
        estado: {
          bsonType: "string",
          enum: ["Activo", "Pausado", "Finalizado", "Cancelado"],
        },
        codigoProyecto: { bsonType: "string" },
        avances: {
          bsonType: "array",
          minItems: 0,
          items: {
            bsonType: "object",
            required: ["fecha", "descripcion"],
            properties: {
              fecha: { bsonType: "date" },
              descripcion: { bsonType: "string" },
            },
          },
        },
        fechaCreacion: { bsonType: "date" },
      },
    },
  },
  contratos: {
    $jsonSchema: {
      bsonType: "object",
      required: ["proyectoId", "condiciones", "fechaInicio", "fechaFin", "valorTotal", "terminosPago", "estado", "fechaCreacion"],
      properties: {
        _id: { bsonType: "objectId" },
        numero: { bsonType: "string" },
        proyectoId: { bsonType: "objectId" },
        condiciones: { bsonType: "string" },
        fechaInicio: { bsonType: "date" },
        fechaFin: { bsonType: "date" },
        valorTotal: { bsonType: "double", minimum: 0 },
        terminosPago: { bsonType: "string" },
        estado: {
          enum: ["borrador", "firmado", "cancelado"],
        },
        fechaFirma: { bsonType: ["date", "null"] },
        fechaCreacion: { bsonType: "date" },
        fechaActualizacion: { bsonType: "date" },
      },
    },
  },
  entregables: {
    $jsonSchema: {
      bsonType: "object",
      required: ["titulo", "descripcion", "proyectoId", "fechaLimite", "estado"],
      properties: {
        _id: { bsonType: "objectId" },
        titulo: {
          bsonType: "string",
          description: "El título es obligatorio",
        },
        descripcion: {
          bsonType: "string",
          description: "La descripción es obligatoria",
        },
        proyectoId: {
          bsonType: "objectId",
          description: "ID del proyecto asociado",
        },
        fechaLimite: {
          bsonType: "date",
          description: "Fecha límite obligatoria",
        },
        estado: {
          enum: ["Pendiente", "En progreso", "Entregado", "Aprobado", "Rechazado"],
          description: "Estado del entregable",
        },
        fechaEntrega: {
          bsonType: ["date", "null"],
          description: "Fecha de entrega (opcional)",
        },
      },
    },
  },
  finanzas: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tipo", "descripcion", "monto", "fecha", "categoria"],
      properties: {
        proyectoId: { bsonType: ["objectId", "null"] },
        tipo: {
          enum: ["ingreso", "egreso"],
          description: "Debe ser ingreso o egreso",
        },
        descripcion: { bsonType: "string" },
        monto: { bsonType: "double", minimum: 0.01 },
        fecha: { bsonType: "date" },
        categoria: {
          bsonType: "string",
          description: "Categoría financiera (otros, herramientas, etc.)",
        },
      },
    },
  },
}

async function initDB() {
  const db = await connection()

  for (const [nombreColeccion, schema] of Object.entries(schemas)) {
    const existe = await db.listCollections({ name: nombreColeccion }).toArray()

    if (existe.length === 0) {
      await db.createCollection(nombreColeccion, {
        validator: schema,
      })
      console.log(`Colección '${nombreColeccion}' creada con schema.`)
      if (nombreColeccion === "clientes") {
        await db.collection("clientes").createIndex({ correo: 1 }, { unique: true })
        console.log("Índice único en 'correo' creado.")
      }
    } else {
      console.log(`Colección '${nombreColeccion}' ya existe.`)
    }
  }

  process.exit()
}

initDB().catch((err) => {
  console.error("Error al inicializar la base de datos:", err)
})
