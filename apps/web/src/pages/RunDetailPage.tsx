import { useParams } from 'react-router'
import { useRunDetail } from '@/api/reconciliations'
import { MatchedTable } from '@/components/reconciliations/MatchedTable'
import { PendingTable } from '@/components/reconciliations/PendingTable'
import { RunHeader } from '@/components/reconciliations/RunHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function RunDetailPage() {
  const { id } = useParams()
  const runId = Number(id)
  const { data, isLoading, error } = useRunDetail(runId)

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>
  if (error || !data) return <p className="text-sm text-destructive">{error?.message ?? 'Execução não encontrada'}</p>

  const editable = data.run.status === 'completed'

  return (
    <div className="space-y-6">
      <RunHeader run={data.run} />
      {data.run.errorMessage && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{data.run.errorMessage}</div>
      )}
      <Tabs defaultValue="matched">
        <TabsList>
          <TabsTrigger value="matched" className="cursor-pointer">
            Batidos ({data.summary.matched})
          </TabsTrigger>
          <TabsTrigger value="agrotis" className="cursor-pointer">
            Só Agrotis ({data.summary.onlyAgrotis})
          </TabsTrigger>
          <TabsTrigger value="sicredi" className="cursor-pointer">
            Só Sicredi ({data.summary.onlySicredi})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="matched" className="mt-4">
          <MatchedTable runId={runId} matched={data.matched} editable={editable} />
        </TabsContent>
        <TabsContent value="agrotis" className="mt-4">
          <PendingTable runId={runId} transactions={data.onlyAgrotis} candidates={data.onlySicredi} editable={editable} />
        </TabsContent>
        <TabsContent value="sicredi" className="mt-4">
          <PendingTable runId={runId} transactions={data.onlySicredi} candidates={data.onlyAgrotis} editable={editable} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
