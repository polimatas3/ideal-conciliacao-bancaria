import { DataTypes } from 'sequelize'
import { BANKS } from '../config/enums.js'

export function defineBankAccount(sequelize) {
  return sequelize.define(
    'BankAccount',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      bank: { type: DataTypes.ENUM(...Object.values(BANKS)), allowNull: false, defaultValue: BANKS.SICREDI },
      branch: { type: DataTypes.STRING, allowNull: false },
      accountNumber: { type: DataTypes.STRING, allowNull: false },
      agrotisAccountId: { type: DataTypes.STRING, allowNull: false },
      credentialsRef: { type: DataTypes.STRING, allowNull: false },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'bank_accounts' },
  )
}
