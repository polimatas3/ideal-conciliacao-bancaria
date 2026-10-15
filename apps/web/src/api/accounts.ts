import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Account, NewAccount } from '@/types/api'

export const accountKeys = { all: ['accounts'] as const }

export function useAccounts() {
  return useQuery({ queryKey: accountKeys.all, queryFn: () => api.get<Account[]>('/accounts') })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: NewAccount) => api.post<Account>('/accounts', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  })
}
