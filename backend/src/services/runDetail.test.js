import { describe, expect, it } from 'vitest'
import { buildRunDetail } from './runDetail.js'

const run = { id: 9, status: 'completed' }
const transactions = [
  { id: 1, source: 'agrotis', externalId: 'a1', amount: 100 },
  { id: 2, source: 'agrotis', externalId: 'a2', amount: 200 },
  { id: 3, source: 'sicredi', externalId: 's1', amount: 100 },
  { id: 4, source: 'sicredi', externalId: 's2', amount: 300 },
]
const matches = [{ id: 7, kind: 'auto', agrotisTransactionId: 1, sicrediTransactionId: 3 }]
const justifications = [{ id: 5, transactionId: 4, reason: 'Tarifa' }]

describe('buildRunDetail', () => {
  it('splits transactions into matched and pending per side', () => {
    const detail = buildRunDetail({ run, transactions, matches, justifications })

    expect(detail.run).toBe(run)
    expect(detail.matched).toEqual([
      { id: 7, kind: 'auto', agrotis: transactions[0], sicredi: transactions[2] },
    ])
    expect(detail.onlyAgrotis).toEqual([{ ...transactions[1], justification: null }])
    expect(detail.onlySicredi).toEqual([{ ...transactions[3], justification: { id: 5, reason: 'Tarifa' } }])
    expect(detail.summary).toEqual({ matched: 1, onlyAgrotis: 1, onlySicredi: 1, justified: 1 })
  })
})
