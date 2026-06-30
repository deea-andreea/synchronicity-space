import { DataTypes } from 'sequelize';
import { sequelize } from '../database.js';
import { z } from 'zod';

export const Note = sequelize.define('Note', {
    id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    trackId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    albumId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    text: {
        type: DataTypes.STRING(100),
        allowNull: false,
    }
}, {
    timestamps: true,
    tableName: 'notes',
  freezeTableName: true,
});

export const NoteCreateSchema = z.object({
    userId: z.string().uuid(),
    trackId: z.string(),
    albumId: z.string(),
    text: z.string().min(1).max(100)
});

export const NoteUpdateSchema = z.object({
    text: z.string().min(1).max(100)
});