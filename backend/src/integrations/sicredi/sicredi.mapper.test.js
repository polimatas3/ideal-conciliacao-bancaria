import { describe, expect, it } from 'vitest'
import { mapSicrediTransaction } from './sicredi.mapper.js'

const debit = {
  data: '2026-02-02',
  descricao: 'CHEQUE ESPECIAL INAD-IOF',
  complemento: null,
  documento: null,
  valor: -1.27,
  saldo: -501.27,
  codigoLancamento: '262',
  idMovimento: '20260202-3500410-1-1',
}

describe('mapSicrediTransaction', () => {
  it('maps a debit from the real statement payload', () => {
    expect(mapSicrediTransaction(debit)).toEqual({
      externalId: '20260202-3500410-1-1',
      source: 'sicredi',
      date: '2026-02-02',
      amount: 127,
      type: 'debit',
      description: 'CHEQUE ESPECIAL INAD-IOF',
      documentNumber: undefined,
    })
  })

  it('maps a credit and keeps the document number', () => {
    expect(mapSicrediTransaction({ ...debit, valor: 12500, documento: '4501' })).toMatchObject({
      amount: 1250000,
      type: 'credit',
      documentNumber: '4501',
    })
  })

  it('appends the complement to the description when present', () => {
    expect(mapSicrediTransaction({ ...debit, complemento: 'PIX JOAO' }).description).toBe(
      'CHEQUE ESPECIAL INAD-IOF - PIX JOAO',
    )
  })

  it('defaults an empty description', () => {
    expect(mapSicrediTransaction({ ...debit, descricao: null }).description).toBe('')
  })
})
