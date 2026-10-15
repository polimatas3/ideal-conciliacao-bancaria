import { Router } from 'express'
import * as manualReconciliationController from '../controllers/manualReconciliationController.js'
import * as reconciliationController from '../controllers/reconciliationController.js'
import { validate } from '../middleware/validate.js'
import {
  createJustificationSchema,
  createMatchSchema,
  createRunSchema,
  justificationParamsSchema,
  listRunsQuerySchema,
  matchParamsSchema,
  runParamsSchema,
} from '../validation/reconciliationSchemas.js'

export const reconciliationRoutes = Router()

reconciliationRoutes.post('/', validate({ body: createRunSchema }), reconciliationController.create)
reconciliationRoutes.get('/', validate({ query: listRunsQuerySchema }), reconciliationController.list)
reconciliationRoutes.get('/:id', validate({ params: runParamsSchema }), reconciliationController.detail)

reconciliationRoutes.post(
  '/:id/matches',
  validate({ params: runParamsSchema, body: createMatchSchema }),
  manualReconciliationController.createMatch,
)
reconciliationRoutes.delete(
  '/:id/matches/:matchId',
  validate({ params: matchParamsSchema }),
  manualReconciliationController.deleteMatch,
)
reconciliationRoutes.post(
  '/:id/justifications',
  validate({ params: runParamsSchema, body: createJustificationSchema }),
  manualReconciliationController.createJustification,
)
reconciliationRoutes.delete(
  '/:id/justifications/:justificationId',
  validate({ params: justificationParamsSchema }),
  manualReconciliationController.deleteJustification,
)
