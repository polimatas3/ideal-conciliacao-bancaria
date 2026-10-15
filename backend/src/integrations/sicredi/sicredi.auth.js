import { readFileSync } from 'node:fs'
import { Agent } from 'undici'
import { fetchJson } from '../http.js'
import { createMutualTlsDispatcher } from '../mtls.js'
import { createTokenProvider } from '../oauthToken.js'

export function buildSicrediAuth(
  credentials,
  { tokenUrl, scope, credentialsIn, readFileImpl = readFileSync, AgentImpl = Agent, fetchJsonImpl = fetchJson } = {},
) {
  const { clientId, clientSecret, certPath, keyPath, keyPassphrase, caPath } = credentials
  if (!clientId || !clientSecret) throw new Error('Credenciais incompletas: clientId e clientSecret são obrigatórios')

  const dispatcher = createMutualTlsDispatcher({ certPath, keyPath, keyPassphrase, caPath }, { readFileImpl, AgentImpl })
  const getToken = createTokenProvider({ tokenUrl, clientId, clientSecret, scope, credentialsIn, dispatcher, fetchJsonImpl })

  return { getToken, dispatcher }
}
