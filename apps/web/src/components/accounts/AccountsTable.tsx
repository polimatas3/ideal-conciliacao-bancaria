import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Account } from '@/types/api'

export function AccountsTable({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada.</p>

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Agência</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead>Conta no Agrotis</TableHead>
            <TableHead>Credenciais (env)</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">{account.name}</TableCell>
              <TableCell>{account.branch}</TableCell>
              <TableCell>{account.accountNumber}</TableCell>
              <TableCell>{account.agrotisAccountId}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{account.credentialsRef}</TableCell>
              <TableCell>
                <Badge variant={account.active ? 'default' : 'outline'}>{account.active ? 'Ativa' : 'Inativa'}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
