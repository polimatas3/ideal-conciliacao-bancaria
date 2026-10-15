import { execFileSync } from 'node:child_process'
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:https'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { clearDispatcherCache, createMutualTlsDispatcher } from '../mtls.js'
import { buildSicrediStatement } from './index.js'
import { createSicrediClient } from './sicredi.client.js'
import { buildSicrediAuth } from './sicredi.auth.js'

let directory
let server
let baseUrl
let clientPaths
let caPath
const requests = []

function openssl(args) {
  execFileSync('openssl', args, { stdio: 'pipe' })
}

function issueCertificate({ name, commonName, caCrt, caKey, extensions }) {
  const keyPath = join(directory, `${name}.key`)
  const csrPath = join(directory, `${name}.csr`)
  const certPath = join(directory, `${name}.crt`)
  openssl(['req', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyPath, '-out', csrPath, '-subj', `/CN=${commonName}`])
  const args = ['x509', '-req', '-in', csrPath, '-CA', caCrt, '-CAkey', caKey, '-CAcreateserial', '-out', certPath, '-days', '2']
  if (extensions) {
    const extPath = join(directory, `${name}.ext`)
    writeFileSync(extPath, extensions)
    args.push('-extfile', extPath)
  }
  openssl(args)
  return { certPath, keyPath }
}

const movementsByPage = [
  [
    { idMovimento: '20260910-1', data: '2026-09-10', descricao: 'PIX REC COOPERATIVA', complemento: 'LOTE 12', documento: '4501', valor: 12500, saldo: 12600 },
    { idMovimento: '20260910-2', data: '2026-09-10', descricao: 'TARIFA PACOTE', complemento: null, documento: null, valor: -15.9, saldo: 12584.1 },
  ],
  [{ idMovimento: '20260911-1', data: '2026-09-11', descricao: 'DEB AUTOMATICO', complemento: null, documento: null, valor: -450, saldo: 12134.1 }],
]

function handleRequest(request, response) {
  const url = new URL(request.url, baseUrl)
  requests.push({ path: url.pathname, authorization: request.headers.authorization })

  if (url.pathname === '/thirdparty/auth/token') {
    let body = ''
    request.on('data', (chunk) => (body += chunk))
    request.on('end', () => {
      const form = new URLSearchParams(body)
      requests.at(-1).form = Object.fromEntries(form)
      if (form.get('client_id') !== 'cliente-valido' || form.get('client_secret') !== 'segredo-valido') {
        response.writeHead(401, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ error: 'invalid_client' }))
        return
      }
      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ access_token: 'token-de-teste', token_type: 'Bearer', expires_in: 3600 }))
    })
    return
  }

  if (request.headers.authorization !== 'Bearer token-de-teste') {
    response.writeHead(401).end()
    return
  }

  if (url.pathname === '/contacorrente/v1/extratos') {
    const page = Number(url.searchParams.get('page'))
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(
      JSON.stringify({
        saldoAnterior: 100,
        dtlMovimentos: movementsByPage[page] ?? [],
        pageNumber: page,
        pageSize: Number(url.searchParams.get('size')),
        totalPages: movementsByPage.length,
        totalElements: 3,
      }),
    )
    return
  }

  if (url.pathname === '/contacorrente/v1/saldos') {
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ saldoAtual: 12134.1, saldoContaCorrente: 12134.1 }))
    return
  }

  response.writeHead(404).end()
}

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'sicredi-mtls-'))
  caPath = join(directory, 'ca.crt')
  const caKeyPath = join(directory, 'ca.key')
  openssl(['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', caKeyPath, '-out', caPath, '-days', '2', '-subj', '/CN=AC de Teste'])

  const serverPaths = issueCertificate({
    name: 'server',
    commonName: 'localhost',
    caCrt: caPath,
    caKey: caKeyPath,
    extensions: 'subjectAltName=DNS:localhost,IP:127.0.0.1',
  })
  clientPaths = issueCertificate({ name: 'client', commonName: 'cliente-sicredi', caCrt: caPath, caKey: caKeyPath })

  server = createServer(
    {
      key: readFileSync(serverPaths.keyPath),
      cert: readFileSync(serverPaths.certPath),
      ca: readFileSync(caPath),
      requestCert: true,
      rejectUnauthorized: true,
    },
    handleRequest,
  )
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `https://localhost:${server.address().port}`
})

afterAll(async () => {
  clearDispatcherCache()
  await new Promise((resolve) => server.close(resolve))
  rmSync(directory, { recursive: true, force: true })
})

function authFor(credentials) {
  return buildSicrediAuth(
    { ...credentials, certPath: clientPaths.certPath, keyPath: clientPaths.keyPath, caPath },
    { tokenUrl: `${baseUrl}/thirdparty/auth/token`, scope: 'contacorrente.extratos.consultar' },
  )
}

describe('integração Sicredi sobre mTLS real', () => {
  it('autentica, pagina o extrato e deriva o saldo de fechamento', async () => {
    requests.length = 0
    const { getToken, dispatcher } = authFor({ clientId: 'cliente-valido', clientSecret: 'segredo-valido' })
    const client = createSicrediClient({ baseUrl, getToken, dispatcher, pageSize: 2 })

    const raw = await client.fetchStatement({ account: {}, from: '2026-09-10', to: '2026-09-11' })
    const { transactions, closingBalance } = buildSicrediStatement(raw)

    expect(transactions.map((t) => [t.externalId, t.amount, t.type, t.description])).toEqual([
      ['20260910-1', 1250000, 'credit', 'PIX REC COOPERATIVA - LOTE 12'],
      ['20260910-2', 1590, 'debit', 'TARIFA PACOTE'],
      ['20260911-1', 45000, 'debit', 'DEB AUTOMATICO'],
    ])
    expect(transactions[0].documentNumber).toBe('4501')
    expect(closingBalance).toBe(1213410)

    expect(requests.map((r) => r.path)).toEqual([
      '/thirdparty/auth/token',
      '/contacorrente/v1/extratos',
      '/contacorrente/v1/extratos',
    ])
    expect(requests[0].form).toEqual({
      grant_type: 'client_credentials',
      client_id: 'cliente-valido',
      client_secret: 'segredo-valido',
      scope: 'contacorrente.extratos.consultar',
    })
    expect(requests[1].authorization).toBe('Bearer token-de-teste')
  })

  it('reaproveita o token entre chamadas e lê o saldo atual', async () => {
    requests.length = 0
    const { getToken, dispatcher } = authFor({ clientId: 'cliente-valido', clientSecret: 'segredo-valido' })
    const client = createSicrediClient({ baseUrl, getToken, dispatcher, pageSize: 100 })

    await client.fetchStatement({ account: {}, from: '2026-09-10', to: '2026-09-11' })
    const balance = await client.fetchCurrentBalanceCents({ account: {} })

    expect(balance).toBe(1213410)
    expect(requests.filter((r) => r.path === '/thirdparty/auth/token')).toHaveLength(1)
  })

  it('propaga o erro de credencial inválida do servidor', async () => {
    const { getToken } = authFor({ clientId: 'errado', clientSecret: 'errado' })

    await expect(getToken()).rejects.toMatchObject({ name: 'IntegrationError', status: 401 })
  })

  it('o servidor recusa a conexão quando o cliente não apresenta certificado', async () => {
    await expect(
      fetch(`${baseUrl}/contacorrente/v1/saldos`, {
        dispatcher: createMutualTlsDispatcher({}, {}) ?? undefined,
      }),
    ).rejects.toBeTruthy()
  })
})
