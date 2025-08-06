//Importar el módulo
const fs = require('fs/promises');

//Escribir en un archivo (tipo sobreescritura)
async function crearEscribirArchivo(ruta, contenido) {
    try {
        await fs.writeFile(ruta, contenido);
        console.log("Archivo creado y escrito!")
    } catch (error) {
        console.error("Error: ", error)
    }
}

// crearEscribirArchivo("./data/file.txt", "Hola mundo!!");

//Agregar contenido
async function agregarContenido(ruta, contenido) {
    try {
        await fs.appendFile(ruta, contenido+"\n");
        console.log("Contenido agregado!!")
    } catch (error) {
        console.error("Error: ", error)
    }
}

// agregarContenido("./data/file.txt", "Hola a todos")

//Leer archivo
async function leerArchivo(ruta) {
    try {
        const data = await fs.readFile(ruta);
        console.log("Contenido del archivo:\n"+data)
    } catch (error) {
        console.log("Error: ", error)
    }
}

// leerArchivo("./data/file.txt")

//Eliminar archivo
async function EliminarArchivo(ruta) {
    try {
        await fs.unlink(ruta)
        console.log("Archivo eliminado!!")
    } catch (error) {
        console.log("Error: ", error)
    }
}

// EliminarArchivo("./data/file.txt");

//Verificar si existe una archivo
async function existe(ruta) {
    try {
        await fs.access(ruta)
        console.log("El archivo existe!")
    } catch (error) {
        console.log("El archivo NO existe!")
    }
}

// existe("./data/file.txt");

//Tarea: Crear una carpeta y como listar los archivos de una carpeta