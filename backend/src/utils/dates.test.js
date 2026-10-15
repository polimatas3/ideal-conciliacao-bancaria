import { describe, expect, it } from 'vitest'
import { saoPauloDayRangeToUtc, toIsoDate, yesterdayIsoDate } from './dates.js'

describe('toIsoDate', () => {
  it('keeps plain ISO dates untouched', () => {
    expect(toIsoDate('2026-09-10')).toBe('2026-09-10')
  })

  it('converts a UTC datetime to the São Paulo calendar day', () => {
    expect(toIsoDate('2026-09-10T03:00:00Z')).toBe('2026-09-10')
    expect(toIsoDate('2026-09-10T02:59:00Z')).toBe('2026-09-09')
  })

  it('accepts Date instances', () => {
    expect(toIsoDate(new Date('2026-09-10T12:00:00Z'))).toBe('2026-09-10')
  })

  it('rejects invalid input', () => {
    expect(() => toIsoDate('ontem')).toThrow('Data inválida: ontem')
  })
})

describe('yesterdayIsoDate', () => {
  it('returns the São Paulo day before the given instant', () => {
    expect(yesterdayIsoDate(new Date('2026-09-10T03:00:00Z'))).toBe('2026-09-09')
    expect(yesterdayIsoDate(new Date('2026-09-10T02:00:00Z'))).toBe('2026-09-08')
  })
})

describe('saoPauloDayRangeToUtc', () => {
  it('converts a day range in São Paulo into the matching utc instants', () => {
    expect(saoPauloDayRangeToUtc('2026-09-10', '2026-09-10')).toEqual({
      start: '2026-09-10T03:00:00.000Z',
      end: '2026-09-11T02:59:59.999Z',
    })
  })

  it('spans multiple days', () => {
    expect(saoPauloDayRangeToUtc('2026-09-01', '2026-09-30').end).toBe('2026-10-01T02:59:59.999Z')
  })

  it('rejects an inverted range', () => {
    expect(() => saoPauloDayRangeToUtc('2026-09-10', '2026-09-01')).toThrow(
      'Período inválido: 2026-09-10 é posterior a 2026-09-01',
    )
  })
})
