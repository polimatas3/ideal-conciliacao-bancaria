import { sequelize } from '../db/sequelize.js'
import { defineBankAccount } from './BankAccount.js'
import { defineJustification } from './Justification.js'
import { defineMatch } from './Match.js'
import { defineReconciliationRun } from './ReconciliationRun.js'
import { defineTransaction } from './Transaction.js'

export const BankAccount = defineBankAccount(sequelize)
export const ReconciliationRun = defineReconciliationRun(sequelize)
export const Transaction = defineTransaction(sequelize)
export const Match = defineMatch(sequelize)
export const Justification = defineJustification(sequelize)

BankAccount.hasMany(ReconciliationRun, { foreignKey: 'bankAccountId', as: 'runs' })
ReconciliationRun.belongsTo(BankAccount, { foreignKey: 'bankAccountId', as: 'bankAccount' })

ReconciliationRun.hasMany(Transaction, { foreignKey: 'runId', as: 'transactions' })
Transaction.belongsTo(ReconciliationRun, { foreignKey: 'runId', as: 'run' })

ReconciliationRun.hasMany(Match, { foreignKey: 'runId', as: 'matches' })
Match.belongsTo(ReconciliationRun, { foreignKey: 'runId', as: 'run' })
Match.belongsTo(Transaction, { foreignKey: 'agrotisTransactionId', as: 'agrotisTransaction' })
Match.belongsTo(Transaction, { foreignKey: 'sicrediTransactionId', as: 'sicrediTransaction' })

Transaction.hasOne(Justification, { foreignKey: 'transactionId', as: 'justification' })
Justification.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' })

export { sequelize }
