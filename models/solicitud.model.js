const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Solicitud = sequelize.define('Solicitud', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  nombre_completo: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 150],
    },
  },

  telefono: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 30],
    },
  },

  correo: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  },

  interes_principal: {
    type: DataTypes.ENUM('Reinos', 'Colinas', 'Inversion'),
    allowNull: false,
  },

  mensaje: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  fecha_registro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },

}, {
  tableName: 'solicitudes',
  timestamps: false,
});

module.exports = Solicitud;