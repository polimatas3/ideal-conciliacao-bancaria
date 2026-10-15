import { DataTypes } from 'sequelize'
import { BANKS, MATCH_KINDS, RUN_STATUSES, RUN_TRIGGERS, SOURCES, TRANSACTION_TYPES } from '../../config/enums.js'

const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
}

export async function up(queryInterface) {
  await queryInterface.createTable('bank_accounts', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    bank: { type: DataTypes.ENUM(...Object.values(BANKS)), allowNull: false, defaultValue: BANKS.SICREDI },
    branch: { type: DataTypes.STRING, allowNull: false },
    account_number: { type: DataTypes.STRING, allowNull: false },
    agrotis_account_id: { type: DataTypes.STRING, allowNull: false },
    credentials_ref: { type: DataTypes.STRING, allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...timestamps,
  })

  await queryInterface.createTable('reconciliation_runs', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    bank_account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'bank_accounts', key: 'id' },
      onDelete: 'CASCADE',
    },
    period_start: { type: DataTypes.DATEONLY, allowNull: false },
    period_end: { type: DataTypes.DATEONLY, allowNull: false },
    trigger: { type: DataTypes.ENUM(...Object.values(RUN_TRIGGERS)), allowNull: false },
    status: { type: DataTypes.ENUM(...Object.values(RUN_STATUSES)), allowNull: false, defaultValue: RUN_STATUSES.RUNNING },
    agrotis_balance: { type: DataTypes.BIGINT, allowNull: true },
    sicredi_balance: { type: DataTypes.BIGINT, allowNull: true },
    balance_difference: { type: DataTypes.BIGINT, allowNull: true },
    error_message: { type: DataTypes.TEXT, allowNull: true },
    started_at: { type: DataTypes.DATE, allowNull: false },
    finished_at: { type: DataTypes.DATE, allowNull: true },
    ...timestamps,
  })

  await queryInterface.createTable('transactions', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    run_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'reconciliation_runs', key: 'id' },
      onDelete: 'CASCADE',
    },
    source: { type: DataTypes.ENUM(...Object.values(SOURCES)), allowNull: false },
    external_id: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    amount: { type: DataTypes.BIGINT, allowNull: false },
    type: { type: DataTypes.ENUM(...Object.values(TRANSACTION_TYPES)), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    document_number: { type: DataTypes.STRING, allowNull: true },
    ...timestamps,
  })
  await queryInterface.addIndex('transactions', ['run_id', 'source', 'external_id'], {
    unique: true,
    name: 'transactions_run_source_external_unique',
  })

  await queryInterface.createTable('matches', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    run_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'reconciliation_runs', key: 'id' },
      onDelete: 'CASCADE',
    },
    agrotis_transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'transactions', key: 'id' },
      onDelete: 'CASCADE',
    },
    sicredi_transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'transactions', key: 'id' },
      onDelete: 'CASCADE',
    },
    kind: { type: DataTypes.ENUM(...Object.values(MATCH_KINDS)), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
  })

  await queryInterface.createTable('justifications', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'transactions', key: 'id' },
      onDelete: 'CASCADE',
    },
    reason: { type: DataTypes.TEXT, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
  })
}

export async function down(queryInterface) {
  await queryInterface.dropTable('justifications')
  await queryInterface.dropTable('matches')
  await queryInterface.dropTable('transactions')
  await queryInterface.dropTable('reconciliation_runs')
  await queryInterface.dropTable('bank_accounts')
  for (const enumType of [
    'enum_matches_kind',
    'enum_transactions_type',
    'enum_transactions_source',
    'enum_reconciliation_runs_status',
    'enum_reconciliation_runs_trigger',
    'enum_bank_accounts_bank',
  ]) {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumType}"`)
  }
}
