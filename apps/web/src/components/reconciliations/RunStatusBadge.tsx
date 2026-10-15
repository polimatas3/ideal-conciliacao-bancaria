import { Badge } from '@/components/ui/badge'
import { runStatusLabel } from '@/lib/labels'
import type { RunStatus } from '@/types/api'

const variantByStatus: Record<RunStatus, 'default' | 'secondary' | 'destructive'> = {
  running: 'secondary',
  completed: 'default',
  failed: 'destructive',
}

export function RunStatusBadge({ status }: { status: RunStatus }) {
  return <Badge variant={variantByStatus[status]}>{runStatusLabel[status]}</Badge>
}
