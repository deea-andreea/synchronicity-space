import { DataTypes } from 'sequelize'
import { sequelize } from '../database.js'

export const Track = sequelize.define('Track', {
    id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING,
    },
    albumId: {
        allowNull: false,
        type: DataTypes.STRING,
    },
    title: {
        type: DataTypes.STRING,
    },

}, {
  timestamps: false // <--- ADD THIS HERE TOO
})