// Importamos Sequelize para manejar la base de datos de forma profesional
const { Sequelize } = require('sequelize');
require('dotenv').config(); // Cargamos las variables de entorno del archivo .env

// Creamos la conexión usando las variables que definimos en el .env
const sequelize = new Sequelize(
    process.env.DB_NAME, // Nombre de la base de datos (ecoaction_db)
    process.env.DB_USER, // Usuario (root)
    process.env.DB_PASS, // Contraseña (root_password)
    {
        host: process.env.DB_HOST, // Servidor (localhost)
        port: process.env.DB_PORT, // Puerto que cambiamos al 3307
        dialect: 'mysql', // Le decimos que usaremos MySQL
        logging: false    // Para que no llene la terminal de mensajes extra
    }
);

// Función para probar si la conexión funciona
const authenticateDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a MySQL establecida correctamente.');
    } catch (error) {
        console.error('❌ No se pudo conectar a la base de datos:', error);
    }
};

authenticateDB();

module.exports = sequelize;