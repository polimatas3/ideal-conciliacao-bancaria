import { RunStatusBadge } from '@/components/reconciliations/RunStatusBadge'
import { formatCents, formatDate, formatDateTime } from '@/lib/format'
import { runTriggerLabel } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { Run } from '@/types/api'

export function RunHeader({ run }: { run: Run }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Execução #{run.id}</h1>
        <RunStatusBadge status={run.status} />
        <span className="text-sm text-muted-foreground">
          {run.bankAccount.name} · {formatDate(run.periodStart)} – {formatDate(run.periodEnd)} ·{' '}
          {runTriggerLabel[run.trigger]} · {formatDateTime(run.finishedAt)}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <BalanceCard label="Saldo Agrotis" cents={run.agrotisBalance} />
        <BalanceCard label="Saldo Sicredi" cents={run.sicrediBalance} />
        <DifferenceCard cents={run.balanceDifference} />
      </div>
    </div>
  )
}

function BalanceCard({ label, cents }: { label: string; cents: number | null }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{formatCents(cents)}</p>
    </div>
  )
}

function DifferenceCard({ cents }: { cents: number | null }) {
  const isBalanced = cents === 0
  const isOff = cents !== null && cents !== 0
  return (
    <div className={cn('rounded-lg border p-4', isOff && 'border-red-300 bg-red-50', isBalanced && 'border-emerald-300 bg-emerald-50')}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Diferença (Agrotis − Sicredi)</p>
      <p className={cn('mt-1 text-lg font-semibold tabular-nums', isOff && 'text-red-700', isBalanced && 'text-emerald-700')}>
        {formatCents(cents)}
      </p>
    </div>
  )
}
