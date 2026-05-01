const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        set(value) {
            if (typeof value === 'string') {
                this.setDataValue('email', value.trim().toLowerCase());
            } else {
                this.setDataValue('email', value);
            }
        },
        validate: {
            notEmpty: {
                msg: 'Email is required.'
            },
            isEmail: {
                msg: 'Email format is invalid.'
            },
            len: {
                args: [5, 255],
                msg: 'Email must be between 5 and 255 characters long.'
            }
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Password is required.'
            }
        }
    },

    // ── Password Reset Fields ──────────────────────────────────────────────
    // Stores a SHA-256 hash of the raw reset token (never the raw token itself).
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    // Expiration timestamp — token is valid for 1 hour after generation.
    resetPasswordExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    }
}, {
    timestamps: true,
    tableName: 'users'
});

module.exports = User;