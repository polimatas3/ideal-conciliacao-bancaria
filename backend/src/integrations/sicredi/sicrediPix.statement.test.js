import { describe, expect, it } from 'vitest'
import { buildPixStatement } from './sicrediPix.js'

const received = [
  {
    endToEndId: 'E1',
    txid: 'tx1',
    valor: '125.00',
    chave: 'loja@test.com',
    horario: '2026-09-10T13:00:00.000Z',
    devolucoes: [],
    pagador: { nome: 'CLIENTE A' },
  },
  {
    endToEndId: 'E2',
    txid: 'tx2',
    valor: '50.00',
    chave: 'loja@test.com',
    horario: '2026-09-11T13:00:00.000Z',
    devolucoes: [{ rtrId: 'D1', valor: '10.00', horario: { solicitacao: '2026-09-11T15:00:00.000Z' } }],
    pagador: { nome: 'CLIENTE B' },
  },
]

describe('buildPixStatement', () => {
  it('flattens received pix and refunds into canonical transactions', () => {
    const statement = buildPixStatement(received)

    expect(statement.transactions.map((t) => [t.externalId, t.amount, t.type])).toEqual([
      ['E1', 12500, 'credit'],
      ['E2', 5000, 'credit'],
      ['D1', 1000, 'debit'],
    ])
  })

  it('reports no closing balance because the pix api does not expose one', () => {
    expect(buildPixStatement(received).closingBalance).toBeNull()
  })
})
