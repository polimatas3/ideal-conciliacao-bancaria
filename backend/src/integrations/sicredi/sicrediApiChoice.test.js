import { describe, expect, it } from 'vitest'
import { SICREDI_APIS, resolveSicrediApi } from './sicrediApiChoice.js'

describe('resolveSicrediApi', () => {
  it('defaults to the current account api', () => {
    expect(resolveSicrediApi({})).toEqual({
      api: SICREDI_APIS.CURRENT_ACCOUNT,
      baseUrl: 'https://mtls-api-parceiro.sicredi.com.br',
      tokenUrl: 'https://mtls-api-parceiro.sicredi.com.br/thirdparty/auth/token',
      scope: 'contacorrente.extratos.consultar contacorrente.saldo.consultar',
      credentialsIn: 'body',
    })
  })

  it('resolves the pix api with basic auth, as the pix guide specifies', () => {
    expect(resolveSicrediApi({ api: 'pix' })).toEqual({
      api: SICREDI_APIS.PIX,
      baseUrl: 'https://api-pix.sicredi.com.br',
      tokenUrl: 'https://api-pix.sicredi.com.br/oauth/token',
      scope: 'pix.read',
      credentialsIn: 'header',
    })
  })

  it('uses the pix homologation host when the credential asks for sandbox', () => {
    const resolved = resolveSicrediApi({ api: 'pix', sandbox: true })
    expect(resolved.baseUrl).toBe('https://api-pix-h.sicredi.com.br')
    expect(resolved.tokenUrl).toBe('https://api-pix-h.sicredi.com.br/oauth/token')
  })

  it('uses the current account sandbox prefix when asked', () => {
    const resolved = resolveSicrediApi({ sandbox: true })
    expect(resolved.baseUrl).toBe('https://mtls-api-parceiro.sicredi.com.br/sb')
    expect(resolved.tokenUrl).toBe('https://mtls-api-parceiro.sicredi.com.br/sb/thirdparty/auth/token')
  })

  it('lets the credential override the scope', () => {
    expect(resolveSicrediApi({ api: 'pix', scope: 'pix.read cob.read' }).scope).toBe('pix.read cob.read')
  })

  it('rejects an unknown api', () => {
    expect(() => resolveSicrediApi({ api: 'cobranca' })).toThrow(
      'API Sicredi não suportada: cobranca (use "contacorrente" ou "pix")',
    )
  })
})
