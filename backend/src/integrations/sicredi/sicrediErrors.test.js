import { describe, expect, it } from 'vitest'
import { IntegrationError } from '../http.js'
import { explainSicrediError } from './sicrediErrors.js'

function errorWith(status, body) {
  return new IntegrationError(`HTTP ${status} ao chamar x`, { status, body })
}

describe('explainSicrediError', () => {
  it('explains a 403 as a mutual tls failure', () => {
    expect(explainSicrediError(errorWith(403, '<H1>Access Denied</H1>'))).toContain('autenticação mTLS falhou')
  })

  it('explains the thumbprint rejection as certificate and credential mismatch', () => {
    const message = explainSicrediError(errorWith(400, JSON.stringify({ detail: 'Crítica de thumbprint incorreto' })))
    expect(message).toContain('as credenciais foram geradas para outro certificado')
  })

  it('explains full authentication as wrong client id or secret', () => {
    const message = explainSicrediError(
      errorWith(403, JSON.stringify({ detail: 'Full authentication is required to access this resource' })),
    )
    expect(message).toContain('clientId/clientSecret')
  })

  it('explains invalid_client', () => {
    expect(explainSicrediError(errorWith(401, JSON.stringify({ error: 'invalid_client' })))).toContain(
      'clientId/clientSecret',
    )
  })

  it('explains an empty or denied scope', () => {
    const empty = explainSicrediError(errorWith(400, JSON.stringify({ detail: 'Escopo vazio (o usuário não tem permissão para solicitar escopos)' })))
    expect(empty).toContain('escopo')
    const denied = explainSicrediError(errorWith(400, JSON.stringify({ detail: 'Escopo negado (o usuário não tem acesso ao escopo solicitado): cobv.read' })))
    expect(denied).toContain('escopo')
  })

  it('explains the pix api rejection of authorization or certificate', () => {
    const message = explainSicrediError(
      errorWith(401, JSON.stringify({ title: 'Acesso Negado', detail: 'Authorization ou certificado inválido.' })),
    )
    expect(message).toContain('clientId/clientSecret')
  })

  it('explains a 428 as a missing token or certificate', () => {
    const message = explainSicrediError(
      errorWith(428, JSON.stringify({ detail: 'Token ou certificado não informado.' })),
    )
    expect(message).toContain('não recebeu o certificado')
  })

  it('returns the original message when it recognises nothing', () => {
    expect(explainSicrediError(errorWith(500, 'boom'))).toBe('HTTP 500 ao chamar x')
  })

  it('handles an error without a body', () => {
    expect(explainSicrediError(new Error('Falha de rede'))).toBe('Falha de rede')
  })
})
