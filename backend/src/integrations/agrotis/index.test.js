import { describe, expect, it } from 'vitest'
import { agrotisIntegration } from './index.js'

const account = { agrotisAccountId: '42', credentialsRef: 'SICREDI_MISSING_REF' }

describe('agrotisIntegration', () => {
  it('rejects instead of throwing synchronously when credentials are missing', async () => {
    const entries = agrotisIntegration.fetchEntries({ account, from: '2026-09-10', to: '2026-09-10' })
    expect(entries).toBeInstanceOf(Promise)
    await expect(entries).rejects.toThrow('Credenciais não encontradas: variável de ambiente AGROTIS_MISSING_REF')
  })
})
