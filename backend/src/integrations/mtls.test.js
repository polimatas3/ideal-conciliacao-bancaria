import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearDispatcherCache, createMutualTlsDispatcher } from './mtls.js'

const certificate = { certPath: '/tmp/cert.crt', keyPath: '/tmp/cert.key' }

function setup() {
  const readFileImpl = vi.fn((path) => `content-of-${path}`)
  const AgentImpl = vi.fn(function Agent(options) {
    this.options = options
  })
  return { readFileImpl, AgentImpl }
}

describe('createMutualTlsDispatcher', () => {
  afterEach(clearDispatcherCache)

  it('builds an agent with the certificate and key contents', () => {
    const { readFileImpl, AgentImpl } = setup()

    const dispatcher = createMutualTlsDispatcher(certificate, { readFileImpl, AgentImpl })

    expect(dispatcher.options.connect).toEqual({ cert: 'content-of-/tmp/cert.crt', key: 'content-of-/tmp/cert.key' })
    expect(readFileImpl).toHaveBeenCalledWith('/tmp/cert.crt', 'utf8')
  })

  it('includes the passphrase when the key is encrypted', () => {
    const { readFileImpl, AgentImpl } = setup()

    const dispatcher = createMutualTlsDispatcher({ ...certificate, keyPassphrase: 's3cr3t' }, { readFileImpl, AgentImpl })

    expect(dispatcher.options.connect.passphrase).toBe('s3cr3t')
  })

  it('includes the certificate authority when one is configured', () => {
    const { readFileImpl, AgentImpl } = setup()

    const dispatcher = createMutualTlsDispatcher({ ...certificate, caPath: '/tmp/ca.crt' }, { readFileImpl, AgentImpl })

    expect(dispatcher.options.connect.ca).toBe('content-of-/tmp/ca.crt')
  })

  it('reuses the agent for the same certificate', () => {
    const { readFileImpl, AgentImpl } = setup()

    const first = createMutualTlsDispatcher(certificate, { readFileImpl, AgentImpl })
    const second = createMutualTlsDispatcher(certificate, { readFileImpl, AgentImpl })

    expect(second).toBe(first)
    expect(AgentImpl).toHaveBeenCalledTimes(1)
  })

  it('returns undefined when no certificate is configured', () => {
    const { readFileImpl, AgentImpl } = setup()

    expect(createMutualTlsDispatcher({}, { readFileImpl, AgentImpl })).toBeUndefined()
    expect(AgentImpl).not.toHaveBeenCalled()
  })

  it('fails with a clear message when the certificate file is missing', () => {
    const { AgentImpl } = setup()
    const readFileImpl = vi.fn(() => {
      throw new Error('ENOENT: no such file or directory')
    })

    expect(() => createMutualTlsDispatcher(certificate, { readFileImpl, AgentImpl })).toThrow(
      'Certificado mTLS não pôde ser lido em /tmp/cert.crt: ENOENT: no such file or directory',
    )
  })
})
