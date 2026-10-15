import { Op, col, fn } from 'sequelize'
import { env } from '../config/env.js'
import { MATCH_KINDS, RUN_STATUSES, SOURCES } from '../config/enums.js'
import { HttpError } from '../errors/HttpError.js'
import { getBankIntegration, getErpIntegration } from '../integrations/index.js'
import { BankAccount, Justification, Match, ReconciliationRun, Transaction } from '../models/index.js'
import { reconcileWithEngine } from './engineClient.js'
import { buildAutoMatches, planReapplication } from './matchPlanning.js'
import { buildRunDetail } from './runDetail.js'

const bankAccountSummary = { model: BankAccount, as: 'bankAccount', attributes: ['id', 'name'] }

export async function runReconciliation({ accountId, from, to, trigger }) {
  const account = await BankAccount.findByPk(accountId)
  if (!account) throw new HttpError(404, 'Conta não encontrada')

  const run = await ReconciliationRun.create({
    bankAccountId: account.id,
    periodStart: from,
    periodEnd: to,
    trigger,
    status: RUN_STATUSES.RUNNING,
    startedAt: new Date(),
  })

  try {
    const snapshot = await fetchSnapshot({ account, from, to })
    const engineResult = await persistSnapshot(run, snapshot)
    await run.update({
      status: RUN_STATUSES.COMPLETED,
      agrotisBalance: snapshot.balances.agrotis,
      sicrediBalance: snapshot.balances.sicredi,
      balanceDifference: engineResult.balance_difference,
      finishedAt: new Date(),
    })
  } catch (error) {
    await run.update({ status: RUN_STATUSES.FAILED, errorMessage: error.message, finishedAt: new Date() })
  }
  return run
}

async function fetchSnapshot({ account, from, to }) {
  const bank = getBankIntegration(account.bank)
  const erp = getErpIntegration()
  const [sicredi, agrotis] = await Promise.all([
    bank.fetchStatement({ account, from, to }),
    erp.fetchEntries({ account, from, to }),
  ])
  return {
    agrotisTransactions: agrotis.transactions,
    sicrediTransactions: sicredi.transactions,
    balances: { agrotis: agrotis.closingBalance, sicredi: sicredi.closingBalance },
  }
}

async function persistSnapshot(run, { agrotisTransactions, sicrediTransactions, balances }) {
  const storedTransactions = await Transaction.bulkCreate(
    [...agrotisTransactions, ...sicrediTransactions].map((transaction) => ({ ...transaction, runId: run.id })),
    { returning: true },
  )
  const engineResult = await reconcileWithEngine({
    agrotis: agrotisTransactions,
    sicredi: sicrediTransactions,
    dateToleranceDays: env.dateToleranceDays,
    balances,
  })
  const autoMatches = buildAutoMatches({ runId: run.id, engineMatches: engineResult.matches, storedTransactions })
  await Match.bulkCreate(autoMatches)
  await reapplyManualDecisions(run, storedTransactions, autoMatches)
  return engineResult
}

async function reapplyManualDecisions(run, currentTransactions, currentMatches) {
  const previousRun = await findPreviousCompletedRun(run)
  if (!previousRun) return
  const [previousManualMatches, previousJustifications] = await Promise.all([
    Match.findAll({
      where: { runId: previousRun.id, kind: MATCH_KINDS.MANUAL },
      include: [
        { model: Transaction, as: 'agrotisTransaction' },
        { model: Transaction, as: 'sicrediTransaction' },
      ],
    }),
    Justification.findAll({ include: [{ model: Transaction, as: 'transaction', where: { runId: previousRun.id } }] }),
  ])
  const plan = planReapplication({ runId: run.id, previousManualMatches, previousJustifications, currentTransactions, currentMatches })
  await Match.bulkCreate(plan.matches)
  await Justification.bulkCreate(plan.justifications)
}

function findPreviousCompletedRun(run) {
  return ReconciliationRun.findOne({
    where: {
      bankAccountId: run.bankAccountId,
      periodStart: run.periodStart,
      periodEnd: run.periodEnd,
      status: RUN_STATUSES.COMPLETED,
      id: { [Op.ne]: run.id },
    },
    order: [['id', 'DESC']],
  })
}

export async function listRuns({ accountId } = {}) {
  const where = accountId ? { bankAccountId: accountId } : {}
  const runs = await ReconciliationRun.findAll({ where, include: [bankAccountSummary], order: [['id', 'DESC']] })
  const summaries = await summarizeRuns(runs.map((run) => run.id))
  return runs.map((run) => ({ ...run.get({ plain: true }), summary: summaries.get(run.id) ?? emptySummary() }))
}

function emptySummary() {
  return { matched: 0, onlyAgrotis: 0, onlySicredi: 0 }
}

async function summarizeRuns(runIds) {
  const summaries = new Map()
  if (runIds.length === 0) return summaries
  const [transactionCounts, matchCounts] = await Promise.all([
    Transaction.findAll({
      attributes: ['runId', 'source', [fn('COUNT', col('id')), 'count']],
      where: { runId: runIds },
      group: ['run_id', 'source'],
      raw: true,
    }),
    Match.findAll({
      attributes: ['runId', [fn('COUNT', col('id')), 'count']],
      where: { runId: runIds },
      group: ['run_id'],
      raw: true,
    }),
  ])
  for (const runId of runIds) summaries.set(runId, emptySummary())
  for (const row of matchCounts) summaries.get(row.runId).matched = Number(row.count)
  for (const row of transactionCounts) {
    const summary = summaries.get(row.runId)
    const pending = Number(row.count) - summary.matched
    if (row.source === SOURCES.AGROTIS) summary.onlyAgrotis = pending
    else summary.onlySicredi = pending
  }
  return summaries
}

export async function getRunDetail(runId) {
  const run = await ReconciliationRun.findByPk(runId, { include: [bankAccountSummary] })
  if (!run) throw new HttpError(404, 'Execução não encontrada')
  const transactions = await Transaction.findAll({
    where: { runId },
    order: [['date', 'ASC'], ['externalId', 'ASC']],
    raw: true,
  })
  const matches = await Match.findAll({ where: { runId }, order: [['id', 'ASC']], raw: true })
  const justifications = await Justification.findAll({
    where: { transactionId: transactions.map((transaction) => transaction.id) },
    raw: true,
  })
  return buildRunDetail({ run: run.get({ plain: true }), transactions, matches, justifications })
}
