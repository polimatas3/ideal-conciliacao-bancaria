import { MATCH_KINDS } from '../config/enums.js'

function transactionKey(transaction) {
  return `${transaction.source}:${transaction.externalId}`
}

function indexIdsByKey(transactions) {
  return new Map(transactions.map((transaction) => [transactionKey(transaction), transaction.id]))
}

function linkedIdsOf(matches) {
  return new Set(matches.flatMap((match) => [match.agrotisTransactionId, match.sicrediTransactionId]))
}

export function buildAutoMatches({ runId, engineMatches, storedTransactions }) {
  const idByKey = indexIdsByKey(storedTransactions)
  const requireId = (source, externalId) => {
    const id = idByKey.get(`${source}:${externalId}`)
    if (!id) throw new Error(`Transação ${source}:${externalId} retornada pelo motor não existe na execução`)
    return id
  }
  return engineMatches.map((match) => ({
    runId,
    agrotisTransactionId: requireId('agrotis', match.agrotis_external_id),
    sicrediTransactionId: requireId('sicredi', match.sicredi_external_id),
    kind: MATCH_KINDS.AUTO,
  }))
}

export function planReapplication({ runId, previousManualMatches, previousJustifications, currentTransactions, currentMatches }) {
  const idByKey = indexIdsByKey(currentTransactions)
  const linked = linkedIdsOf(currentMatches)

  const matches = []
  for (const previous of previousManualMatches) {
    const agrotisTransactionId = idByKey.get(transactionKey(previous.agrotisTransaction))
    const sicrediTransactionId = idByKey.get(transactionKey(previous.sicrediTransaction))
    const bothExist = agrotisTransactionId && sicrediTransactionId
    if (!bothExist || linked.has(agrotisTransactionId) || linked.has(sicrediTransactionId)) continue
    linked.add(agrotisTransactionId)
    linked.add(sicrediTransactionId)
    matches.push({ runId, agrotisTransactionId, sicrediTransactionId, kind: MATCH_KINDS.MANUAL })
  }

  const justifications = []
  for (const previous of previousJustifications) {
    const transactionId = idByKey.get(transactionKey(previous.transaction))
    if (!transactionId || linked.has(transactionId)) continue
    linked.add(transactionId)
    justifications.push({ transactionId, reason: previous.reason })
  }

  return { matches, justifications }
}
