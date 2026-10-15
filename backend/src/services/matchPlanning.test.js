import { describe, expect, it } from 'vitest'
import { buildAutoMatches, planReapplication } from './matchPlanning.js'

const stored = [
  { id: 1, source: 'agrotis', externalId: 'a1' },
  { id: 2, source: 'agrotis', externalId: 'a2' },
  { id: 3, source: 'sicredi', externalId: 's1' },
  { id: 4, source: 'sicredi', externalId: 's2' },
]

describe('buildAutoMatches', () => {
  it('maps engine pairs to stored transaction ids', () => {
    const engineMatches = [{ agrotis_external_id: 'a1', sicredi_external_id: 's2' }]
    expect(buildAutoMatches({ runId: 9, engineMatches, storedTransactions: stored })).toEqual([
      { runId: 9, agrotisTransactionId: 1, sicrediTransactionId: 4, kind: 'auto' },
    ])
  })

  it('fails if the engine references an unknown transaction', () => {
    const engineMatches = [{ agrotis_external_id: 'zz', sicredi_external_id: 's2' }]
    expect(() => buildAutoMatches({ runId: 9, engineMatches, storedTransactions: stored })).toThrow(
      'Transação agrotis:zz retornada pelo motor não existe na execução',
    )
  })
})

describe('planReapplication', () => {
  const previousManualMatches = [
    {
      agrotisTransaction: { source: 'agrotis', externalId: 'a2' },
      sicrediTransaction: { source: 'sicredi', externalId: 's2' },
    },
    {
      agrotisTransaction: { source: 'agrotis', externalId: 'gone' },
      sicrediTransaction: { source: 'sicredi', externalId: 's1' },
    },
  ]
  const previousJustifications = [
    { reason: 'Tarifa interna', transaction: { source: 'sicredi', externalId: 's1' } },
    { reason: 'Some', transaction: { source: 'agrotis', externalId: 'gone' } },
  ]

  it('recreates manual matches and justifications whose transactions still exist and are free', () => {
    const plan = planReapplication({
      runId: 9,
      previousManualMatches,
      previousJustifications,
      currentTransactions: stored,
      currentMatches: [],
    })
    expect(plan.matches).toEqual([{ runId: 9, agrotisTransactionId: 2, sicrediTransactionId: 4, kind: 'manual' }])
    expect(plan.justifications).toEqual([{ transactionId: 3, reason: 'Tarifa interna' }])
  })

  it('skips transactions already linked by an auto match', () => {
    const plan = planReapplication({
      runId: 9,
      previousManualMatches,
      previousJustifications,
      currentTransactions: stored,
      currentMatches: [{ agrotisTransactionId: 1, sicrediTransactionId: 4 }],
    })
    expect(plan.matches).toEqual([])
    expect(plan.justifications).toEqual([{ transactionId: 3, reason: 'Tarifa interna' }])
  })

  it('does not justify a transaction it just re-matched', () => {
    const plan = planReapplication({
      runId: 9,
      previousManualMatches: [
        {
          agrotisTransaction: { source: 'agrotis', externalId: 'a1' },
          sicrediTransaction: { source: 'sicredi', externalId: 's1' },
        },
      ],
      previousJustifications: [{ reason: 'x', transaction: { source: 'sicredi', externalId: 's1' } }],
      currentTransactions: stored,
      currentMatches: [],
    })
    expect(plan.matches).toHaveLength(1)
    expect(plan.justifications).toEqual([])
  })
})
