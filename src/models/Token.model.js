const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const Token = sequelize.define('Token', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // userId: ..., // Foreign key ke User
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    type: { // Jenis token: 'refresh', 'reset_password', 'verify_email'
        type: DataTypes.ENUM('refresh', 'reset_password', 'verify_email'),
        allowNull: false,
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    timestamps: true,
});

module.exports = Token;