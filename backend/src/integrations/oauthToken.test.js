import { describe, expect, it, vi } from 'vitest'
import { createTokenProvider } from './oauthToken.js'

describe('createTokenProvider', () => {
  it('requests a token with client credentials in the body and caches it', async () => {
    const fetchJsonImpl = vi.fn().mockResolvedValue({ access_token: 'tok-1', expires_in: 3600 })
    let currentTime = 1_000_000
    const getToken = createTokenProvider({
      tokenUrl: 'https://auth.test/oauth/token',
      clientId: 'id',
      clientSecret: 'secret',
      scope: 'extrato.read saldo.read',
      fetchJsonImpl,
      now: () => currentTime,
    })

    expect(await getToken()).toBe('tok-1')
    expect(await getToken()).toBe('tok-1')
    expect(fetchJsonImpl).toHaveBeenCalledTimes(1)
    expect(fetchJsonImpl).toHaveBeenCalledWith('https://auth.test/oauth/token', {
      method: 'POST',
      form: {
        grant_type: 'client_credentials',
        client_id: 'id',
        client_secret: 'secret',
        scope: 'extrato.read saldo.read',
      },
      dispatcher: undefined,
    })

    currentTime += 3600 * 1000
    fetchJsonImpl.mockResolvedValue({ access_token: 'tok-2', expires_in: 3600 })
    expect(await getToken()).toBe('tok-2')
    expect(fetchJsonImpl).toHaveBeenCalledTimes(2)
  })

  it('omits the scope when none is configured', async () => {
    const fetchJsonImpl = vi.fn().mockResolvedValue({ access_token: 'tok', expires_in: 60 })
    const getToken = createTokenProvider({
      tokenUrl: 'https://auth.test/oauth/token',
      clientId: 'id',
      clientSecret: 'secret',
      fetchJsonImpl,
    })

    await getToken()

    expect(fetchJsonImpl.mock.calls[0][1].form).toEqual({
      grant_type: 'client_credentials',
      client_id: 'id',
      client_secret: 'secret',
    })
  })

  it('sends the credentials as basic auth when credentialsIn is header', async () => {
    const fetchJsonImpl = vi.fn().mockResolvedValue({ access_token: 'tok', expires_in: 300 })
    const getToken = createTokenProvider({
      tokenUrl: 'https://api-pix.test/oauth/token',
      clientId: 'id',
      clientSecret: 'secret',
      scope: 'cob.read pix.read',
      credentialsIn: 'header',
      fetchJsonImpl,
    })

    await getToken()

    const [, options] = fetchJsonImpl.mock.calls[0]
    expect(options.headers).toEqual({ Authorization: `Basic ${Buffer.from('id:secret').toString('base64')}` })
    expect(options.form).toEqual({ grant_type: 'client_credentials', scope: 'cob.read pix.read' })
  })

  it('honours a short lived token by refreshing it after it expires', async () => {
    const fetchJsonImpl = vi
      .fn()
      .mockResolvedValueOnce({ access_token: 'tok-1', expires_in: 300 })
      .mockResolvedValueOnce({ access_token: 'tok-2', expires_in: 300 })
    let currentTime = 0
    const getToken = createTokenProvider({
      tokenUrl: 'https://api-pix.test/oauth/token',
      clientId: 'id',
      clientSecret: 'secret',
      fetchJsonImpl,
      now: () => currentTime,
    })

    expect(await getToken()).toBe('tok-1')
    currentTime += 269 * 1000
    expect(await getToken()).toBe('tok-1')
    currentTime += 2 * 1000
    expect(await getToken()).toBe('tok-2')
  })

  it('sends the mutual tls dispatcher when one is given', async () => {
    const fetchJsonImpl = vi.fn().mockResolvedValue({ access_token: 'tok', expires_in: 60 })
    const dispatcher = { mtls: true }
    const getToken = createTokenProvider({
      tokenUrl: 'https://auth.test/oauth/token',
      clientId: 'id',
      clientSecret: 'secret',
      dispatcher,
      fetchJsonImpl,
    })

    await getToken()

    expect(fetchJsonImpl.mock.calls[0][1].dispatcher).toBe(dispatcher)
  })
})
