export const UserAlbum = sequelize.define('UserAlbum', {
    userId: {
        type: DataTypes.UUID,
        references: { model: 'Users', key: 'id' }
    },
    albumId: {
        type: DataTypes.STRING,
        references: { model: 'Albums', key: 'spotifyAlbumId' }
    },
    purchaseDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
  tableName: 'useralbums',
  freezeTableName: true,
});

User.belongsToMany(Album, { through: UserAlbum });
Album.belongsToMany(User, { through: UserAlbum });