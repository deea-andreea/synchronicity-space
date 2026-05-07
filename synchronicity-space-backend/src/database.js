import { Sequelize } from "sequelize";


export const sequelize = new Sequelize('synchronicity_space_db', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
    storage: ':memory:'
})
