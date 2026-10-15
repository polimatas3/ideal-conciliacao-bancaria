import { formatCents } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TransactionType } from '@/types/api'

export function AmountCell({ amount, type }: { amount: number; type: TransactionType }) {
  const isDebit = type === 'debit'
  return (
    <span className={cn('font-mono tabular-nums', isDebit ? 'text-red-600' : 'text-emerald-600')}>
      {isDebit ? '−' : '+'}
      {formatCents(amount)}
    </span>
  )
}
