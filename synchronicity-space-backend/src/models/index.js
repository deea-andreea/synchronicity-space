'use strict';

import { sequelize } from '../database.js'; 
import { User } from './User.js';
import { Note } from './Note.js';
import { Album } from './Album.js';
import { Track } from './Track.js';
import { Listen } from './Listen.js';
import { Role } from './Role.js';
import { Permission } from './Permission.js';
import { Friendship } from './Friendship.js';
import { UserAlbum } from './UserAlbum.js';

User.hasMany(Note, { foreignKey: 'userId' });
Note.belongsTo(User, { foreignKey: 'userId' });

Album.hasMany(Track, { as: 'Tracks', foreignKey: 'albumId' });
Track.belongsTo(Album, { foreignKey: 'albumId' });

User.hasMany(Listen, { foreignKey: 'userId' });
Listen.belongsTo(User, { foreignKey: 'userId' });

Role.belongsToMany(Permission, { through: 'rolepermissions' });
Permission.belongsToMany(Role, { through: 'rolepermissions' });

User.belongsTo(Role, { foreignKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });

User.belongsToMany(User, { 
  as: 'Friends', 
  through: {
    model: Friendship, 
    timestamps:false
  },
  foreignKey: 'userId', 
  otherKey: 'friendId' 
});

User.belongsToMany(Album, { through: UserAlbum, foreignKey: 'userId', otherKey: 'albumId' });
Album.belongsToMany(User, { through: UserAlbum, foreignKey: 'albumId', otherKey: 'userId' });

export { sequelize, User, Note, Album, Track, Listen, Role, Permission, Friendship, UserAlbum };