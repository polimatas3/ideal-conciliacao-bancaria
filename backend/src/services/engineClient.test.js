import { describe, expect, it, vi } from 'vitest'
import { IntegrationError } from '../integrations/http.js'
import { reconcileWithEngine } from './engineClient.js'

const agrotis = [
  { externalId: 'a1', source: 'agrotis', date: '2026-09-10', amount: 100, type: 'credit', description: 'x', documentNumber: 'D1' },
]
const sicredi = [{ externalId: 's1', source: 'sicredi', date: '2026-09-10', amount: 100, type: 'credit', description: 'y' }]

describe('reconcileWithEngine', () => {
  it('posts snake_case payload and returns the engine result', async () => {
    const engineResult = { matches: [], only_agrotis: [], only_sicredi: [], balance_difference: 0, summary: {} }
    const fetchJsonImpl = vi.fn().mockResolvedValue(engineResult)

    const result = await reconcileWithEngine(
      { agrotis, sicredi, dateToleranceDays: 3, balances: { agrotis: 10, sicredi: 10 } },
      { engineUrl: 'http://engine.test', fetchJsonImpl },
    )

    expect(result).toBe(engineResult)
    expect(fetchJsonImpl).toHaveBeenCalledWith('http://engine.test/reconcile', {
      method: 'POST',
      retries: 1,
      body: {
        agrotis: [
          { external_id: 'a1', source: 'agrotis', date: '2026-09-10', amount: 100, type: 'credit', description: 'x', document_number: 'D1' },
        ],
        sicredi: [
          { external_id: 's1', source: 'sicredi', date: '2026-09-10', amount: 100, type: 'credit', description: 'y', document_number: null },
        ],
        rules: { date_tolerance_days: 3 },
        balances: { agrotis: 10, sicredi: 10 },
      },
    })
  })

  it('wraps failures in a friendly message', async () => {
    const fetchJsonImpl = vi.fn().mockRejectedValue(new IntegrationError('HTTP 500 ao chamar x', { status: 500 }))
    await expect(
      reconcileWithEngine({ agrotis: [], sicredi: [], dateToleranceDays: 2, balances: { agrotis: 0, sicredi: 0 } }, { fetchJsonImpl }),
    ).rejects.toThrow('Motor de conciliação indisponível: HTTP 500 ao chamar x')
  })
})
