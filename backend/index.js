import { app } from './src/app.js'
import { env } from './src/config/env.js'
import { startDailyReconciliation } from './src/jobs/dailyReconciliation.js'
import { sequelize } from './src/models/index.js'

await sequelize.authenticate()
startDailyReconciliation()
app.listen(env.port, () => console.log(`Backend ouvindo na porta ${env.port}`))
