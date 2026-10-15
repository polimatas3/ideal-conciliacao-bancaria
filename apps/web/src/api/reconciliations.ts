import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { NewJustification, NewMatch, NewRun, RunDetail, RunListItem } from '@/types/api'

export const runKeys = {
  all: ['runs'] as const,
  list: (accountId?: number) => ['runs', 'list', accountId ?? 'all'] as const,
  detail: (runId: number) => ['runs', 'detail', runId] as const,
}

export function useRuns(accountId?: number) {
  const path = accountId ? `/reconciliations?accountId=${accountId}` : '/reconciliations'
  return useQuery({ queryKey: runKeys.list(accountId), queryFn: () => api.get<RunListItem[]>(path) })
}

export function useRunDetail(runId: number) {
  return useQuery({
    queryKey: runKeys.detail(runId),
    queryFn: () => api.get<RunDetail>(`/reconciliations/${runId}`),
    enabled: Number.isInteger(runId) && runId > 0,
  })
}

function useRunMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: runKeys.all }),
  })
}

export function useCreateRun() {
  return useRunMutation((data: NewRun) => api.post<RunDetail>('/reconciliations', data))
}

export function useCreateMatch(runId: number) {
  return useRunMutation((data: NewMatch) => api.post(`/reconciliations/${runId}/matches`, data))
}

export function useDeleteMatch(runId: number) {
  return useRunMutation((matchId: number) => api.delete(`/reconciliations/${runId}/matches/${matchId}`))
}

export function useCreateJustification(runId: number) {
  return useRunMutation((data: NewJustification) => api.post(`/reconciliations/${runId}/justifications`, data))
}

export function useDeleteJustification(runId: number) {
  return useRunMutation((justificationId: number) =>
    api.delete(`/reconciliations/${runId}/justifications/${justificationId}`),
  )
}
