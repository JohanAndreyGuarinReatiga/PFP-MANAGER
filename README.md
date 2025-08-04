<!-- README.md
Debe incluir:


Principios SOLID aplicados
Patrones de diseño usados y dónde
Consideraciones técnicas
Créditos -->

# PFP-MANAGER

### Descripcion del proyecto 

Esta es una aplicación de línea de comandos (CLI) desarrollada en Node.js para ayudar a freelancers a gestionar su portafolio profesional. La herramienta facilita el control de clientes, las propuestas, proyectos, contratos, entregables y finanzas, todo desde la consola. Con ella, un freelancer puede registrar ingresos y egresos, generar contratos, llevar un seguimiento del progreso de los entregables y mantener una visión clara de su negocio.

## Instalacion y uso

**Asegurate de tener instalado lo siguiente:**
- `Node.js`
- `MongoDB` (con un servidor en ejecucion)

### Pasos de Instalación

1. Clona este repositorio: 
``` Bash
https://github.com/JohanAndreyGuarinReatiga/PFP-MANAGER.git
```
2. Primero ejecutar la base de datos:
``` Bash
node configDB\initDB.js
```
3. Instala las dependencias del proyecto:
``` Bash
npm install
```
4. Crea un archivo .env en la raíz del proyecto y configura la conexión a tu base de datos MongoDB. Asegúrate de incluir la URL de conexión.
``` Bash
MONGO_URI=mongodb://localhost:27017 (o tu conexion atlas)
DB_NAME=PFP-MANAGER
```
**Uso**
Para iniciar la aplicación, ejecuta el siguiente comando en la terminal:
``` Bash
npm menu.js
```
La aplicación te guiará a través de un menú interactivo para acceder a las diferentes funcionalidades.

## Estructura del Proyecto

El proyecto sigue una estructura organizada y modular para facilitar su mantenimiento y escalabilidad.

``` pgsql
/
├── .env                 # Variables de entorno para la configuración de la aplicación
├── .gitignore           # Archivos y directorios que Git debe ignorar
├── menu.js              # Archivo principal que define la lógica del menú de la CLI
├── package-lock.json
├── package.json         # Dependencias del proyecto y scripts
├── README.md            # Este archivo de documentación
├── /commands            # Lógica para manejar la entrada del usuario y los comandos
│   ├── clientesCommands.js
│   ├── contratoCommands.js
│   ├── entregableCommands.js
│   ├── finanzasCommands.js
│   ├── propuestaCommands.js
│   └── proyectoCommands.js
├── /config              # Archivos de configuración de la aplicación
│   ├── db.js            # Configuración de la conexión a la base de datos
│   └── initDB.js        # Script para inicializar la base de datos
├── /controllers         # Lógica de manejo de peticiones o acciones
│   └── controllersCliente.js
├── /models              # Definición de los modelos de datos y sus validaciones
│   ├── cliente.js
│   ├── contrato.js
│   ├── entregable.js
│   ├── finanza.js
│   ├── propuesta.js
│   └── proyecto.js
├── /services            # Lógica de negocio y servicios
│   ├── servicioCliente.js
│   ├── servicioContrato.js
│   ├── servicioEntregable.js
│   ├── servicioFinanzas.js
│   ├── servicioPropuesta.js
│   └── servicioProyecto.js
├── /utils               # Funciones de utilidad y helpers
│   └── seleccionarCliente.js # Lógica para seleccionar un cliente de forma interactiva
└── /views               # Componentes de la interfaz de usuario de la CLI (vistas)
    ├── dashboardCliente.js
    └── dashboardUsuarioPFP.js
```


## Principios SOLID Aplicados

Se han aplicado los principios SOLID para construir una arquitectura de software robusta, flexible y fácil de mantener.

**Principio de Responsabilidad Única (SRP):** Cada clase, módulo o función en el proyecto tiene una única razón para cambiar. Esta separación se observa claramente en la estructura de carpetas:

``/models:`` Contiene la lógica exclusiva de la estructura de datos y las validaciones de negocio para cada entidad (cliente, proyecto, propuesta, etc.).

``/services:`` Se enfoca en la lógica de negocio y las operaciones de persistencia. Por ejemplo, ``servicioCliente.js`` gestiona todo lo relacionado con clientes, y ``servicioFinanzas.js`` maneja la lógica financiera, sin mezclar responsabilidades.

``/commands:`` Se dedica a la lógica de la interfaz de la línea de comandos, gestionando la interacción con el usuario a través de ``inquirer`` y delegando las acciones a los servicios correspondientes.

**Principio de Abierto/Cerrado (OCP):** El sistema está diseñado para ser extensible sin modificar las clases existentes. Esto se logra a través de la modularidad del proyecto. Por ejemplo, para añadir una nueva funcionalidad, como la gestión de un nuevo tipo de entregable, simplemente se crearía un nuevo servicio y un nuevo comando, sin necesidad de alterar los módulos de proyectos, clientes o finanzas ya implementados.

**Principio de Sustitución de Liskov (LSP):** Este principio se manifiesta en la consistencia de los modelos y los servicios. Las instancias de las clases de modelos, como ``Cliente`` o ``Proyecto``, pueden ser utilizadas por cualquier servicio que las requiera sin que se rompa la funcionalidad. Las validaciones de los constructores y los métodos estáticos, como P``royecto.crearDesdePropuesta()``, aseguran que todos los objetos cumplan con la misma "interfaz" de datos, garantizando un comportamiento predecible.

**Principio de Segregación de Interfaces (ISP):** Las interfaces (en este caso, los métodos de los módulos y las clases) se mantienen pequeñas y especializadas. La división de la lógica en múltiples servicios (`servicioCliente.js`, `servicioContrato.js`, etc.) y comandos (``clientesCommands.js``, ``finanzasCommands.js``, etc.) evita la creación de interfaces monolíticas. De esta manera, cada módulo cliente solo depende de las funciones que necesita, lo que reduce el acoplamiento y facilita la comprensión del código.

**Principio de Inversión de Dependencias (DIP):** Los módulos de alto nivel no dependen de los de bajo nivel. La estructura del proyecto ilustra esta inversión:

El módulo de la interfaz principal (``menu.js``) depende de las abstracciones de los comandos de la CLI (``commands``).

Los comandos dependen de los servicios (``services``), que son las abstracciones de la lógica de negocio.

Los servicios dependen de la capa de conexión a la base de datos, que se inyecta como una dependencia.
Este diseño garantiza que los componentes más estables y de alto nivel no se vean afectados por cambios en los detalles de implementación.

**Patrones de Diseño Utilizados**
Se han implementado los siguientes patrones para resolver problemas comunes de diseño de software de forma eficiente y escalable.

**Patrón Repository:** La capa de servicios (``/services``) actúa como un repositorio, encapsulando la lógica de acceso a la base de datos y proporcionando una interfaz clara y consistente para la lógica de negocio. Cada servicio, como ``ServicioCliente``, actúa como un ``repository`` para una colección específica de MongoDB, liberando a otros módulos de la complejidad de las consultas a la base de datos.

**Patrón Factory:** Se utiliza en la creación de instancias de los modelos de datos. El constructor de cada clase de modelo (como ``Cliente`` y ``Proyecto``) funciona como una fábrica, asegurando que todos los objetos se creen de manera consistente y validada. Esto centraliza la lógica de inicialización y validación, previniendo la creación de objetos no válidos en cualquier parte del código.

**Patrón Command:** Este patrón se aplica en el directorio ``/commands``, donde cada archivo encapsula una solicitud específica del usuario (por ejemplo, registrar un cliente, listar proyectos). Al modularizar las acciones de la CLI, el archivo principal ``menu.js`` actúa como un invocador que puede ejecutar diferentes comandos sin conocer los detalles de su implementación. Esto hace que la interfaz sea flexible y fácil de extender.

### Consideraciones Técnicas
**Persistencia de Datos:** La aplicación utiliza **MongoDB** como base de datos, interactuando directamente con el **driver oficial de Node.js** (``mongodb``), sin el uso de ORMs, lo que permite un control más granular sobre las consultas y las transacciones.

**Transacciones:** Las operaciones críticas que requieren una consistencia de datos (por ejemplo, el registro de ingresos en ``servicioFinanzas.js`` o el cambio de estado de un entregable) se ejecutan dentro de **transacciones de MongoDB**. Esto asegura que las operaciones compuestas sean atómicas y que los datos se mantengan íntegros en caso de fallos.

**Programación Orientada a Objetos (POO):** El proyecto está estructurado con clases para los modelos, servicios y otras utilidades, promoviendo la encapsulación, la herencia (donde aplica) y el polimorfismo para construir un código coherente y bien organizado.

**Validaciones:** La validación de los datos se realiza a nivel de los modelos de datos, en los constructores de cada clase. Esto garantiza que cualquier objeto creado en la aplicación cumpla con las reglas de negocio antes de ser procesado o persistido.

**Librerías NPM:** La experiencia de usuario de la CLI se ha mejorado con ``inquirer`` para los menús interactivos y ``chalk`` para dar formato y color al texto. El manejo de variables de entorno se gestiona con ``dotenv``. Se utiliza ``dayjs`` para simplificar la manipulación y el formateo de fechas.

## Video explicativo

https://www.canva.com/design/DAGvE_PAKXY/_dlRgY5Y2bUBWVv3ej6HpQ/edit?utm_content=DAGvE_PAKXY&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

## creditos

Este proyecto fue desarrollado por:
- David Alberto Medina Herrera
- Johan Andreu Guarin
- Jose Julian Ortega Navarro

