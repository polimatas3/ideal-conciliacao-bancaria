import { Router } from 'express'
import * as accountController from '../controllers/accountController.js'
import { validate } from '../middleware/validate.js'
import { createAccountSchema } from '../validation/accountSchemas.js'

export const accountRoutes = Router()

accountRoutes.get('/', accountController.list)
accountRoutes.post('/', validate({ body: createAccountSchema }), accountController.create)
