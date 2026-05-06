'use strict'
/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Albums', {
            id: {
                type: Sequelize.STRING,
                primaryKey: true
            },
            title: Sequelize.STRING,
            artist: Sequelize.STRING,
            coverURL: Sequelize.STRING
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Albums')
    }
}