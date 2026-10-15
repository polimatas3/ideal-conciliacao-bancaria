import { env } from '../../config/env.js'
import { toSignedCents } from '../../utils/money.js'
import { readCredentials } from '../credentials.js'
import { fetchJson } from '../http.js'
import { createTokenProvider } from '../oauthToken.js'
import { fetchAllPages } from '../pagination.js'

export function createAgrotisClient({ baseUrl, getToken, dispatcher, fetchJsonImpl = fetchJson }) {
  async function authorizedGet(url) {
    const token = await getToken()
    return fetchJsonImpl(url, { headers: { Authorization: `Bearer ${token}` }, dispatcher })
  }

  return {
    fetchEntryItems({ account, from, to }) {
      return fetchAllPages(async (page) => {
        const response = await authorizedGet(
          `${baseUrl}/financeiro/movimentos?contaId=${account.agrotisAccountId}&dataInicial=${from}&dataFinal=${to}&pagina=${page}`,
        )
        return { items: response.itens ?? [], totalPages: response.totalPaginas ?? 1 }
      })
    },

    async fetchBalanceCents({ account, date }) {
      const response = await authorizedGet(`${baseUrl}/financeiro/contas/${account.agrotisAccountId}/saldo?data=${date}`)
      return toSignedCents(response.saldo)
    },
  }
}

const tokenProviders = new Map()

function tokenProviderFor(credentialsRef) {
  if (!tokenProviders.has(credentialsRef)) {
    const { clientId, clientSecret } = readCredentials(credentialsRef)
    tokenProviders.set(
      credentialsRef,
      createTokenProvider({ tokenUrl: env.agrotisTokenUrl, clientId, clientSecret }),
    )
  }
  return tokenProviders.get(credentialsRef)
}

export function agrotisClientFor(account) {
  return createAgrotisClient({ baseUrl: env.agrotisBaseUrl, getToken: tokenProviderFor(agrotisCredentialsRef(account)) })
}

function agrotisCredentialsRef(account) {
  return account.credentialsRef.replace(/^SICREDI_/, 'AGROTIS_')
}
