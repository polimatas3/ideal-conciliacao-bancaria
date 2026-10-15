import { parseArgs } from 'node:util'
import { env } from '../src/config/env.js'
import { describeCertificate, verifyCertificatePair } from '../src/integrations/certificatePair.js'
import { readCredentials } from '../src/integrations/credentials.js'
import { buildSicrediAuth } from '../src/integrations/sicredi/sicredi.auth.js'
import { createSicrediClient } from '../src/integrations/sicredi/sicredi.client.js'
import { SICREDI_APIS, resolveSicrediApi } from '../src/integrations/sicredi/sicrediApiChoice.js'
import { explainSicrediError } from '../src/integrations/sicredi/sicrediErrors.js'
import { buildSicrediStatement } from '../src/integrations/sicredi/index.js'
import { buildPixStatement } from '../src/integrations/sicredi/sicrediPix.js'
import { createSicrediPixClient } from '../src/integrations/sicredi/sicrediPix.client.js'
import { yesterdayIsoDate } from '../src/utils/dates.js'

const { values } = parseArgs({
  options: {
    ref: { type: 'string', default: 'SICREDI_CONTA_PRINCIPAL' },
    from: { type: 'string' },
    to: { type: 'string' },
  },
})

const from = values.from ?? yesterdayIsoDate()
const to = values.to ?? from

function report(label, ok, detail) {
  console.log(`${ok ? '✔' : '✖'} ${label}${detail ? `\n    ${detail}` : ''}`)
}

function fail(label, detail) {
  report(label, false, detail)
  process.exit(1)
}

function money(cents) {
  if (cents == null) return 'indisponível'
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

let credentials
try {
  credentials = readCredentials(values.ref)
} catch (error) {
  console.log(`Diagnóstico da integração Sicredi (credencial ${values.ref})\n`)
  fail('credenciais lidas da variável de ambiente', error.message)
}

const target = resolveSicrediApi(credentials)

console.log(
  `Diagnóstico da integração Sicredi\n  credencial: ${values.ref}\n  API: ${target.api}${credentials.sandbox ? ' (homologação)' : ''}\n  base: ${target.baseUrl}\n  período: ${from} a ${to}\n`,
)
report('credenciais lidas da variável de ambiente', true)

const missing = ['clientId', 'clientSecret', 'certPath', 'keyPath'].filter((field) => !credentials[field])
if (missing.length > 0) fail('credencial completa', `faltando: ${missing.join(', ')}`)
report('credencial completa', true)

const pair = verifyCertificatePair(credentials)
if (!pair.matches) fail('certificado e chave privada conferem', pair.reason)

const certificate = describeCertificate(credentials.certPath)
report(
  'certificado e chave privada conferem',
  true,
  `${certificate.subject}\n    emitido por ${certificate.issuer}\n    válido até ${certificate.validTo.toLocaleDateString('pt-BR')} (${certificate.daysUntilExpiry} dias)`,
)
if (certificate.expired) fail('certificado dentro da validade', 'certificado expirado')

const { getToken, dispatcher } = buildSicrediAuth(credentials, {
  tokenUrl: target.tokenUrl,
  scope: target.scope,
  credentialsIn: target.credentialsIn,
})

try {
  const token = await getToken()
  report('token obtido', true, `${token.slice(0, 20)}… (escopo: ${target.scope})`)
} catch (error) {
  fail('token obtido', explainSicrediError(error))
}

const shared = { baseUrl: target.baseUrl, getToken, dispatcher, pageSize: env.sicrediPageSize }

if (target.api === SICREDI_APIS.PIX) {
  try {
    const received = await createSicrediPixClient(shared).fetchReceivedPix({ from, to })
    const { transactions } = buildPixStatement(received)
    report('pix recebidos consultados', true, `${received.length} recebimento(s), ${transactions.length} lançamento(s)`)
    for (const transaction of transactions.slice(0, 5)) {
      console.log(`      ${transaction.date}  ${transaction.type === 'debit' ? '-' : '+'}${money(transaction.amount)}  ${transaction.description}`)
    }
    console.log('\n    Observação: a API Pix não expõe saldo nem lançamentos não-Pix;')
    console.log('    a conciliação desta conta roda sem comparação de saldo.')
  } catch (error) {
    fail('pix recebidos consultados', explainSicrediError(error))
  }
} else {
  const client = createSicrediClient(shared)
  try {
    const raw = await client.fetchStatement({ account: {}, from, to })
    const { transactions, closingBalance } = buildSicrediStatement(raw)
    report(
      'extrato consultado',
      true,
      `${transactions.length} lançamento(s); saldo anterior ${money(Math.round(raw.previousBalance * 100))}, saldo final ${money(closingBalance)}`,
    )
    for (const transaction of transactions.slice(0, 5)) {
      console.log(`      ${transaction.date}  ${transaction.type === 'debit' ? '-' : '+'}${money(transaction.amount)}  ${transaction.description}`)
    }
  } catch (error) {
    fail('extrato consultado', explainSicrediError(error))
  }

  try {
    report('saldo atual consultado', true, money(await client.fetchCurrentBalanceCents({ account: {} })))
  } catch (error) {
    fail('saldo atual consultado', explainSicrediError(error))
  }
}

console.log('\nIntegração Sicredi pronta para uso.')
