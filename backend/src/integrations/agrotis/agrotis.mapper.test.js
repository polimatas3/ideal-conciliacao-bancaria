import { describe, expect, it } from 'vitest'
import { mapAgrotisTransaction } from './agrotis.mapper.js'

const fixture = {
  id: 555,
  data: '2026-09-10',
  valor: 150,
  tipo: 'D',
  historico: 'Pagamento fornecedor X',
  documento: 'NF 1234',
}

describe('mapAgrotisTransaction', () => {
  it('maps a debit', () => {
    expect(mapAgrotisTransaction(fixture)).toEqual({
      externalId: '555',
      source: 'agrotis',
      date: '2026-09-10',
      amount: 15000,
      type: 'debit',
      description: 'Pagamento fornecedor X',
      documentNumber: 'NF 1234',
    })
  })

  it('maps a credit and omits missing document', () => {
    expect(mapAgrotisTransaction({ ...fixture, tipo: 'C', documento: null })).toMatchObject({
      type: 'credit',
      documentNumber: undefined,
    })
  })

  it('fails early on unknown type code', () => {
    expect(() => mapAgrotisTransaction({ ...fixture, tipo: 'X' })).toThrow('Tipo de lançamento Agrotis desconhecido: X')
  })
})
