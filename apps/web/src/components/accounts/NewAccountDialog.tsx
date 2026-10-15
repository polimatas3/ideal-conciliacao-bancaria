import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useCreateAccount } from '@/api/accounts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { NewAccount } from '@/types/api'

const fields: { name: keyof NewAccount; label: string; placeholder: string }[] = [
  { name: 'name', label: 'Nome', placeholder: 'Conta principal' },
  { name: 'branch', label: 'Agência', placeholder: '0710' },
  { name: 'accountNumber', label: 'Conta', placeholder: '12345-6' },
  { name: 'agrotisAccountId', label: 'Id da conta no Agrotis', placeholder: '42' },
  { name: 'credentialsRef', label: 'Variável de ambiente das credenciais', placeholder: 'SICREDI_CONTA_PRINCIPAL' },
]

export function NewAccountDialog() {
  const [open, setOpen] = useState(false)
  const createAccount = useCreateAccount()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget)) as unknown as NewAccount
    createAccount.mutate(data, {
      onSuccess: () => {
        toast.success('Conta cadastrada')
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nova conta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova conta</DialogTitle>
          <DialogDescription>
            As credenciais ficam em variáveis de ambiente do backend; aqui vai só o nome da variável do Sicredi (a do
            Agrotis usa o mesmo nome com prefixo AGROTIS_).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input id={field.name} name={field.name} placeholder={field.placeholder} required />
            </div>
          ))}
          <DialogFooter>
            <Button type="submit" disabled={createAccount.isPending}>
              {createAccount.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
