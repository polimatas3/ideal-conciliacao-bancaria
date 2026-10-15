import { afterEach, describe, expect, it } from 'vitest'
import { readCredentials } from './credentials.js'

describe('readCredentials', () => {
  afterEach(() => {
    delete process.env.TEST_CREDENTIALS
  })

  it('parses the json stored in the referenced env var', () => {
    process.env.TEST_CREDENTIALS = '{"clientId":"a","clientSecret":"b"}'
    expect(readCredentials('TEST_CREDENTIALS')).toEqual({ clientId: 'a', clientSecret: 'b' })
  })

  it('fails when the env var is missing', () => {
    expect(() => readCredentials('TEST_CREDENTIALS')).toThrow(
      'Credenciais não encontradas: variável de ambiente TEST_CREDENTIALS não definida',
    )
  })

  it('fails when the env var is not json', () => {
    process.env.TEST_CREDENTIALS = 'nope'
    expect(() => readCredentials('TEST_CREDENTIALS')).toThrow('Credenciais inválidas em TEST_CREDENTIALS: esperado JSON')
  })
})
