import { formatDate } from '@/lib/format'
import type { Transaction } from '@/types/api'

export function TransactionSummary({ transaction }: { transaction: Transaction }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm">{transaction.description || '(sem descrição)'}</span>
      <span className="text-xs text-muted-foreground">
        {formatDate(transaction.date)}
        {transaction.documentNumber && ` · doc ${transaction.documentNumber}`} · {transaction.externalId}
      </span>
    </div>
  )
}
