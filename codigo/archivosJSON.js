//Importar el módulo
const fs = require('fs/promises');

const RUTA = './campers.json';


//Crear un camper - primera vez
async function crearCamper(camper) {
    try {
        await fs.writeFile(RUTA, JSON.stringify([camper],null, 4));
        console.log("Camper creado")
    } catch (error) {
        console.error("Error: ",error)
    }
}

// crearCamper({
//     id: 66666,
//     nombre: "Brian",
//     email: "brian@yahoo.com"
// });

//Leer campers
async function leerCampers() {
    try {
        const data = await fs.readFile(RUTA);
        const campers = JSON.parse(data);
        console.log("Campers: ", campers)
    } catch (error) {
        console.error("Error: ",error)
    }
}

// leerCampers()

//Agregar camper
async function agregarCamper(camper) {
    let campers = []
    try {
        const data = await fs.readFile(RUTA);
        campers = JSON.parse(data);
    } catch (error) {
        console.error("Error: ",error)
    }

    campers.push(camper)

    try {
        await fs.writeFile(RUTA, JSON.stringify(campers,null, 4));
        console.log("Camper agregado")
    } catch (error) {
        console.error("Error: ",error)
    }
}

agregarCamper({
    id: 565656,
    nombre: "Daniel",
    email: "dani@gmail.com"
})