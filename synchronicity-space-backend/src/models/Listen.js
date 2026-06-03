import { sequelize } from "../database.js";
import { DataTypes } from "sequelize";

export const Listen = sequelize.define('Listen', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    userId: DataTypes.UUID,
    albumId: DataTypes.STRING,
    genre: DataTypes.STRING,
    listenDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, 
{ timestamps: false }, 
{
  tableName: 'listens',
  freezeTableName: true,
});