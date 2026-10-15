import { afterEach, describe, expect, it, vi } from 'vitest'
import { reconcileYesterdayForActiveAccounts } from './dailyReconciliation.js'

describe('reconcileYesterdayForActiveAccounts', () => {
  afterEach(() => vi.restoreAllMocks())

  it('runs one scheduled reconciliation per active account and keeps going after a failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reconcile = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue({ status: 'completed' })
    const findActiveAccounts = async () => [{ id: 1 }, { id: 2 }]

    await reconcileYesterdayForActiveAccounts({ date: '2026-09-15', reconcile, findActiveAccounts })

    expect(reconcile).toHaveBeenCalledTimes(2)
    expect(reconcile).toHaveBeenNthCalledWith(1, { accountId: 1, from: '2026-09-15', to: '2026-09-15', trigger: 'scheduled' })
    expect(reconcile).toHaveBeenNthCalledWith(2, { accountId: 2, from: '2026-09-15', to: '2026-09-15', trigger: 'scheduled' })
    expect(console.error).toHaveBeenCalledTimes(1)
  })
})
