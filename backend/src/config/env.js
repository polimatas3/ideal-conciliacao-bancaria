import 'dotenv/config'

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/conciliacao',
  engineUrl: process.env.ENGINE_URL ?? 'http://localhost:8000',
  reconciliationCron: process.env.RECONCILIATION_CRON ?? '0 6 * * *',
  dateToleranceDays: Number(process.env.DATE_TOLERANCE_DAYS ?? 2),
  sicrediBaseUrl: process.env.SICREDI_BASE_URL ?? 'https://mtls-api-parceiro.sicredi.com.br',
  sicrediScope: process.env.SICREDI_SCOPE ?? 'contacorrente.extratos.consultar contacorrente.saldo.consultar',
  sicrediPageSize: Number(process.env.SICREDI_PAGE_SIZE ?? 100),
  sicrediPixBaseUrl: process.env.SICREDI_PIX_BASE_URL ?? 'https://api-pix.sicredi.com.br',
  sicrediPixSandboxBaseUrl: process.env.SICREDI_PIX_SANDBOX_BASE_URL ?? 'https://api-pix-h.sicredi.com.br',
  sicrediPixScope: process.env.SICREDI_PIX_SCOPE ?? 'pix.read',
  agrotisBaseUrl: process.env.AGROTIS_BASE_URL ?? 'https://api.agrotis.com.br',
  agrotisTokenUrl: process.env.AGROTIS_TOKEN_URL ?? 'https://api.agrotis.com.br/oauth/token',
}
