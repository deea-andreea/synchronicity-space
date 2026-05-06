'use strict'
/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Track', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.STRING,
            },
            albumId: {
                allowNull: false,
                type: Sequelize.STRING,
            },
            title: {
                type: Sequelize.STRING,
            },
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Track')
    }
}
