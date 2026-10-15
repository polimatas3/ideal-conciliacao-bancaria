import { MATCH_KINDS, RUN_STATUSES, RUN_TRIGGERS, SOURCES, TRANSACTION_TYPES } from '../config/enums.js'
import { BankAccount, Justification, Match, ReconciliationRun, Transaction, sequelize } from '../models/index.js'

const { AGROTIS, SICREDI } = SOURCES
const { CREDIT, DEBIT } = TRANSACTION_TYPES

const demoTransactions = [
  { source: AGROTIS, externalId: 'AG-1001', date: '2026-09-10', amount: 1250000, type: CREDIT, description: 'Venda soja lote 12', documentNumber: 'NF 4501' },
  { source: AGROTIS, externalId: 'AG-1002', date: '2026-09-10', amount: 89900, type: DEBIT, description: 'Frete transportadora' },
  { source: AGROTIS, externalId: 'AG-1003', date: '2026-09-11', amount: 45000, type: DEBIT, description: 'Peças manutenção' },
  { source: AGROTIS, externalId: 'AG-1004', date: '2026-09-11', amount: 300000, type: CREDIT, description: 'Adiantamento cliente' },
  { source: SICREDI, externalId: 'SC-77001', date: '2026-09-11', amount: 1250000, type: CREDIT, description: 'PIX REC COOPERATIVA', documentNumber: 'NF 4501' },
  { source: SICREDI, externalId: 'SC-77002', date: '2026-09-10', amount: 89900, type: DEBIT, description: 'PIX ENV TRANSP' },
  { source: SICREDI, externalId: 'SC-77003', date: '2026-09-11', amount: 1590, type: DEBIT, description: 'TARIFA PACOTE' },
  { source: SICREDI, externalId: 'SC-77004', date: '2026-09-11', amount: 45000, type: DEBIT, description: 'DEB AUTOMATICO' },
]

const autoPairs = [
  ['AG-1001', 'SC-77001'],
  ['AG-1002', 'SC-77002'],
  ['AG-1003', 'SC-77004'],
]

const account = await BankAccount.create({
  name: 'Conta demo Sicredi',
  branch: '0710',
  accountNumber: '99999-0',
  agrotisAccountId: 'demo-42',
  credentialsRef: 'SICREDI_CONTA_PRINCIPAL',
})

const run = await ReconciliationRun.create({
  bankAccountId: account.id,
  periodStart: '2026-09-10',
  periodEnd: '2026-09-11',
  trigger: RUN_TRIGGERS.MANUAL,
  status: RUN_STATUSES.COMPLETED,
  agrotisBalance: 5430000,
  sicrediBalance: 5428410,
  balanceDifference: 1590,
  startedAt: new Date(),
  finishedAt: new Date(),
})

const stored = await Transaction.bulkCreate(
  demoTransactions.map((transaction) => ({ ...transaction, runId: run.id })),
  { returning: true },
)
const idByExternalId = new Map(stored.map((transaction) => [transaction.externalId, transaction.id]))

await Match.bulkCreate(
  autoPairs.map(([agrotisExternalId, sicrediExternalId]) => ({
    runId: run.id,
    agrotisTransactionId: idByExternalId.get(agrotisExternalId),
    sicrediTransactionId: idByExternalId.get(sicrediExternalId),
    kind: MATCH_KINDS.AUTO,
  })),
)
await Justification.create({ transactionId: idByExternalId.get('SC-77003'), reason: 'Tarifa bancária, lançar no Agrotis' })

console.log(`Seed demo criado: conta ${account.id}, execução ${run.id}`)
await sequelize.close()
