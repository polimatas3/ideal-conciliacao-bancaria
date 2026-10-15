import { createMigrator } from '../db/migrate.js'
import { sequelize } from '../models/index.js'

export async function prepareDatabase() {
  await createMigrator().up()
}

export async function truncateAll() {
  await sequelize.query(
    'TRUNCATE TABLE justifications, matches, transactions, reconciliation_runs, bank_accounts RESTART IDENTITY CASCADE',
  )
}

export async function closeDatabase() {
  await sequelize.close()
}
