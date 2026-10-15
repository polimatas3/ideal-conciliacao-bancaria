import { Router } from 'express'
import { accountRoutes } from './accountRoutes.js'
import { reconciliationRoutes } from './reconciliationRoutes.js'

export const routes = Router()

routes.get('/health', (request, response) => response.json({ status: 'ok' }))
routes.use('/accounts', accountRoutes)
routes.use('/reconciliations', reconciliationRoutes)
