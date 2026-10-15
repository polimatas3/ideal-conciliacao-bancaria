import { env } from '../../config/env.js'
import { TRANSACTION_TYPES } from '../../config/enums.js'
import { toSignedCents } from '../../utils/money.js'
import { readCredentials } from '../credentials.js'
import { SICREDI_APIS, resolveSicrediApi } from './sicrediApiChoice.js'
import { buildSicrediAuth } from './sicredi.auth.js'
import { createSicrediClient } from './sicredi.client.js'
import { mapSicrediTransaction } from './sicredi.mapper.js'
import { buildPixStatement } from './sicrediPix.js'
import { createSicrediPixClient } from './sicrediPix.client.js'

export function buildSicrediStatement({ movements, previousBalance }) {
  const transactions = movements.map(mapSicrediTransaction)
  const movedCents = transactions.reduce(
    (total, transaction) =>
      total + (transaction.type === TRANSACTION_TYPES.DEBIT ? -transaction.amount : transaction.amount),
    0,
  )
  return { transactions, closingBalance: toSignedCents(previousBalance) + movedCents }
}

const sessions = new Map()

function sessionFor(account) {
  const { credentialsRef } = account
  if (!sessions.has(credentialsRef)) {
    const credentials = readCredentials(credentialsRef)
    const target = resolveSicrediApi(credentials)
    const auth = buildSicrediAuth(credentials, {
      tokenUrl: target.tokenUrl,
      scope: target.scope,
      credentialsIn: target.credentialsIn,
    })
    sessions.set(credentialsRef, { target, auth })
  }
  return sessions.get(credentialsRef)
}

function clientFor(account) {
  const { target, auth } = sessionFor(account)
  const shared = { baseUrl: target.baseUrl, getToken: auth.getToken, dispatcher: auth.dispatcher, pageSize: env.sicrediPageSize }
  if (target.api === SICREDI_APIS.PIX) return { api: target.api, client: createSicrediPixClient(shared) }
  return { api: target.api, client: createSicrediClient(shared) }
}

export const sicrediIntegration = {
  async fetchStatement({ account, from, to }) {
    const { api, client } = clientFor(account)
    if (api === SICREDI_APIS.PIX) return buildPixStatement(await client.fetchReceivedPix({ from, to }))
    return buildSicrediStatement(await client.fetchStatement({ account, from, to }))
  },

  async fetchCurrentBalance({ account }) {
    const { api, client } = clientFor(account)
    if (api === SICREDI_APIS.PIX) return null
    return client.fetchCurrentBalanceCents({ account })
  },
}
