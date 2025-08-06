import inquirer from 'inquirer'

async function solicitarNombre() {
    const respuesta = await inquirer.prompt([
        {
            type: 'input',
            name: 'nombre',
            message: 'Ingresa tu nombre: '
        }
    ])

    console.log("Hola "+respuesta.nombre)
}

solicitarNombre()