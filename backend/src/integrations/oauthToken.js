import { fetchJson } from './http.js'

const EXPIRY_SAFETY_MARGIN_SECONDS = 30
const CREDENTIALS_IN_HEADER = 'header'

export function createTokenProvider({
  tokenUrl,
  clientId,
  clientSecret,
  scope,
  credentialsIn = 'body',
  dispatcher,
  fetchJsonImpl = fetchJson,
  now = Date.now,
}) {
  let cached = null

  return async function getToken() {
    if (cached && cached.expiresAt > now()) return cached.token
    const response = await fetchJsonImpl(tokenUrl, {
      method: 'POST',
      ...buildCredentials({ clientId, clientSecret, scope, credentialsIn }),
      dispatcher,
    })
    cached = {
      token: response.access_token,
      expiresAt: now() + (response.expires_in - EXPIRY_SAFETY_MARGIN_SECONDS) * 1000,
    }
    return cached.token
  }
}

function buildCredentials({ clientId, clientSecret, scope, credentialsIn }) {
  const grant = { grant_type: 'client_credentials', ...(scope ? { scope } : {}) }
  if (credentialsIn === CREDENTIALS_IN_HEADER) {
    return {
      headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}` },
      form: grant,
    }
  }
  return { form: { ...grant, client_id: clientId, client_secret: clientSecret } }
}
