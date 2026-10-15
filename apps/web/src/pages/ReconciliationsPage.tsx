import { useState } from 'react'
import { useAccounts } from '@/api/accounts'
import { useRuns } from '@/api/reconciliations'
import { NewRunForm } from '@/components/reconciliations/NewRunForm'
import { RunsTable } from '@/components/reconciliations/RunsTable'

export function ReconciliationsPage() {
  const [accountId, setAccountId] = useState<number>()
  const { data: accounts } = useAccounts()
  const { data: runs, isLoading, error } = useRuns(accountId)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Execuções</h1>
      <NewRunForm accounts={accounts ?? []} accountId={accountId} onAccountChange={setAccountId} />
      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {runs && <RunsTable runs={runs} />}
    </div>
  )
}
