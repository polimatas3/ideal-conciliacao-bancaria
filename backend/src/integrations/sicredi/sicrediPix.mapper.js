import { SOURCES, TRANSACTION_TYPES } from '../../config/enums.js'
import { toIsoDate } from '../../utils/dates.js'
import { toAbsoluteCents } from '../../utils/money.js'

export function mapReceivedPix(raw) {
  const counterparty = raw.pagador?.nome ?? raw.chave ?? ''
  const received = {
    externalId: String(raw.endToEndId),
    source: SOURCES.SICREDI,
    date: toIsoDate(raw.horario),
    amount: toAbsoluteCents(raw.valor),
    type: TRANSACTION_TYPES.CREDIT,
    description: `PIX RECEBIDO - ${counterparty}`,
    documentNumber: raw.txid ? String(raw.txid) : undefined,
  }
  return [received, ...(raw.devolucoes ?? []).map((refund) => mapRefund(refund, raw, counterparty))]
}

function mapRefund(refund, raw, counterparty) {
  return {
    externalId: String(refund.rtrId ?? refund.id),
    source: SOURCES.SICREDI,
    date: toIsoDate(refund.horario?.solicitacao ?? refund.horario?.liquidacao ?? raw.horario),
    amount: toAbsoluteCents(refund.valor),
    type: TRANSACTION_TYPES.DEBIT,
    description: `DEVOLUCAO PIX - ${counterparty}`,
    documentNumber: raw.txid ? String(raw.txid) : undefined,
  }
}
