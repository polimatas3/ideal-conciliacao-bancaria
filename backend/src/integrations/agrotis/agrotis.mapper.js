import { SOURCES, TRANSACTION_TYPES } from '../../config/enums.js'
import { toIsoDate } from '../../utils/dates.js'
import { toAbsoluteCents } from '../../utils/money.js'

const TYPE_BY_AGROTIS_CODE = Object.freeze({ C: TRANSACTION_TYPES.CREDIT, D: TRANSACTION_TYPES.DEBIT })

export function mapAgrotisTransaction(raw) {
  const type = TYPE_BY_AGROTIS_CODE[raw.tipo]
  if (!type) throw new Error(`Tipo de lançamento Agrotis desconhecido: ${raw.tipo}`)
  return {
    externalId: String(raw.id),
    source: SOURCES.AGROTIS,
    date: toIsoDate(raw.data),
    amount: toAbsoluteCents(raw.valor),
    type,
    description: raw.historico ?? '',
    documentNumber: raw.documento || undefined,
  }
}
