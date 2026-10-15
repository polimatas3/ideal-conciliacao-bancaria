import { RUN_TRIGGERS } from '../config/enums.js'
import { getRunDetail, listRuns, runReconciliation } from '../services/reconciliationService.js'

export async function create(request, response) {
  const { accountId, from, to } = request.validated.body
  const run = await runReconciliation({ accountId, from, to, trigger: RUN_TRIGGERS.MANUAL })
  response.status(201).json(await getRunDetail(run.id))
}

export async function list(request, response) {
  response.json(await listRuns(request.validated.query))
}

export async function detail(request, response) {
  response.json(await getRunDetail(request.validated.params.id))
}
