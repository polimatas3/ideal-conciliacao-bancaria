import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../integrations/index.js', () => ({ getBankIntegration: vi.fn(), getErpIntegration: vi.fn() }))
vi.mock('./engineClient.js', () => ({ reconcileWithEngine: vi.fn() }))

import { getBankIntegration, getErpIntegration } from '../integrations/index.js'
import { BankAccount, Justification, Match, ReconciliationRun, Transaction } from '../models/index.js'
import { closeDatabase, prepareDatabase, truncateAll } from '../test/database.js'
import { reconcileWithEngine } from './engineClient.js'
import { getRunDetail, listRuns, runReconciliation } from './reconciliationService.js'

const agrotisEntries = [
  { externalId: 'a1', source: 'agrotis', date: '2026-09-10', amount: 15000, type: 'credit', description: 'Venda' },
  { externalId: 'a2', source: 'agrotis', date: '2026-09-10', amount: 9900, type: 'debit', description: 'Frete' },
]
const sicrediEntries = [
  { externalId: 's1', source: 'sicredi', date: '2026-09-11', amount: 15000, type: 'credit', description: 'PIX REC' },
  { externalId: 's2', source: 'sicredi', date: '2026-09-10', amount: 5000, type: 'debit', description: 'TARIFA' },
]
const engineResult = {
  matches: [{ agrotis_external_id: 'a1', sicredi_external_id: 's1' }],
  only_agrotis: ['a2'],
  only_sicredi: ['s2'],
  balance_difference: 5000,
  summary: { matched: 1, only_agrotis: 1, only_sicredi: 1 },
}

function mockIntegrations({ agrotis = agrotisEntries, sicredi = sicrediEntries, balances = { agrotis: 100000, sicredi: 95000 } } = {}) {
  getBankIntegration.mockReturnValue({
    fetchStatement: async () => ({ transactions: sicredi, closingBalance: balances.sicredi }),
  })
  getErpIntegration.mockReturnValue({
    fetchEntries: async () => ({ transactions: agrotis, closingBalance: balances.agrotis }),
  })
}

async function createAccount() {
  return BankAccount.create({
    name: 'Conta principal',
    branch: '0710',
    accountNumber: '12345-6',
    agrotisAccountId: '42',
    credentialsRef: 'SICREDI_TEST',
  })
}

describe('reconciliationService', () => {
  beforeAll(prepareDatabase)
  afterAll(closeDatabase)
  beforeEach(async () => {
    await truncateAll()
    vi.clearAllMocks()
    mockIntegrations()
    reconcileWithEngine.mockResolvedValue(engineResult)
  })

  it('stores the snapshot, auto matches and balances of a completed run', async () => {
    const account = await createAccount()

    const run = await runReconciliation({ accountId: account.id, from: '2026-09-10', to: '2026-09-11', trigger: 'manual' })

    expect(run.status).toBe('completed')
    expect(run.agrotisBalance).toBe(100000)
    expect(run.sicrediBalance).toBe(95000)
    expect(run.balanceDifference).toBe(5000)
    expect(await Transaction.count({ where: { runId: run.id } })).toBe(4)
    expect(await Match.count({ where: { runId: run.id } })).toBe(1)

    const detail = await getRunDetail(run.id)
    expect(detail.summary).toEqual({ matched: 1, onlyAgrotis: 1, onlySicredi: 1, justified: 0 })
    expect(detail.matched[0].agrotis.externalId).toBe('a1')
    expect(detail.matched[0].sicredi.externalId).toBe('s1')
    expect(detail.matched[0].kind).toBe('auto')
    expect(detail.onlyAgrotis.map((t) => t.externalId)).toEqual(['a2'])
    expect(detail.onlySicredi.map((t) => t.externalId)).toEqual(['s2'])
    expect(detail.run.bankAccount.name).toBe('Conta principal')
    expect(typeof detail.onlyAgrotis[0].amount).toBe('number')
  })

  it('marks the run as failed when an integration fails', async () => {
    const account = await createAccount()
    getBankIntegration.mockReturnValue({
      fetchStatement: async () => {
        throw new Error('HTTP 401 ao chamar sicredi')
      },
    })

    const run = await runReconciliation({ accountId: account.id, from: '2026-09-10', to: '2026-09-10', trigger: 'scheduled' })

    expect(run.status).toBe('failed')
    expect(run.errorMessage).toBe('HTTP 401 ao chamar sicredi')
    expect(run.finishedAt).toBeInstanceOf(Date)
    expect(await Transaction.count({ where: { runId: run.id } })).toBe(0)
  })

  it('marks the run as failed when the engine is unavailable', async () => {
    const account = await createAccount()
    reconcileWithEngine.mockRejectedValue(new Error('Motor de conciliação indisponível: ECONNREFUSED'))

    const run = await runReconciliation({ accountId: account.id, from: '2026-09-10', to: '2026-09-10', trigger: 'manual' })

    expect(run.status).toBe('failed')
    expect(run.errorMessage).toBe('Motor de conciliação indisponível: ECONNREFUSED')
    expect(await Transaction.count({ where: { runId: run.id } })).toBe(4)
  })

  it('rejects unknown accounts', async () => {
    await expect(runReconciliation({ accountId: 999, from: '2026-09-10', to: '2026-09-10', trigger: 'manual' })).rejects.toMatchObject({
      status: 404,
    })
  })

  it('reapplies manual matches and justifications from the previous run of the same period', async () => {
    const account = await createAccount()
    const firstRun = await runReconciliation({ accountId: account.id, from: '2026-09-10', to: '2026-09-11', trigger: 'manual' })
    const firstTransactions = await Transaction.findAll({ where: { runId: firstRun.id } })
    const byExternalId = Object.fromEntries(firstTransactions.map((t) => [t.externalId, t]))
    await Match.create({
      runId: firstRun.id,
      agrotisTransactionId: byExternalId.a2.id,
      sicrediTransactionId: byExternalId.s2.id,
      kind: 'manual',
    })

    reconcileWithEngine.mockResolvedValue({ ...engineResult, matches: [] })
    mockIntegrations({ sicredi: [...sicrediEntries, { externalId: 's3', source: 'sicredi', date: '2026-09-11', amount: 1, type: 'debit', description: 'x' }] })
    const secondRun = await runReconciliation({ accountId: account.id, from: '2026-09-10', to: '2026-09-11', trigger: 'manual' })
    const secondTransactions = await Transaction.findAll({ where: { runId: secondRun.id } })
    const secondByExternalId = Object.fromEntries(secondTransactions.map((t) => [t.externalId, t]))
    await Justification.create({ transactionId: secondByExternalId.s3.id, reason: 'Tarifa interna' })

    const thirdRun = await runReconciliation({ accountId: account.id, from: '2026-09-10', to: '2026-09-11', trigger: 'manual' })

    const detail = await getRunDetail(thirdRun.id)
    expect(detail.matched.map((m) => [m.kind, m.agrotis.externalId, m.sicredi.externalId])).toEqual([['manual', 'a2', 's2']])
    expect(detail.onlySicredi.find((t) => t.externalId === 's3').justification).toMatchObject({ reason: 'Tarifa interna' })
  })

  it('stores a run without balance difference when the bank api has no balance', async () => {
    const account = await createAccount()
    mockIntegrations({ balances: { agrotis: 100000, sicredi: null } })
    reconcileWithEngine.mockResolvedValue({ ...engineResult, balance_difference: null })

    const run = await runReconciliation({ accountId: account.id, from: '2026-09-10', to: '2026-09-11', trigger: 'manual' })

    expect(run.status).toBe('completed')
    expect(run.sicrediBalance).toBeNull()
    expect(run.balanceDifference).toBeNull()
    expect(run.agrotisBalance).toBe(100000)
    const detail = await getRunDetail(run.id)
    expect(detail.summary.matched).toBe(1)
  })

  it('lists runs newest first with summary counts', async () => {
    const account = await createAccount()
    await runReconciliation({ accountId: account.id, from: '2026-09-10', to: '2026-09-10', trigger: 'manual' })
    const second = await runReconciliation({ accountId: account.id, from: '2026-09-11', to: '2026-09-11', trigger: 'scheduled' })

    const runs = await listRuns({ accountId: account.id })

    expect(runs.map((r) => r.id)).toEqual([second.id, second.id - 1])
    expect(runs[0].summary).toEqual({ matched: 1, onlyAgrotis: 1, onlySicredi: 1 })
    expect(runs[0].bankAccount.name).toBe('Conta principal')
    expect(await listRuns({ accountId: 999 })).toEqual([])
  })
})
