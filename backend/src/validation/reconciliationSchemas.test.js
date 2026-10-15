import { describe, expect, it } from 'vitest'
import { createRunSchema, runParamsSchema } from './reconciliationSchemas.js'

describe('createRunSchema', () => {
  it('accepts a valid period', () => {
    expect(createRunSchema.parse({ accountId: '3', from: '2026-09-01', to: '2026-09-10' })).toEqual({
      accountId: 3,
      from: '2026-09-01',
      to: '2026-09-10',
    })
  })

  it('rejects an inverted period', () => {
    const result = createRunSchema.safeParse({ accountId: 3, from: '2026-09-10', to: '2026-09-01' })
    expect(result.success).toBe(false)
  })

  it('rejects malformed dates', () => {
    expect(createRunSchema.safeParse({ accountId: 3, from: '10/09/2026', to: '2026-09-10' }).success).toBe(false)
  })
})

describe('runParamsSchema', () => {
  it('coerces the id to a positive integer', () => {
    expect(runParamsSchema.parse({ id: '7' })).toEqual({ id: 7 })
    expect(runParamsSchema.safeParse({ id: 'abc' }).success).toBe(false)
  })
})
