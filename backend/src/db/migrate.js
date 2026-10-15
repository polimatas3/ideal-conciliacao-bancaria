import { pathToFileURL } from 'node:url'
import { SequelizeStorage, Umzug } from 'umzug'
import { sequelize } from './sequelize.js'

export function createMigrator() {
  return new Umzug({
    migrations: {
      glob: ['migrations/*.js', { cwd: new URL('.', import.meta.url).pathname }],
      resolve: ({ name, path, context }) => {
        const load = () => import(pathToFileURL(path).href)
        return {
          name,
          up: async () => (await load()).up(context),
          down: async () => (await load()).down(context),
        }
      },
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  })
}

const isEntryPoint = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isEntryPoint) {
  const direction = process.argv[2] === 'down' ? 'down' : 'up'
  const migrator = createMigrator()
  if (direction === 'down') await migrator.down()
  else await migrator.up()
  await sequelize.close()
}
