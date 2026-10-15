import {
  createManualMatch,
  justifyTransaction,
  removeJustification,
  removeMatch,
} from '../services/manualReconciliationService.js'

export async function createMatch(request, response) {
  const { params, body } = request.validated
  response.status(201).json(await createManualMatch({ runId: params.id, ...body }))
}

export async function deleteMatch(request, response) {
  const { params } = request.validated
  await removeMatch({ runId: params.id, matchId: params.matchId })
  response.status(204).end()
}

export async function createJustification(request, response) {
  const { params, body } = request.validated
  response.status(201).json(await justifyTransaction({ runId: params.id, ...body }))
}

export async function deleteJustification(request, response) {
  const { params } = request.validated
  await removeJustification({ runId: params.id, justificationId: params.justificationId })
  response.status(204).end()
}
