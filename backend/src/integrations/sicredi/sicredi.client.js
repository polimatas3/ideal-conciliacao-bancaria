import { toSignedCents } from '../../utils/money.js'
import { fetchJson } from '../http.js'

const STATEMENT_PATH = '/contacorrente/v1/extratos'
const BALANCES_PATH = '/contacorrente/v1/saldos'

export function createSicrediClient({ baseUrl, getToken, dispatcher, pageSize, fetchJsonImpl = fetchJson }) {
  async function authorizedGet(url) {
    const token = await getToken()
    return fetchJsonImpl(url, { headers: { Authorization: `Bearer ${token}` }, dispatcher })
  }

  return {
    async fetchStatement({ account, from, to }) {
      const movements = []
      let previousBalance = 0
      let page = 0
      let totalPages = 1
      while (page < totalPages) {
        const response = await authorizedGet(
          `${baseUrl}${STATEMENT_PATH}?dataInicio=${from}&dataFim=${to}&page=${page}&size=${pageSize}`,
        )
        if (page === 0) previousBalance = response.saldoAnterior ?? 0
        movements.push(...(response.dtlMovimentos ?? []))
        totalPages = response.totalPages ?? 1
        page += 1
      }
      return { movements, previousBalance }
    },

    async fetchCurrentBalanceCents({ account }) {
      const response = await authorizedGet(`${baseUrl}${BALANCES_PATH}`)
      return toSignedCents(response.saldoAtual)
    },
  }
}
