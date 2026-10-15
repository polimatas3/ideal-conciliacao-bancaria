export type Source = 'agrotis' | 'sicredi'
export type TransactionType = 'credit' | 'debit'
export type RunStatus = 'running' | 'completed' | 'failed'
export type RunTrigger = 'scheduled' | 'manual'
export type MatchKind = 'auto' | 'manual'

export interface Account {
  id: number
  name: string
  bank: string
  branch: string
  accountNumber: string
  agrotisAccountId: string
  credentialsRef: string
  active: boolean
}

export interface NewAccount {
  name: string
  branch: string
  accountNumber: string
  agrotisAccountId: string
  credentialsRef: string
}

export interface RunSummary {
  matched: number
  onlyAgrotis: number
  onlySicredi: number
}

export interface Run {
  id: number
  bankAccountId: number
  periodStart: string
  periodEnd: string
  trigger: RunTrigger
  status: RunStatus
  agrotisBalance: number | null
  sicrediBalance: number | null
  balanceDifference: number | null
  errorMessage: string | null
  startedAt: string
  finishedAt: string | null
  bankAccount: { id: number; name: string }
}

export interface RunListItem extends Run {
  summary: RunSummary
}

export interface Transaction {
  id: number
  runId: number
  source: Source
  externalId: string
  date: string
  amount: number
  type: TransactionType
  description: string
  documentNumber: string | null
}

export interface Justification {
  id: number
  reason: string
}

export interface PendingTransaction extends Transaction {
  justification: Justification | null
}

export interface MatchedPair {
  id: number
  kind: MatchKind
  agrotis: Transaction
  sicredi: Transaction
}

export interface RunDetail {
  run: Run
  summary: RunSummary & { justified: number }
  matched: MatchedPair[]
  onlyAgrotis: PendingTransaction[]
  onlySicredi: PendingTransaction[]
}

export interface NewRun {
  accountId: number
  from: string
  to: string
}

export interface NewMatch {
  agrotisTransactionId: number
  sicrediTransactionId: number
}

export interface NewJustification {
  transactionId: number
  reason: string
}
