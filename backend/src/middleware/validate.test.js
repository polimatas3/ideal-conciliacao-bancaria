import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { validate } from './validate.js'

describe('validate', () => {
  it('stores parsed data in request.validated and calls next', () => {
    const middleware = validate({ body: z.object({ n: z.coerce.number() }), params: z.object({ id: z.coerce.number() }) })
    const request = { body: { n: '1' }, params: { id: '2' } }
    const next = vi.fn()

    middleware(request, {}, next)

    expect(request.validated).toEqual({ body: { n: 1 }, params: { id: 2 } })
    expect(next).toHaveBeenCalledWith()
  })

  it('forwards a 400 HttpError on invalid input', () => {
    const middleware = validate({ body: z.object({ n: z.number() }) })
    const next = vi.fn()

    middleware({ body: { n: 'x' } }, {}, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(next.mock.calls[0][0]).toMatchObject({ status: 400, message: 'Dados inválidos' })
    expect(next.mock.calls[0][0].details.fieldErrors.n).toBeDefined()
  })
})
