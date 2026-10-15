import { describe, expect, it, vi } from 'vitest'
import { createSicrediPixClient } from './sicrediPix.client.js'

const dispatcher = { mtls: true }

function setup(pageSize = 100) {
  const fetchJsonImpl = vi.fn()
  const client = createSicrediPixClient({
    baseUrl: 'https://api-pix.test',
    getToken: async () => 'token-1',
    dispatcher,
    pageSize,
    fetchJsonImpl,
  })
  return { client, fetchJsonImpl }
}

function page({ pix = [], paginaAtual = 0, quantidadeDePaginas = 1 } = {}) {
  return { pix, parametros: { paginacao: { paginaAtual, quantidadeDePaginas, itensPorPagina: 100 } } }
}

describe('createSicrediPixClient', () => {
  it('queries the period as utc instants and walks every page', async () => {
    const { client, fetchJsonImpl } = setup(2)
    fetchJsonImpl
      .mockResolvedValueOnce(page({ pix: [{ endToEndId: 'E1' }], quantidadeDePaginas: 2 }))
      .mockResolvedValueOnce(page({ pix: [{ endToEndId: 'E2' }], paginaAtual: 1, quantidadeDePaginas: 2 }))

    const received = await client.fetchReceivedPix({ from: '2026-09-10', to: '2026-09-10' })

    expect(received).toEqual([{ endToEndId: 'E1' }, { endToEndId: 'E2' }])
    const [firstUrl, firstOptions] = fetchJsonImpl.mock.calls[0]
    const params = new URL(firstUrl).searchParams
    expect(new URL(firstUrl).pathname).toBe('/api/v2/pix')
    expect(params.get('inicio')).toBe('2026-09-10T03:00:00.000Z')
    expect(params.get('fim')).toBe('2026-09-11T02:59:59.999Z')
    expect(params.get('paginacao.paginaAtual')).toBe('0')
    expect(params.get('paginacao.itensPorPagina')).toBe('2')
    expect(firstOptions).toEqual({ headers: { Authorization: 'Bearer token-1' }, dispatcher })
    expect(new URL(fetchJsonImpl.mock.calls[1][0]).searchParams.get('paginacao.paginaAtual')).toBe('1')
  })

  it('stops after a single empty page', async () => {
    const { client, fetchJsonImpl } = setup()
    fetchJsonImpl.mockResolvedValue(page({ quantidadeDePaginas: 0 }))

    expect(await client.fetchReceivedPix({ from: '2026-09-10', to: '2026-09-10' })).toEqual([])
    expect(fetchJsonImpl).toHaveBeenCalledTimes(1)
  })
})
