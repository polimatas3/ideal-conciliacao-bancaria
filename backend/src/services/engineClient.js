import { env } from '../config/env.js'
import { fetchJson } from '../integrations/http.js'

export async function reconcileWithEngine(
  { agrotis, sicredi, dateToleranceDays, balances },
  { engineUrl = env.engineUrl, fetchJsonImpl = fetchJson } = {},
) {
  const body = {
    agrotis: agrotis.map(toEngineTransaction),
    sicredi: sicredi.map(toEngineTransaction),
    rules: { date_tolerance_days: dateToleranceDays },
    balances,
  }
  try {
    return await fetchJsonImpl(`${engineUrl}/reconcile`, { method: 'POST', retries: 1, body })
  } catch (error) {
    throw new Error(`Motor de conciliação indisponível: ${error.message}`)
  }
}

function toEngineTransaction(transaction) {
  return {
    external_id: transaction.externalId,
    source: transaction.source,
    date: transaction.date,
    amount: transaction.amount,
    type: transaction.type,
    description: transaction.description,
    document_number: transaction.documentNumber ?? null,
  }
}
