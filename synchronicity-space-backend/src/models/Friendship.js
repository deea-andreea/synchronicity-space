import { sequelize } from "../database.js";
import { DataTypes } from "sequelize";

export const Friendship = sequelize.define('Friendship', {
    userId: DataTypes.UUID,
    friendId: DataTypes.UUID,
    status: DataTypes.STRING
}, { timestamps: false,
      tableName: 'friendships',
  freezeTableName: true,
})