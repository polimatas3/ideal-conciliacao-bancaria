import { describe, expect, it } from 'vitest'
import { toAbsoluteCents, toSignedCents } from './money.js'

describe('toAbsoluteCents', () => {
  it('converts decimal reais to integer cents', () => {
    expect(toAbsoluteCents(150.1)).toBe(15010)
  })

  it('accepts numeric strings', () => {
    expect(toAbsoluteCents('1234.56')).toBe(123456)
  })

  it('drops the sign', () => {
    expect(toAbsoluteCents(-99.99)).toBe(9999)
  })

  it('rounds floating point noise', () => {
    expect(toAbsoluteCents(0.1 + 0.2)).toBe(30)
  })

  it('rejects non numeric values', () => {
    expect(() => toAbsoluteCents('abc')).toThrow('Valor monetário inválido: abc')
  })
})

describe('toSignedCents', () => {
  it('keeps the sign', () => {
    expect(toSignedCents(-10.5)).toBe(-1050)
    expect(toSignedCents('99.99')).toBe(9999)
  })
})
