import pg from 'pg'
import { Sequelize } from 'sequelize'
import { env } from '../config/env.js'

pg.types.setTypeParser(pg.types.builtins.INT8, (value) => Number(value))

export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
  logging: false,
  define: { underscored: true },
})
