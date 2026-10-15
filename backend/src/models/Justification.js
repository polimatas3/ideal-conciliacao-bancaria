import { DataTypes } from 'sequelize'

export function defineJustification(sequelize) {
  return sequelize.define(
    'Justification',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      transactionId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      reason: { type: DataTypes.TEXT, allowNull: false },
    },
    { tableName: 'justifications', updatedAt: false },
  )
}
