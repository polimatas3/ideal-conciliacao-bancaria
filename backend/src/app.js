import cors from 'cors'
import express from 'express'
import { errorHandler } from './middleware/errorHandler.js'
import { routes } from './routes/index.js'

export const app = express()

app.use(cors())
app.use(express.json())
app.use(routes)
app.use(errorHandler)
