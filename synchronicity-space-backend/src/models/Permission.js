import { sequelize } from "../database.js";
import { DataTypes } from "sequelize";

export const Permission = sequelize.define('Permission', {
    id: { 
        type: DataTypes.UUID, 
        defaultValue: DataTypes.UUIDV4, 
        primaryKey: true 
    },
    name: { 
        type: DataTypes.STRING,
        allowNull: false, 
        unique: true
    } 
}, { 
    timestamps: false 
}, {
  tableName: 'permissions',
  freezeTableName: true,
});