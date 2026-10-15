import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { BankAccount, Justification, Match, ReconciliationRun, Transaction } from '../models/index.js'
import { closeDatabase, prepareDatabase, truncateAll } from '../test/database.js'
import { createManualMatch, justifyTransaction, removeJustification, removeMatch } from './manualReconciliationService.js'

async function seedRun({ status = 'completed' } = {}) {
  const account = await BankAccount.create({
    name: 'Conta',
    branch: '1',
    accountNumber: '2',
    agrotisAccountId: '3',
    credentialsRef: 'X',
  })
  const run = await ReconciliationRun.create({
    bankAccountId: account.id,
    periodStart: '2026-09-10',
    periodEnd: '2026-09-10',
    trigger: 'manual',
    status,
    startedAt: new Date(),
  })
  const [a1, a2, s1, s2] = await Transaction.bulkCreate(
    [
      { runId: run.id, source: 'agrotis', externalId: 'a1', date: '2026-09-10', amount: 100, type: 'credit' },
      { runId: run.id, source: 'agrotis', externalId: 'a2', date: '2026-09-10', amount: 200, type: 'credit' },
      { runId: run.id, source: 'sicredi', externalId: 's1', date: '2026-09-10', amount: 100, type: 'credit' },
      { runId: run.id, source: 'sicredi', externalId: 's2', date: '2026-09-10', amount: 200, type: 'credit' },
    ],
    { returning: true },
  )
  return { run, a1, a2, s1, s2 }
}

describe('manualReconciliationService', () => {
  beforeAll(prepareDatabase)
  afterAll(closeDatabase)
  beforeEach(truncateAll)

  it('creates a manual match between an agrotis and a sicredi transaction', async () => {
    const { run, a1, s1 } = await seedRun()
    const match = await createManualMatch({ runId: run.id, agrotisTransactionId: a1.id, sicrediTransactionId: s1.id })
    expect(match.kind).toBe('manual')
    expect(await Match.count({ where: { runId: run.id } })).toBe(1)
  })

  it('rejects matches on runs that are not completed', async () => {
    const { run, a1, s1 } = await seedRun({ status: 'failed' })
    await expect(createManualMatch({ runId: run.id, agrotisTransactionId: a1.id, sicrediTransactionId: s1.id })).rejects.toMatchObject({
      status: 422,
      message: 'Só é possível conciliar manualmente execuções concluídas',
    })
  })

  it('rejects two transactions from the same side', async () => {
    const { run, a1, a2 } = await seedRun()
    await expect(createManualMatch({ runId: run.id, agrotisTransactionId: a1.id, sicrediTransactionId: a2.id })).rejects.toMatchObject({
      status: 422,
    })
  })

  it('rejects transactions from another run', async () => {
    const { run, a1 } = await seedRun()
    const other = await seedRun()
    await expect(createManualMatch({ runId: run.id, agrotisTransactionId: a1.id, sicrediTransactionId: other.s1.id })).rejects.toMatchObject({
      status: 404,
    })
  })

  it('rejects already linked or justified transactions', async () => {
    const { run, a1, a2, s1, s2 } = await seedRun()
    await createManualMatch({ runId: run.id, agrotisTransactionId: a1.id, sicrediTransactionId: s1.id })
    await expect(createManualMatch({ runId: run.id, agrotisTransactionId: a1.id, sicrediTransactionId: s2.id })).rejects.toMatchObject({
      status: 422,
      message: `Transação ${a1.id} já está vinculada`,
    })
    await justifyTransaction({ runId: run.id, transactionId: s2.id, reason: 'Tarifa' })
    await expect(createManualMatch({ runId: run.id, agrotisTransactionId: a2.id, sicrediTransactionId: s2.id })).rejects.toMatchObject({
      status: 422,
      message: `Transação ${s2.id} já está justificada`,
    })
    await expect(justifyTransaction({ runId: run.id, transactionId: a1.id, reason: 'x' })).rejects.toMatchObject({ status: 422 })
  })

  it('removes matches and justifications of the run', async () => {
    const { run, a1, s1, s2 } = await seedRun()
    const match = await createManualMatch({ runId: run.id, agrotisTransactionId: a1.id, sicrediTransactionId: s1.id })
    const justification = await justifyTransaction({ runId: run.id, transactionId: s2.id, reason: 'Tarifa' })

    await removeMatch({ runId: run.id, matchId: match.id })
    await removeJustification({ runId: run.id, justificationId: justification.id })

    expect(await Match.count()).toBe(0)
    expect(await Justification.count()).toBe(0)
    await expect(removeMatch({ runId: run.id, matchId: match.id })).rejects.toMatchObject({ status: 404 })
    await expect(removeJustification({ runId: run.id, justificationId: justification.id })).rejects.toMatchObject({ status: 404 })
  })
})
