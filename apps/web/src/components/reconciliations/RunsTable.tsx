import { useNavigate } from 'react-router'
import { RunStatusBadge } from '@/components/reconciliations/RunStatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCents, formatDate } from '@/lib/format'
import { runTriggerLabel } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { RunListItem } from '@/types/api'

export function RunsTable({ runs }: { runs: RunListItem[] }) {
  const navigate = useNavigate()

  if (runs.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma execução ainda.</p>

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Disparo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Batidos</TableHead>
            <TableHead className="text-right">Pendências</TableHead>
            <TableHead className="text-right">Diferença de saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id} onClick={() => navigate(`/reconciliations/${run.id}`)} className="cursor-pointer">
              <TableCell className="text-muted-foreground">{run.id}</TableCell>
              <TableCell className="font-medium">{run.bankAccount.name}</TableCell>
              <TableCell>
                {formatDate(run.periodStart)} – {formatDate(run.periodEnd)}
              </TableCell>
              <TableCell>{runTriggerLabel[run.trigger]}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <RunStatusBadge status={run.status} />
                  {run.errorMessage && <span className="max-w-xs truncate text-xs text-destructive">{run.errorMessage}</span>}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{run.summary.matched}</TableCell>
              <TableCell className="text-right tabular-nums">{run.summary.onlyAgrotis + run.summary.onlySicredi}</TableCell>
              <TableCell
                className={cn(
                  'text-right font-mono tabular-nums',
                  run.balanceDifference !== null && run.balanceDifference !== 0 && 'text-red-600',
                )}
              >
                {formatCents(run.balanceDifference)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
