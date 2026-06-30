import { DataTypes } from 'sequelize';
import { sequelize } from '../database.js';

export const UserAlbum = sequelize.define('UserAlbum', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' }
    },
    albumId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'Albums', key: 'id' }
    },
    purchaseDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
  tableName: 'UserAlbums',
  timestamps: true,
  freezeTableName: true,
});