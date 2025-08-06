//Importar el módulo
const fs = require('fs/promises');

const RUTA = './carro.json';

class Carro{
    constructor(marca, modelo, precio){
        this.marca = marca;
        this.modelo = modelo;
        this.precio = precio;
    }

    cotizar(){
        console.log(`El carro marca ${this.marca} modelo ${this.modelo} cuesta ${this.precio}`);
    }
}

async function guardarCarro(ruta, carro) {
    const carrojson = JSON.stringify(carro, null, 4);
    await fs.writeFile(ruta, carrojson)
    console.log("Carro guardado")
}

// const carro = new Carro("Mazda", "2", 30000000);

// guardarCarro(RUTA, carro);

async function leerCarro(ruta) {
    const data = await fs.readFile(ruta);
    const carrojson = JSON.parse(data);
    const carro = new Carro(carrojson.marca, carrojson.modelo, carrojson.precio);
    carro.cotizar();
}

leerCarro(RUTA);