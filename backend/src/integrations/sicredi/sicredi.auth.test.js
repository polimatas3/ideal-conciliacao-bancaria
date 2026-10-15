import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearDispatcherCache } from '../mtls.js'
import { buildSicrediAuth } from './sicredi.auth.js'

const credentials = {
  clientId: 'id',
  clientSecret: 'secret',
  certPath: '/tmp/sicredi.crt',
  keyPath: '/tmp/sicredi.key',
}

function setup() {
  return {
    readFileImpl: vi.fn((path) => `content-of-${path}`),
    AgentImpl: vi.fn(function Agent(options) {
      this.options = options
    }),
    fetchJsonImpl: vi.fn().mockResolvedValue({ access_token: 'tok', expires_in: 600 }),
  }
}

describe('buildSicrediAuth', () => {
  afterEach(clearDispatcherCache)

  it('builds a token provider and dispatcher from the credentials', async () => {
    const { readFileImpl, AgentImpl, fetchJsonImpl } = setup()

    const auth = buildSicrediAuth(credentials, {
      tokenUrl: 'https://auth.sicredi.test/oauth/token',
      scope: 'extrato.read',
      readFileImpl,
      AgentImpl,
      fetchJsonImpl,
    })

    expect(await auth.getToken()).toBe('tok')
    expect(auth.dispatcher.options.connect.cert).toBe('content-of-/tmp/sicredi.crt')
    const [url, options] = fetchJsonImpl.mock.calls[0]
    expect(url).toBe('https://auth.sicredi.test/oauth/token')
    expect(options.form).toEqual({
      grant_type: 'client_credentials',
      client_id: 'id',
      client_secret: 'secret',
      scope: 'extrato.read',
    })
    expect(options.dispatcher).toBe(auth.dispatcher)
  })

  it('fails when the credentials lack a client id', () => {
    const { readFileImpl, AgentImpl, fetchJsonImpl } = setup()

    expect(() =>
      buildSicrediAuth({ clientSecret: 'secret' }, { tokenUrl: 'x', readFileImpl, AgentImpl, fetchJsonImpl }),
    ).toThrow('Credenciais incompletas: clientId e clientSecret são obrigatórios')
  })

  it('works without a certificate configured', async () => {
    const { readFileImpl, AgentImpl, fetchJsonImpl } = setup()

    const auth = buildSicrediAuth(
      { clientId: 'id', clientSecret: 'secret' },
      { tokenUrl: 'https://auth.sicredi.test/oauth/token', readFileImpl, AgentImpl, fetchJsonImpl },
    )

    expect(auth.dispatcher).toBeUndefined()
    expect(await auth.getToken()).toBe('tok')
  })
})
