'use strict'
/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Friendships', {
            userId: Sequelize.UUID,
            friendId: Sequelize.UUID,
            status: Sequelize.STRING
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Track')
    }
}