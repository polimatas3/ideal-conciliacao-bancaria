import { z } from 'zod'
import { BANKS } from '../config/enums.js'

export const createAccountSchema = z.object({
  name: z.string().trim().min(1),
  bank: z.enum(Object.values(BANKS)).default(BANKS.SICREDI),
  branch: z.string().trim().min(1),
  accountNumber: z.string().trim().min(1),
  agrotisAccountId: z.string().trim().min(1),
  credentialsRef: z.string().trim().min(1),
})
