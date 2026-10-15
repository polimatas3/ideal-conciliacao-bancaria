import { useAccounts } from '@/api/accounts'
import { AccountsTable } from '@/components/accounts/AccountsTable'
import { NewAccountDialog } from '@/components/accounts/NewAccountDialog'

export function AccountsPage() {
  const { data: accounts, isLoading, error } = useAccounts()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Contas</h1>
        <NewAccountDialog />
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {accounts && <AccountsTable accounts={accounts} />}
    </div>
  )
}
