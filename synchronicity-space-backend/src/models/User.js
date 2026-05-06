import { DataTypes } from 'sequelize';
import { sequelize } from '../database.js';

export const User = sequelize.define('User', {
    id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
    },
    username: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    avatar: {
        type: DataTypes.STRING
    }
    // spotifyId: { type: DataTypes.STRING, unique: true },
    // accessToken: { type: DataTypes.TEXT },
    // refreshToken: { type: DataTypes.TEXT },
    
}, {
  timestamps: false 
});

User.beforeCreate(async (user) => {
    // const salt = await bcrypt.genSalt(10);
    // user.password = await bcrypt.hash(user.password, salt);
});