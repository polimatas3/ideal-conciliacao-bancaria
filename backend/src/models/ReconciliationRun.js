import { DataTypes } from 'sequelize'
import { RUN_STATUSES, RUN_TRIGGERS } from '../config/enums.js'

export function defineReconciliationRun(sequelize) {
  return sequelize.define(
    'ReconciliationRun',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      bankAccountId: { type: DataTypes.INTEGER, allowNull: false },
      periodStart: { type: DataTypes.DATEONLY, allowNull: false },
      periodEnd: { type: DataTypes.DATEONLY, allowNull: false },
      trigger: { type: DataTypes.ENUM(...Object.values(RUN_TRIGGERS)), allowNull: false },
      status: { type: DataTypes.ENUM(...Object.values(RUN_STATUSES)), allowNull: false, defaultValue: RUN_STATUSES.RUNNING },
      agrotisBalance: { type: DataTypes.BIGINT, allowNull: true },
      sicrediBalance: { type: DataTypes.BIGINT, allowNull: true },
      balanceDifference: { type: DataTypes.BIGINT, allowNull: true },
      errorMessage: { type: DataTypes.TEXT, allowNull: true },
      startedAt: { type: DataTypes.DATE, allowNull: false },
      finishedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'reconciliation_runs' },
  )
}
