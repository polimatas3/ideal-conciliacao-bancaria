import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useCreateJustification } from '@/api/reconciliations'
import { AmountCell } from '@/components/reconciliations/AmountCell'
import { TransactionSummary } from '@/components/reconciliations/TransactionSummary'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { PendingTransaction } from '@/types/api'

interface JustifyDialogProps {
  runId: number
  transaction: PendingTransaction | null
  onClose: () => void
}

export function JustifyDialog({ runId, transaction, onClose }: JustifyDialogProps) {
  const [reason, setReason] = useState('')
  const createJustification = useCreateJustification(runId)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!transaction) return
    createJustification.mutate(
      { transactionId: transaction.id, reason },
      {
        onSuccess: () => {
          toast.success('Justificativa registrada')
          setReason('')
          onClose()
        },
        onError: (error) => toast.error(error.message),
      },
    )
  }

  return (
    <Dialog open={transaction !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Justificar lançamento</DialogTitle>
          <DialogDescription>O lançamento continua pendente, mas com o motivo registrado.</DialogDescription>
        </DialogHeader>
        {transaction && (
          <div className="flex items-center justify-between rounded-md bg-muted p-3">
            <TransactionSummary transaction={transaction} />
            <AmountCell amount={transaction.amount} type={transaction.type} />
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea id="reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createJustification.isPending}>
              {createJustification.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
