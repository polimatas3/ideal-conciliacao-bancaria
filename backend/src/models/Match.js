import { DataTypes } from 'sequelize'
import { MATCH_KINDS } from '../config/enums.js'

export function defineMatch(sequelize) {
  return sequelize.define(
    'Match',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      runId: { type: DataTypes.INTEGER, allowNull: false },
      agrotisTransactionId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      sicrediTransactionId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      kind: { type: DataTypes.ENUM(...Object.values(MATCH_KINDS)), allowNull: false },
    },
    { tableName: 'matches', updatedAt: false },
  )
}
