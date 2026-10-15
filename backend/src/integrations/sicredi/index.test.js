import { describe, expect, it, vi } from 'vitest'
import { buildSicrediStatement, sicrediIntegration } from './index.js'

const movements = [
  { idMovimento: 'm1', data: '2026-09-10', descricao: 'PIX REC', valor: 1250, documento: null, complemento: null },
  { idMovimento: 'm2', data: '2026-09-11', descricao: 'TARIFA', valor: -15.9, documento: null, complemento: null },
]

describe('buildSicrediStatement', () => {
  it('maps movements and derives the closing balance from the previous balance', () => {
    const statement = buildSicrediStatement({ movements, previousBalance: 100.5 })

    expect(statement.transactions.map((t) => [t.externalId, t.amount, t.type])).toEqual([
      ['m1', 125000, 'credit'],
      ['m2', 1590, 'debit'],
    ])
    expect(statement.closingBalance).toBe(133460)
  })

  it('returns the previous balance when there are no movements', () => {
    expect(buildSicrediStatement({ movements: [], previousBalance: -500 })).toEqual({
      transactions: [],
      closingBalance: -50000,
    })
  })

  it('does not accumulate floating point error across many movements', () => {
    const noisy = Array.from({ length: 3 }, (unused, index) => ({
      idMovimento: `n${index}`,
      data: '2026-09-10',
      descricao: 'X',
      valor: 0.1,
      documento: null,
      complemento: null,
    }))

    expect(buildSicrediStatement({ movements: noisy, previousBalance: 0 }).closingBalance).toBe(30)
  })
})

describe('sicrediIntegration', () => {
  it('rejects instead of throwing synchronously when credentials are missing', async () => {
    const account = { branch: '1', accountNumber: '2', credentialsRef: 'SICREDI_MISSING_REF' }
    const statement = sicrediIntegration.fetchStatement({ account, from: '2026-09-10', to: '2026-09-10' })
    expect(statement).toBeInstanceOf(Promise)
    await expect(statement).rejects.toThrow('Credenciais não encontradas')
  })
})
