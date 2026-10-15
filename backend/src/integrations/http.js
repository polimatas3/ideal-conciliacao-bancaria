const DEFAULT_RETRIES = 3
const BASE_DELAY_MS = 300
const FIRST_SERVER_ERROR_STATUS = 500

export class IntegrationError extends Error {
  constructor(message, { status, body } = {}) {
    super(message)
    this.name = 'IntegrationError'
    this.status = status
    this.body = body
  }
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchJson(
  url,
  {
    method = 'GET',
    headers = {},
    body,
    form,
    dispatcher,
    retries = DEFAULT_RETRIES,
    fetchImpl = fetch,
    sleep = defaultSleep,
  } = {},
) {
  const request = buildRequest({ method, headers, body, form, dispatcher })
  for (let attempt = 1; ; attempt += 1) {
    const outcome = await attemptRequest(fetchImpl, url, request)
    if (outcome.data !== undefined) return outcome.data
    if (!outcome.retryable || attempt >= retries) throw outcome.error
    await sleep(BASE_DELAY_MS * 2 ** (attempt - 1))
  }
}

function buildRequest({ method, headers, body, form, dispatcher }) {
  const baseHeaders = { Accept: 'application/json', ...headers }
  const transport = dispatcher ? { dispatcher } : {}
  if (form) {
    return {
      method,
      headers: { ...baseHeaders, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form).toString(),
      ...transport,
    }
  }
  if (body !== undefined) {
    return {
      method,
      headers: { ...baseHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      ...transport,
    }
  }
  return { method, headers: baseHeaders, ...transport }
}

async function attemptRequest(fetchImpl, url, request) {
  let response
  try {
    response = await fetchImpl(url, request)
  } catch (error) {
    return { retryable: true, error: new IntegrationError(`Falha de rede ao chamar ${url}: ${error.message}`) }
  }
  if (response.ok) return { data: response.status === 204 ? null : await response.json() }
  const responseBody = await response.text()
  return {
    retryable: response.status >= FIRST_SERVER_ERROR_STATUS,
    error: new IntegrationError(`HTTP ${response.status} ao chamar ${url}`, { status: response.status, body: responseBody }),
  }
}
