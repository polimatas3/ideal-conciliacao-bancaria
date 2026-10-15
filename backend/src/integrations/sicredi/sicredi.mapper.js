import { SOURCES, TRANSACTION_TYPES } from '../../config/enums.js'
import { toIsoDate } from '../../utils/dates.js'
import { toAbsoluteCents } from '../../utils/money.js'

export function mapSicrediTransaction(raw) {
  return {
    externalId: String(raw.idMovimento),
    source: SOURCES.SICREDI,
    date: toIsoDate(raw.data),
    amount: toAbsoluteCents(raw.valor),
    type: Number(raw.valor) < 0 ? TRANSACTION_TYPES.DEBIT : TRANSACTION_TYPES.CREDIT,
    description: buildDescription(raw),
    documentNumber: raw.documento ? String(raw.documento) : undefined,
  }
}

function buildDescription({ descricao, complemento }) {
  return [descricao, complemento].filter(Boolean).join(' - ')
}
