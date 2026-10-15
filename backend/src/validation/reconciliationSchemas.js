import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
const positiveId = z.coerce.number().int().positive()

export const createRunSchema = z
  .object({ accountId: positiveId, from: isoDate, to: isoDate })
  .refine((period) => period.from <= period.to, { message: 'Data inicial deve ser menor ou igual à final', path: ['to'] })

export const listRunsQuerySchema = z.object({ accountId: positiveId.optional() })

export const runParamsSchema = z.object({ id: positiveId })

export const createMatchSchema = z.object({ agrotisTransactionId: positiveId, sicrediTransactionId: positiveId })

export const matchParamsSchema = z.object({ id: positiveId, matchId: positiveId })

export const createJustificationSchema = z.object({ transactionId: positiveId, reason: z.string().trim().min(1) })

export const justificationParamsSchema = z.object({ id: positiveId, justificationId: positiveId })
