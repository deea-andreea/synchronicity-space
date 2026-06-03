import { DataTypes } from 'sequelize'
import { sequelize } from '../database.js'

export const Album = sequelize.define('Album', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    title: DataTypes.STRING,
    artist: DataTypes.STRING,
    genre: DataTypes.STRING,
    coverURL: DataTypes.STRING
}, {
  timestamps: false 
}, {
  tableName: 'albums',
  freezeTableName: true,
})