import { describe, expect, it, vi } from 'vitest'
import { IntegrationError, fetchJson } from './http.js'

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }
}

const noSleep = async () => {}

describe('fetchJson', () => {
  it('returns parsed json on success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }))
    const result = await fetchJson('https://api.test/x', { fetchImpl, sleep: noSleep })
    expect(result).toEqual({ ok: true })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('sends json body and bearer header', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    await fetchJson('https://api.test/x', {
      method: 'POST',
      body: { a: 1 },
      headers: { Authorization: 'Bearer t' },
      fetchImpl,
      sleep: noSleep,
    })
    const [, options] = fetchImpl.mock.calls[0]
    expect(options.method).toBe('POST')
    expect(options.body).toBe('{"a":1}')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(options.headers.Authorization).toBe('Bearer t')
  })

  it('sends form-urlencoded body when form is given', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    await fetchJson('https://api.test/token', {
      method: 'POST',
      form: { grant_type: 'client_credentials', client_id: 'abc' },
      fetchImpl,
      sleep: noSleep,
    })
    const [, options] = fetchImpl.mock.calls[0]
    expect(options.body).toBe('grant_type=client_credentials&client_id=abc')
    expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
  })

  it('retries on 5xx and succeeds', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(503, { error: 'down' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
    const result = await fetchJson('https://api.test/x', { fetchImpl, sleep: noSleep })
    expect(result).toEqual({ ok: true })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('retries on network error and succeeds', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
    const result = await fetchJson('https://api.test/x', { fetchImpl, sleep: noSleep })
    expect(result).toEqual({ ok: true })
  })

  it('does not retry on 4xx', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(401, { error: 'unauthorized' }))
    await expect(fetchJson('https://api.test/x', { fetchImpl, sleep: noSleep })).rejects.toMatchObject({
      name: 'IntegrationError',
      status: 401,
    })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('forwards the mutual tls dispatcher to fetch', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    const dispatcher = { mtls: true }
    await fetchJson('https://api.test/x', { dispatcher, fetchImpl, sleep: noSleep })
    expect(fetchImpl.mock.calls[0][1].dispatcher).toBe(dispatcher)
  })

  it('omits the dispatcher key when none is given', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    await fetchJson('https://api.test/x', { fetchImpl, sleep: noSleep })
    expect('dispatcher' in fetchImpl.mock.calls[0][1]).toBe(false)
  })

  it('gives up after the configured retries', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(500, {}))
    await expect(fetchJson('https://api.test/x', { fetchImpl, sleep: noSleep, retries: 3 })).rejects.toBeInstanceOf(
      IntegrationError,
    )
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })
})
