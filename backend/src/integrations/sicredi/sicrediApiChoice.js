import { env } from '../../config/env.js'

export const SICREDI_APIS = Object.freeze({ CURRENT_ACCOUNT: 'contacorrente', PIX: 'pix' })

const CURRENT_ACCOUNT_SANDBOX_PREFIX = '/sb'

export function resolveSicrediApi({ api = SICREDI_APIS.CURRENT_ACCOUNT, sandbox = false, scope } = {}) {
  if (api === SICREDI_APIS.CURRENT_ACCOUNT) {
    const baseUrl = `${env.sicrediBaseUrl}${sandbox ? CURRENT_ACCOUNT_SANDBOX_PREFIX : ''}`
    return {
      api,
      baseUrl,
      tokenUrl: `${baseUrl}/thirdparty/auth/token`,
      scope: scope ?? env.sicrediScope,
      credentialsIn: 'body',
    }
  }
  if (api === SICREDI_APIS.PIX) {
    const baseUrl = sandbox ? env.sicrediPixSandboxBaseUrl : env.sicrediPixBaseUrl
    return {
      api,
      baseUrl,
      tokenUrl: `${baseUrl}/oauth/token`,
      scope: scope ?? env.sicrediPixScope,
      credentialsIn: 'header',
    }
  }
  throw new Error(`API Sicredi não suportada: ${api} (use "contacorrente" ou "pix")`)
}
