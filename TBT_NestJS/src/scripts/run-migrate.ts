import { Umzug, SequelizeStorage } from 'umzug'
import * as path from 'path'
import { sequelize } from '../models'

const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, '../migrations/*.ts'),
    resolve: ({ name, path: migPath, context }) => {
      const migration = require(migPath!)
      return {
        name,
        up: async () => migration.up(context),
        down: async () => migration.down(context),
      }
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
})

async function run() {
  const args = process.argv.slice(2)
  try {
    if (args.includes('--down')) {
      await umzug.down()
      console.log('Rolled back last migration.')
    } else {
      const migrations = await umzug.up()
      if (migrations.length === 0) {
        console.log('No pending migrations.')
      } else {
        console.log(`Ran ${migrations.length} migration(s):`, migrations.map((m) => m.name))
      }
    }
    process.exit(0)
  } catch (err: any) {
    console.error('Migration failed:', err?.message || err)
    process.exit(1)
  }
}

run()
