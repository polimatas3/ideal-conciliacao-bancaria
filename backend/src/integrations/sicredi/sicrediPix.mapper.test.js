import { describe, expect, it } from 'vitest'
import { mapReceivedPix } from './sicrediPix.mapper.js'

const received = {
  endToEndId: 'E12345678202602121234567890123',
  txid: 'a1b2c3d4e5f67890123456789abcdef0',
  valor: '7.50',
  chave: 'joao.silva@test.com',
  horario: '2026-02-12T20:39:14.197Z',
  devolucoes: [],
  pagador: { nome: 'JOAO PEDRO SILVA', documento: '12345678901', tipoDocumento: 'CPF' },
}

describe('mapReceivedPix', () => {
  it('maps a received pix as a credit on the São Paulo calendar day', () => {
    expect(mapReceivedPix(received)).toEqual([
      {
        externalId: 'E12345678202602121234567890123',
        source: 'sicredi',
        date: '2026-02-12',
        amount: 750,
        type: 'credit',
        description: 'PIX RECEBIDO - JOAO PEDRO SILVA',
        documentNumber: 'a1b2c3d4e5f67890123456789abcdef0',
      },
    ])
  })

  it('uses the São Paulo day when the utc timestamp falls on the next day', () => {
    expect(mapReceivedPix({ ...received, horario: '2026-02-13T02:30:00.000Z' })[0].date).toBe('2026-02-12')
  })

  it('falls back to the pix key when the payer is unknown', () => {
    expect(mapReceivedPix({ ...received, pagador: undefined })[0].description).toBe(
      'PIX RECEBIDO - joao.silva@test.com',
    )
  })

  it('emits a debit for each refund so the net value matches the statement', () => {
    const withRefund = {
      ...received,
      valor: '100.00',
      devolucoes: [{ id: 'dev-1', rtrId: 'D99887766', valor: '30.00', horario: { solicitacao: '2026-02-13T12:00:00.000Z' } }],
    }

    const transactions = mapReceivedPix(withRefund)

    expect(transactions).toHaveLength(2)
    expect(transactions[1]).toEqual({
      externalId: 'D99887766',
      source: 'sicredi',
      date: '2026-02-13',
      amount: 3000,
      type: 'debit',
      description: 'DEVOLUCAO PIX - JOAO PEDRO SILVA',
      documentNumber: 'a1b2c3d4e5f67890123456789abcdef0',
    })
  })

  it('identifies a refund by its id when there is no rtrId', () => {
    const withRefund = {
      ...received,
      devolucoes: [{ id: 'dev-7', valor: '1.00', horario: { solicitacao: '2026-02-13T12:00:00.000Z' } }],
    }
    expect(mapReceivedPix(withRefund)[1].externalId).toBe('dev-7')
  })
})
