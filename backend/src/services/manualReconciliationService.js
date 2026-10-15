import { Op } from 'sequelize'
import { MATCH_KINDS, RUN_STATUSES, SOURCES } from '../config/enums.js'
import { HttpError } from '../errors/HttpError.js'
import { Justification, Match, ReconciliationRun, Transaction } from '../models/index.js'

export async function createManualMatch({ runId, agrotisTransactionId, sicrediTransactionId }) {
  await requireCompletedRun(runId)
  const [agrotis, sicredi] = await Promise.all([
    requireTransactionInRun({ runId, transactionId: agrotisTransactionId, source: SOURCES.AGROTIS }),
    requireTransactionInRun({ runId, transactionId: sicrediTransactionId, source: SOURCES.SICREDI }),
  ])
  await ensureUnlinked(agrotis)
  await ensureUnlinked(sicredi)
  return Match.create({ runId, agrotisTransactionId: agrotis.id, sicrediTransactionId: sicredi.id, kind: MATCH_KINDS.MANUAL })
}

export async function removeMatch({ runId, matchId }) {
  await requireCompletedRun(runId)
  const match = await Match.findOne({ where: { id: matchId, runId } })
  if (!match) throw new HttpError(404, 'Vínculo não encontrado')
  await match.destroy()
}

export async function justifyTransaction({ runId, transactionId, reason }) {
  await requireCompletedRun(runId)
  const transaction = await Transaction.findOne({ where: { id: transactionId, runId } })
  if (!transaction) throw new HttpError(404, `Transação ${transactionId} não encontrada nesta execução`)
  await ensureUnlinked(transaction)
  return Justification.create({ transactionId: transaction.id, reason })
}

export async function removeJustification({ runId, justificationId }) {
  await requireCompletedRun(runId)
  const justification = await Justification.findOne({
    where: { id: justificationId },
    include: [{ model: Transaction, as: 'transaction', where: { runId }, attributes: [] }],
  })
  if (!justification) throw new HttpError(404, 'Justificativa não encontrada')
  await justification.destroy()
}

async function requireCompletedRun(runId) {
  const run = await ReconciliationRun.findByPk(runId)
  if (!run) throw new HttpError(404, 'Execução não encontrada')
  if (run.status !== RUN_STATUSES.COMPLETED) {
    throw new HttpError(422, 'Só é possível conciliar manualmente execuções concluídas')
  }
  return run
}

async function requireTransactionInRun({ runId, transactionId, source }) {
  const transaction = await Transaction.findOne({ where: { id: transactionId, runId } })
  if (!transaction) throw new HttpError(404, `Transação ${transactionId} não encontrada nesta execução`)
  if (transaction.source !== source) throw new HttpError(422, `Transação ${transactionId} não é do lado ${source}`)
  return transaction
}

async function ensureUnlinked(transaction) {
  const [match, justification] = await Promise.all([
    Match.findOne({ where: { [Op.or]: [{ agrotisTransactionId: transaction.id }, { sicrediTransactionId: transaction.id }] } }),
    Justification.findOne({ where: { transactionId: transaction.id } }),
  ])
  if (match) throw new HttpError(422, `Transação ${transaction.id} já está vinculada`)
  if (justification) throw new HttpError(422, `Transação ${transaction.id} já está justificada`)
}
