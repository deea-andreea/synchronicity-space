'use strict';

/** @type {import('sequelize-cli').Migration} */
// module.exports = 
export default{
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Notes', { 
      id: {
        allowNull:false,
        primaryKey:true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      trackId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      albumId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      text: {
        type: Sequelize.STRING(100), 
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      }
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Notes');
     
  }
};
