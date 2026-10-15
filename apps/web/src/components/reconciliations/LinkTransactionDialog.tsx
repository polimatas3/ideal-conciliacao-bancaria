import { toast } from 'sonner'
import { useCreateMatch } from '@/api/reconciliations'
import { AmountCell } from '@/components/reconciliations/AmountCell'
import { TransactionSummary } from '@/components/reconciliations/TransactionSummary'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { sourceLabel } from '@/lib/labels'
import type { NewMatch, PendingTransaction } from '@/types/api'

interface LinkTransactionDialogProps {
  runId: number
  transaction: PendingTransaction | null
  candidates: PendingTransaction[]
  onClose: () => void
}

function pairOf(transaction: PendingTransaction, candidate: PendingTransaction): NewMatch {
  if (transaction.source === 'agrotis') return { agrotisTransactionId: transaction.id, sicrediTransactionId: candidate.id }
  return { agrotisTransactionId: candidate.id, sicrediTransactionId: transaction.id }
}

export function LinkTransactionDialog({ runId, transaction, candidates, onClose }: LinkTransactionDialogProps) {
  const createMatch = useCreateMatch(runId)
  const compatible = transaction
    ? candidates.filter((candidate) => candidate.amount === transaction.amount && candidate.type === transaction.type && !candidate.justification)
    : []
  const otherSide = transaction?.source === 'agrotis' ? sourceLabel.sicredi : sourceLabel.agrotis

  function handleLink(candidate: PendingTransaction) {
    if (!transaction) return
    createMatch.mutate(pairOf(transaction, candidate), {
      onSuccess: () => {
        toast.success('Lançamentos vinculados')
        onClose()
      },
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <Dialog open={transaction !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vincular lançamento</DialogTitle>
          <DialogDescription>Escolha o lançamento do {otherSide} que corresponde a este.</DialogDescription>
        </DialogHeader>
        {transaction && (
          <div className="flex items-center justify-between rounded-md bg-muted p-3">
            <TransactionSummary transaction={transaction} />
            <AmountCell amount={transaction.amount} type={transaction.type} />
          </div>
        )}
        {compatible.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lançamento pendente do {otherSide} com o mesmo valor.</p>
        ) : (
          <div className="max-h-80 overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lançamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {compatible.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <TransactionSummary transaction={candidate} />
                    </TableCell>
                    <TableCell className="text-right">
                      <AmountCell amount={candidate.amount} type={candidate.type} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleLink(candidate)} disabled={createMatch.isPending}>
                        Vincular
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
