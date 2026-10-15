import { saoPauloDayRangeToUtc } from '../../utils/dates.js'
import { fetchJson } from '../http.js'

const RECEIVED_PIX_PATH = '/api/v2/pix'

export function createSicrediPixClient({ baseUrl, getToken, dispatcher, pageSize, fetchJsonImpl = fetchJson }) {
  async function authorizedGet(url) {
    const token = await getToken()
    return fetchJsonImpl(url, { headers: { Authorization: `Bearer ${token}` }, dispatcher })
  }

  return {
    async fetchReceivedPix({ from, to }) {
      const { start, end } = saoPauloDayRangeToUtc(from, to)
      const received = []
      let page = 0
      let totalPages = 1
      while (page < totalPages) {
        const query = new URLSearchParams({
          inicio: start,
          fim: end,
          'paginacao.paginaAtual': String(page),
          'paginacao.itensPorPagina': String(pageSize),
        })
        const response = await authorizedGet(`${baseUrl}${RECEIVED_PIX_PATH}?${query}`)
        received.push(...(response.pix ?? []))
        totalPages = response.parametros?.paginacao?.quantidadeDePaginas ?? 1
        page += 1
      }
      return received
    },
  }
}
