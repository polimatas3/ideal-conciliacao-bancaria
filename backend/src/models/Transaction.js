import { DataTypes } from 'sequelize'
import { SOURCES, TRANSACTION_TYPES } from '../config/enums.js'

export function defineTransaction(sequelize) {
  return sequelize.define(
    'Transaction',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      runId: { type: DataTypes.INTEGER, allowNull: false },
      source: { type: DataTypes.ENUM(...Object.values(SOURCES)), allowNull: false },
      externalId: { type: DataTypes.STRING, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      amount: { type: DataTypes.BIGINT, allowNull: false },
      type: { type: DataTypes.ENUM(...Object.values(TRANSACTION_TYPES)), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
      documentNumber: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'transactions',
      indexes: [{ unique: true, fields: ['run_id', 'source', 'external_id'] }],
    },
  )
}
