import type { MatchKind, RunStatus, RunTrigger, Source, TransactionType } from '@/types/api'

export const runStatusLabel: Record<RunStatus, string> = {
  running: 'Executando',
  completed: 'Concluída',
  failed: 'Falhou',
}

export const runTriggerLabel: Record<RunTrigger, string> = {
  scheduled: 'Agendada',
  manual: 'Manual',
}

export const sourceLabel: Record<Source, string> = {
  agrotis: 'Agrotis',
  sicredi: 'Sicredi',
}

export const transactionTypeLabel: Record<TransactionType, string> = {
  credit: 'Crédito',
  debit: 'Débito',
}

export const matchKindLabel: Record<MatchKind, string> = {
  auto: 'Automático',
  manual: 'Manual',
}
