'use strict'

export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Listens', {
            userId: Sequelize.UUID,
            albumId: Sequelize.STRING,
            genre: Sequelize.STRING,
            listenDate: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            }
        })
    }
}