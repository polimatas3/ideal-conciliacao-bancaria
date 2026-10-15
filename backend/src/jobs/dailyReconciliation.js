import cron from 'node-cron'
import { env } from '../config/env.js'
import { RUN_TRIGGERS } from '../config/enums.js'
import { BankAccount } from '../models/index.js'
import { runReconciliation } from '../services/reconciliationService.js'
import { yesterdayIsoDate } from '../utils/dates.js'

const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo'

function findActiveBankAccounts() {
  return BankAccount.findAll({ where: { active: true } })
}

export async function reconcileYesterdayForActiveAccounts({
  date = yesterdayIsoDate(),
  reconcile = runReconciliation,
  findActiveAccounts = findActiveBankAccounts,
} = {}) {
  const accounts = await findActiveAccounts()
  for (const account of accounts) {
    try {
      await reconcile({ accountId: account.id, from: date, to: date, trigger: RUN_TRIGGERS.SCHEDULED })
    } catch (error) {
      console.error(`Falha ao conciliar a conta ${account.id} em ${date}:`, error)
    }
  }
}

export function startDailyReconciliation() {
  cron.schedule(env.reconciliationCron, () => reconcileYesterdayForActiveAccounts(), { timezone: SAO_PAULO_TIMEZONE })
}
