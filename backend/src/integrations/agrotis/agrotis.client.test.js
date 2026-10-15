import { describe, expect, it, vi } from 'vitest'
import { createAgrotisClient } from './agrotis.client.js'

const account = { agrotisAccountId: '42', credentialsRef: 'AGROTIS_TEST' }

function setup() {
  const fetchJsonImpl = vi.fn()
  const client = createAgrotisClient({
    baseUrl: 'https://agrotis.test',
    getToken: async () => 'token-a',
    fetchJsonImpl,
  })
  return { client, fetchJsonImpl }
}

describe('createAgrotisClient', () => {
  it('fetches every entries page with bearer token', async () => {
    const { client, fetchJsonImpl } = setup()
    fetchJsonImpl
      .mockResolvedValueOnce({ itens: [{ id: 1 }], totalPaginas: 2 })
      .mockResolvedValueOnce({ itens: [{ id: 2 }], totalPaginas: 2 })

    const items = await client.fetchEntryItems({ account, from: '2026-09-01', to: '2026-09-10' })

    expect(items).toEqual([{ id: 1 }, { id: 2 }])
    expect(fetchJsonImpl).toHaveBeenNthCalledWith(
      1,
      'https://agrotis.test/financeiro/movimentos?contaId=42&dataInicial=2026-09-01&dataFinal=2026-09-10&pagina=1',
      { headers: { Authorization: 'Bearer token-a' }, dispatcher: undefined },
    )
  })

  it('fetches balance in cents', async () => {
    const { client, fetchJsonImpl } = setup()
    fetchJsonImpl.mockResolvedValue({ saldo: -10.5 })

    expect(await client.fetchBalanceCents({ account, date: '2026-09-10' })).toBe(-1050)
    expect(fetchJsonImpl).toHaveBeenCalledWith('https://agrotis.test/financeiro/contas/42/saldo?data=2026-09-10', {
      headers: { Authorization: 'Bearer token-a' },
      dispatcher: undefined,
    })
  })
})
