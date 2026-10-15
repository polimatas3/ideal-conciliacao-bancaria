import { useState } from 'react'
import { toast } from 'sonner'
import { useDeleteJustification } from '@/api/reconciliations'
import { AmountCell } from '@/components/reconciliations/AmountCell'
import { JustifyDialog } from '@/components/reconciliations/JustifyDialog'
import { LinkTransactionDialog } from '@/components/reconciliations/LinkTransactionDialog'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/format'
import type { Justification, PendingTransaction } from '@/types/api'

interface PendingTableProps {
  runId: number
  transactions: PendingTransaction[]
  candidates: PendingTransaction[]
  editable: boolean
}

export function PendingTable({ runId, transactions, candidates, editable }: PendingTableProps) {
  const [linking, setLinking] = useState<PendingTransaction | null>(null)
  const [justifying, setJustifying] = useState<PendingTransaction | null>(null)
  const deleteJustification = useDeleteJustification(runId)

  function handleRemoveJustification(justification: Justification) {
    deleteJustification.mutate(justification.id, {
      onSuccess: () => toast.success('Justificativa removida'),
      onError: (error) => toast.error(error.message),
    })
  }

  if (transactions.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma pendência deste lado.</p>

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Justificativa</TableHead>
              {editable && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="whitespace-nowrap">{formatDate(transaction.date)}</TableCell>
                <TableCell>{transaction.description || '(sem descrição)'}</TableCell>
                <TableCell className="text-muted-foreground">{transaction.documentNumber ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <AmountCell amount={transaction.amount} type={transaction.type} />
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{transaction.justification?.reason ?? '—'}</TableCell>
                {editable && (
                  <TableCell className="whitespace-nowrap text-right">
                    {transaction.justification ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveJustification(transaction.justification as Justification)}
                        disabled={deleteJustification.isPending}
                      >
                        Remover justificativa
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setLinking(transaction)}>
                          Vincular
                        </Button>
                        <Button variant="ghost" size="sm" className="ml-2" onClick={() => setJustifying(transaction)}>
                          Justificar
                        </Button>
                      </>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <LinkTransactionDialog runId={runId} transaction={linking} candidates={candidates} onClose={() => setLinking(null)} />
      <JustifyDialog runId={runId} transaction={justifying} onClose={() => setJustifying(null)} />
    </>
  )
}
