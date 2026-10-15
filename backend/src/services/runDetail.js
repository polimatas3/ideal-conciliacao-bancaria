import { SOURCES } from '../config/enums.js'

export function buildRunDetail({ run, transactions, matches, justifications }) {
  const transactionById = new Map(transactions.map((transaction) => [transaction.id, transaction]))
  const justificationByTransactionId = new Map(
    justifications.map((justification) => [justification.transactionId, { id: justification.id, reason: justification.reason }]),
  )
  const linkedIds = new Set(matches.flatMap((match) => [match.agrotisTransactionId, match.sicrediTransactionId]))

  const matched = matches.map((match) => ({
    id: match.id,
    kind: match.kind,
    agrotis: transactionById.get(match.agrotisTransactionId),
    sicredi: transactionById.get(match.sicrediTransactionId),
  }))

  const pendingOf = (source) =>
    transactions
      .filter((transaction) => transaction.source === source && !linkedIds.has(transaction.id))
      .map((transaction) => ({ ...transaction, justification: justificationByTransactionId.get(transaction.id) ?? null }))

  const onlyAgrotis = pendingOf(SOURCES.AGROTIS)
  const onlySicredi = pendingOf(SOURCES.SICREDI)

  return {
    run,
    summary: {
      matched: matched.length,
      onlyAgrotis: onlyAgrotis.length,
      onlySicredi: onlySicredi.length,
      justified: justifications.length,
    },
    matched,
    onlyAgrotis,
    onlySicredi,
  }
}
