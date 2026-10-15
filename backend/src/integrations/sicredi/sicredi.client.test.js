import { describe, expect, it, vi } from 'vitest'
import { createSicrediClient } from './sicredi.client.js'

const account = { branch: '0710', accountNumber: '12345-6', credentialsRef: 'SICREDI_TEST' }
const dispatcher = { mtls: true }

function setup(pageSize = 100) {
  const fetchJsonImpl = vi.fn()
  const client = createSicrediClient({
    baseUrl: 'https://mtls.sicredi.test',
    getToken: async () => 'token-1',
    dispatcher,
    pageSize,
    fetchJsonImpl,
  })
  return { client, fetchJsonImpl }
}

function statementPage({ movements = [], pageNumber = 0, totalPages = 1, saldoAnterior = 0 } = {}) {
  return { saldoAnterior, dtlMovimentos: movements, pageNumber, totalPages, totalElements: movements.length }
}

describe('createSicrediClient', () => {
  it('walks every zero-based page of the statement with bearer token and mtls', async () => {
    const { client, fetchJsonImpl } = setup(2)
    fetchJsonImpl
      .mockResolvedValueOnce(statementPage({ movements: [{ idMovimento: 'a' }], totalPages: 2, saldoAnterior: -500 }))
      .mockResolvedValueOnce(statementPage({ movements: [{ idMovimento: 'b' }], pageNumber: 1, totalPages: 2 }))

    const statement = await client.fetchStatement({ account, from: '2026-09-01', to: '2026-09-10' })

    expect(statement.movements).toEqual([{ idMovimento: 'a' }, { idMovimento: 'b' }])
    expect(statement.previousBalance).toBe(-500)
    expect(fetchJsonImpl).toHaveBeenNthCalledWith(
      1,
      'https://mtls.sicredi.test/contacorrente/v1/extratos?dataInicio=2026-09-01&dataFim=2026-09-10&page=0&size=2',
      { headers: { Authorization: 'Bearer token-1' }, dispatcher },
    )
    expect(fetchJsonImpl).toHaveBeenNthCalledWith(
      2,
      'https://mtls.sicredi.test/contacorrente/v1/extratos?dataInicio=2026-09-01&dataFim=2026-09-10&page=1&size=2',
      { headers: { Authorization: 'Bearer token-1' }, dispatcher },
    )
  })

  it('handles an empty statement', async () => {
    const { client, fetchJsonImpl } = setup()
    fetchJsonImpl.mockResolvedValue(statementPage({ totalPages: 0, saldoAnterior: 931151.27 }))

    const statement = await client.fetchStatement({ account, from: '2026-09-01', to: '2026-09-10' })

    expect(statement.movements).toEqual([])
    expect(statement.previousBalance).toBe(931151.27)
    expect(fetchJsonImpl).toHaveBeenCalledTimes(1)
  })

  it('fetches the current balance from the balances endpoint', async () => {
    const { client, fetchJsonImpl } = setup()
    fetchJsonImpl.mockResolvedValue({ saldoAtual: 931151.27, saldoContaCorrente: 400 })

    expect(await client.fetchCurrentBalanceCents({ account })).toBe(93115127)
    expect(fetchJsonImpl).toHaveBeenCalledWith('https://mtls.sicredi.test/contacorrente/v1/saldos', {
      headers: { Authorization: 'Bearer token-1' },
      dispatcher,
    })
  })
})
