'use strict';

export default{
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserAlbums', {
      id: { 
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users', 
          key: 'id'       
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      albumId: {
        type: Sequelize.STRING, 
        allowNull: false,
        references: {
          model: 'Albums', 
          key: 'id' 
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      purchaseDate: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserAlbums');
  }
};