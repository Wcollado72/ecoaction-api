// Importamos los tipos de datos de Sequelize
const { DataTypes } = require('sequelize');
// Importamos la conexión que configuramos en el paso anterior
const sequelize = require('../config/db');

// Definimos el modelo 'User'
const User = sequelize.define('User', {
    // Definimos la columna ID como clave primaria y autoincremental
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // El email debe ser único y no puede estar vacío
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true // Valida que tenga formato de correo real
        }
    },
    // La contraseña es obligatoria
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    // Opciones adicionales
    timestamps: true, // Crea automáticamente las columnas 'createdAt' y 'updatedAt'
    tableName: 'users' // Nombre exacto de la tabla en MySQL
});

module.exports = User;