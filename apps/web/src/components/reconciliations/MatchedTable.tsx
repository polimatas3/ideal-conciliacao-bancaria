import { toast } from 'sonner'
import { useDeleteMatch } from '@/api/reconciliations'
import { AmountCell } from '@/components/reconciliations/AmountCell'
import { TransactionSummary } from '@/components/reconciliations/TransactionSummary'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { matchKindLabel } from '@/lib/labels'
import type { MatchedPair } from '@/types/api'

interface MatchedTableProps {
  runId: number
  matched: MatchedPair[]
  editable: boolean
}

export function MatchedTable({ runId, matched, editable }: MatchedTableProps) {
  const deleteMatch = useDeleteMatch(runId)

  function handleUndo(matchId: number) {
    deleteMatch.mutate(matchId, {
      onSuccess: () => toast.success('Vínculo desfeito'),
      onError: (error) => toast.error(error.message),
    })
  }

  if (matched.length === 0) return <p className="text-sm text-muted-foreground">Nenhum lançamento batido.</p>

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agrotis</TableHead>
            <TableHead>Sicredi</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Origem</TableHead>
            {editable && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {matched.map((pair) => (
            <TableRow key={pair.id}>
              <TableCell>
                <TransactionSummary transaction={pair.agrotis} />
              </TableCell>
              <TableCell>
                <TransactionSummary transaction={pair.sicredi} />
              </TableCell>
              <TableCell className="text-right">
                <AmountCell amount={pair.agrotis.amount} type={pair.agrotis.type} />
              </TableCell>
              <TableCell>
                <Badge variant={pair.kind === 'manual' ? 'secondary' : 'outline'}>{matchKindLabel[pair.kind]}</Badge>
              </TableCell>
              {editable && (
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleUndo(pair.id)} disabled={deleteMatch.isPending}>
                    Desfazer
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
