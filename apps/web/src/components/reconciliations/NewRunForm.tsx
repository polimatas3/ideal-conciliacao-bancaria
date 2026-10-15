import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useCreateRun } from '@/api/reconciliations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { yesterdayIsoDate } from '@/lib/format'
import type { Account } from '@/types/api'

interface NewRunFormProps {
  accounts: Account[]
  accountId?: number
  onAccountChange: (accountId: number) => void
}

export function NewRunForm({ accounts, accountId, onAccountChange }: NewRunFormProps) {
  const [from, setFrom] = useState(yesterdayIsoDate)
  const [to, setTo] = useState(yesterdayIsoDate)
  const createRun = useCreateRun()
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!accountId) {
      toast.error('Selecione uma conta')
      return
    }
    createRun.mutate(
      { accountId, from, to },
      {
        onSuccess: (detail) => {
          if (detail.run.status === 'failed') toast.error(`Execução falhou: ${detail.run.errorMessage}`)
          else toast.success(`Conciliação concluída: ${detail.summary.matched} batidos`)
          navigate(`/reconciliations/${detail.run.id}`)
        },
        onError: (error) => toast.error(error.message),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label>Conta</Label>
        <Select value={accountId ? String(accountId) : ''} onValueChange={(value) => onAccountChange(Number(value))}>
          <SelectTrigger className="w-64 cursor-pointer">
            <SelectValue placeholder="Selecione a conta" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={String(account.id)} className="cursor-pointer">
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="from">De</Label>
        <Input id="from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="to">Até</Label>
        <Input id="to" type="date" value={to} onChange={(event) => setTo(event.target.value)} required />
      </div>
      <Button type="submit" disabled={createRun.isPending}>
        {createRun.isPending ? 'Conciliando…' : 'Conciliar'}
      </Button>
    </form>
  )
}
