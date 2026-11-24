import { sequelize } from '../config/database'
import { DataTypes } from 'sequelize'

// Tables whose models use `paranoid: true` and therefore expect a `deletedAt` column
const TABLES = [
  'users',
  'teams',
  'customers',
  'agents',
  'inventory_item',
  'inventory_item_brand',
  'inventory_item_category',
  'inventory_item_location',
  // add more table names here if you find other paranoid models
]

// Tables that use a `deleted_reason` column for storing deletion reason
const TABLES_WITH_DELETED_REASON = [
  'users',
  'teams',
  'customers',
  'agents',
]

// Additional tables and specific columns to ensure exist
const TABLES_WITH_COLUMNS: Record<string, Array<{ name: string; definition: any }>> = {
  notifications: [
    { name: 'target_user_id', definition: { type: DataTypes.BIGINT, allowNull: true } },
  ],
}

// Ensure team_agent has role_id (used by associations aliased as `teamLinks`)
TABLES_WITH_COLUMNS['team_agent'] = [
  { name: 'role_id', definition: { type: DataTypes.INTEGER, allowNull: true } },
]

// Ensure team_roles has role_id and team_id (used by many-to-many `roles` association)
TABLES_WITH_COLUMNS['team_roles'] = [
  { name: 'role_id', definition: { type: DataTypes.INTEGER, allowNull: true } },
  { name: 'team_id', definition: { type: DataTypes.INTEGER, allowNull: true } },
]

// Ensure tickets has ticket_template_id column
TABLES_WITH_COLUMNS['tickets'] = [
  { name: 'ticket_template_id', definition: { type: DataTypes.INTEGER, allowNull: true } },
  { name: 'device_id', definition: { type: DataTypes.INTEGER, allowNull: true } },
]

// misspelled column used in model: additinal_data
TABLES_WITH_COLUMNS['tickets'].push({ name: 'additinal_data', definition: { type: DataTypes.TEXT('long'), allowNull: true } })
// ensure alert_id exists on tickets
TABLES_WITH_COLUMNS['tickets'].push({ name: 'alert_id', definition: { type: DataTypes.INTEGER, allowNull: true } })
// ensure serialNo exists on tickets
TABLES_WITH_COLUMNS['tickets'].push({ name: 'serialNo', definition: { type: DataTypes.STRING, allowNull: true } })
// ensure ticketType exists on tickets
TABLES_WITH_COLUMNS['tickets'].push({ name: 'ticketType', definition: { type: DataTypes.STRING, allowNull: true } })
// ensure attachments exists on tickets
TABLES_WITH_COLUMNS['tickets'].push({ name: 'attachments', definition: { type: DataTypes.JSON, allowNull: true } })
// ensure reporter_id exists on tickets
TABLES_WITH_COLUMNS['tickets'].push({ name: 'reporter_id', definition: { type: DataTypes.INTEGER, allowNull: true } })

// ensure inventory_item_location has an address column (manual ALTER TABLE previously)
TABLES_WITH_COLUMNS['inventory_item_location'] = [
  { name: 'address', definition: { type: DataTypes.TEXT('long'), allowNull: true } },
]

// Tables to create explicitly when --create-tables is passed or CREATE_MISSING_TABLES=true
const TABLES_TO_CREATE: Record<string, any> = {
  ticket_template: {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    label: { type: DataTypes.STRING },
    description: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
}

async function run() {
  try {
    const qi = (sequelize as any).getQueryInterface()
    const doCreateTables = process.argv.includes('--create-tables') || process.env.CREATE_MISSING_TABLES === 'true'
    const doConvertTimes = process.argv.includes('--convert-times') || process.env.CONVERT_TIMES === 'true'
    for (const table of TABLES) {
      try {
        const desc = await qi.describeTable(table).catch(() => null)
        if (!desc) {
          console.log(`Table ${table} not found, skipping.`)
          continue
        }

        const hasDeletedAt = Object.prototype.hasOwnProperty.call(desc, 'deletedAt')
          || Object.prototype.hasOwnProperty.call(desc, 'deleted_at')

        if (!hasDeletedAt) {
          console.log(`Adding deletedAt column to ${table}`)
          await qi.addColumn(table, 'deletedAt', {
            type: DataTypes.DATE,
            allowNull: true,
          })
          console.log(`Added deletedAt to ${table}`)
        } else {
          console.log(`Table ${table} already has deletedAt (or variant), skipping.`)
        }
      } catch (err: any) {
        console.warn(`Error processing table ${table}:`, err && err.message ? err.message : err)
      }
    }

    // Ensure `deleted_reason` column exists where models expect it
    for (const table of TABLES_WITH_DELETED_REASON) {
      try {
        const desc = await qi.describeTable(table).catch(() => null)
        if (!desc) {
          console.log(`Table ${table} not found, skipping deleted_reason check.`)
          continue
        }

        const hasDeletedReason = Object.prototype.hasOwnProperty.call(desc, 'deleted_reason')
          || Object.prototype.hasOwnProperty.call(desc, 'deletedReason')

        if (!hasDeletedReason) {
          console.log(`Adding deleted_reason column to ${table}`)
          await qi.addColumn(table, 'deleted_reason', {
            type: DataTypes.TEXT,
            allowNull: true,
          })
          console.log(`Added deleted_reason to ${table}`)
        } else {
          console.log(`Table ${table} already has deleted_reason, skipping.`)
        }
      } catch (err: any) {
        console.warn(`Error processing deleted_reason for table ${table}:`, err && err.message ? err.message : err)
      }
    }

    // Ensure other specific columns exist (e.g. notifications.target_user_id)
    for (const [table, cols] of Object.entries(TABLES_WITH_COLUMNS)) {
      for (const col of cols) {
        try {
          const desc = await qi.describeTable(table).catch(() => null)
          if (!desc) {
            console.log(`Table ${table} not found, skipping column ${col.name} check.`)
            continue
          }

          const hasCol = Object.prototype.hasOwnProperty.call(desc, col.name)

          if (!hasCol) {
            console.log(`Adding column ${col.name} to ${table}`)
            await qi.addColumn(table, col.name, col.definition)
            console.log(`Added ${col.name} to ${table}`)
          } else {
            console.log(`Table ${table} already has column ${col.name}, skipping.`)
          }
        } catch (err: any) {
          console.warn(`Error processing column ${col.name} for table ${table}:`, err && err.message ? err.message : err)
        }
      }
    }

    // Ensure `ticket_history.type` exists, set existing rows to 'SMS', and make column NOT NULL
    try {
      const thDesc = await qi.describeTable('ticket_history').catch(() => null)
      if (!thDesc) {
        console.log('Table ticket_history not found, skipping ticket_history.type check.')
      } else {
        const hasType = Object.prototype.hasOwnProperty.call(thDesc, 'type')
        if (!hasType) {
          console.log('Adding column type to ticket_history (temporary nullable)')
          await qi.addColumn('ticket_history', 'type', { type: DataTypes.TEXT('long'), allowNull: true, defaultValue: 'SMS' })
          console.log('Updated existing ticket_history rows to type = "SMS" where missing')
          await (sequelize as any).query(`UPDATE \`ticket_history\` SET \`type\` = 'SMS' WHERE \`type\` IS NULL OR \`type\` = ''`)
          console.log('Making ticket_history.type NOT NULL')
          await qi.changeColumn('ticket_history', 'type', { type: DataTypes.TEXT('long'), allowNull: false })
        } else {
          console.log('ticket_history.type already exists, skipping.')
        }
      }
    } catch (err: any) {
      console.warn('Error ensuring ticket_history.type:', err && err.message ? err.message : err)
    }

    // Ensure createdAt/updatedAt timestamps exist on every table in the DB
    try {
      const rawTables = await qi.showAllTables().catch(() => [])
      const knownTables = Array.from(
        new Set([
          ...TABLES,
          ...TABLES_WITH_DELETED_REASON,
          ...Object.keys(TABLES_WITH_COLUMNS),
          ...Object.keys(TABLES_TO_CREATE),
        ]),
      )

      const normalizedRaw = (rawTables || []).map((t: any) => {
        if (!t) return ''
        if (typeof t === 'string') return t
        if (typeof t === 'object' && (t.tableName || t.name)) return (t.tableName || t.name)
        return String(t)
      }).filter(Boolean)

      const allTables = Array.from(new Set([...normalizedRaw, ...knownTables]))

      for (const table of allTables) {
        try {
          const desc = await qi.describeTable(table).catch(() => null)
          if (!desc) {
            // table missing — will be handled by create-tables flow if requested
            continue
          }

          // createdAt
          if (!Object.prototype.hasOwnProperty.call(desc, 'createdAt')) {
            console.log(`Adding createdAt to ${table}`)
            await qi.addColumn(table, 'createdAt', { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW })
            await (sequelize as any).query(`UPDATE \`${table}\` SET \`createdAt\` = NOW() WHERE \`createdAt\` IS NULL`)
            try {
              await qi.changeColumn(table, 'createdAt', { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW })
            } catch {
              // best-effort: if changeColumn fails, leave as nullable
            }
            console.log(`Ensured createdAt exists on ${table}`)
          }

          // updatedAt
          if (!Object.prototype.hasOwnProperty.call(desc, 'updatedAt')) {
            console.log(`Adding updatedAt to ${table}`)
            await qi.addColumn(table, 'updatedAt', { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW })
            await (sequelize as any).query(`UPDATE \`${table}\` SET \`updatedAt\` = NOW() WHERE \`updatedAt\` IS NULL`)
            try {
              await qi.changeColumn(table, 'updatedAt', { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW })
            } catch {
              // best-effort
            }
            console.log(`Ensured updatedAt exists on ${table}`)
          }
        } catch (innerErr: any) {
          console.warn(`Error ensuring timestamps for table ${table}:`, innerErr && innerErr.message ? innerErr.message : innerErr)
        }
      }
    } catch (err: any) {
      console.warn('Error while ensuring createdAt/updatedAt on tables:', err && err.message ? err.message : err)
    }

    // Explicitly create missing tables when requested (provides a fallback if sequelize.sync didn't create them)

    if (doCreateTables) {
      for (const [table, cols] of Object.entries(TABLES_TO_CREATE)) {
        try {
          const desc = await qi.describeTable(table).catch(() => null)
          if (!desc) {
            console.log(`Table ${table} missing — creating explicitly via QueryInterface.createTable`)
            await qi.createTable(table, cols)
            console.log(`Created table ${table}`)
          } else {
            console.log(`Table ${table} already exists, skipping create.`)
          }
        } catch (err: any) {
          console.warn(`Error creating table ${table}:`, err && err.message ? err.message : err)
        }
      }
    }

    // Convert integer timestamp columns to DATETIME when requested.
    if (doConvertTimes) {
      // Build set of tables to inspect (include all DB tables so none are missed)
      const rawTables = await qi.showAllTables().catch(() => [])
      const normalizedRaw = (rawTables || []).map((t: any) => {
        if (!t) return ''
        if (typeof t === 'string') return t
        if (typeof t === 'object' && (t.tableName || t.name)) return (t.tableName || t.name)
        return String(t)
      }).filter(Boolean)

      const tablesToInspect = Array.from(
        new Set([
          ...normalizedRaw,
          ...TABLES,
          ...TABLES_WITH_DELETED_REASON,
          ...Object.keys(TABLES_WITH_COLUMNS),
          ...Object.keys(TABLES_TO_CREATE),
        ]),
      )

      const timeNameRegex = /(at$|_at$|Date$|date$|Time$|time$|expires|Expires)/i

      for (const table of tablesToInspect) {
        try {
          const desc = await qi.describeTable(table).catch(() => null)
          if (!desc) continue

          for (const col of Object.keys(desc)) {
            const colMeta = desc[col]
            if (!colMeta) continue
            const typeStr = String(colMeta.type || '')
            // Only consider integer-like columns with time-like names
            if (!/INT|BIGINT|INTEGER/.test(typeStr)) continue
            if (!timeNameRegex.test(col)) continue

            const tmpCol = `${col}_dt_tmp`
            if (Object.prototype.hasOwnProperty.call(desc, tmpCol)) {
              console.log(`Temporary column ${tmpCol} already exists on ${table}, skipping.`)
              continue
            }

            console.log(`Converting ${table}.${col} (integer) -> DATETIME`)
            try {
              await qi.addColumn(table, tmpCol, { type: DataTypes.DATE, allowNull: true })

              // determine whether values are seconds or milliseconds
              const [[{ m }]] = await (sequelize as any).query(
                `SELECT MAX(\`${col}\`) as m FROM \`${table}\``,
              )
              const maxVal = m || 0
              const divisor = Number(maxVal) > 1e12 ? 1000 : 1

              await (sequelize as any).query(
                `UPDATE \`${table}\` SET \`${tmpCol}\` = FROM_UNIXTIME(\`${col}\`/${divisor})`,
              )

              // drop old integer column and rename tmp to original name
              await qi.removeColumn(table, col).catch(() => null)
              await qi.renameColumn(table, tmpCol, col)
              console.log(`Converted ${table}.${col} to DATETIME`)
            } catch (innerErr: any) {
              console.warn(`Failed converting ${table}.${col}:`, innerErr && innerErr.message ? innerErr.message : innerErr)
            }
          }
        } catch (err: any) {
          console.warn(`Error inspecting table ${table} for time conversion:`, err && err.message ? err.message : err)
        }
      }
    }

    
    if (doCreateTables) {
      try {
        console.log('Creating/updating missing tables via sequelize.sync({ alter: true })...')
        // Use alter to bring DB schema in line with models without dropping data
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await (sequelize as any).sync({ force: false, alter: true })
        console.log('sequelize.sync complete')
      } catch (syncErr: any) {
        console.error('Failed to run sequelize.sync:', syncErr && syncErr.message ? syncErr.message : syncErr)
      }
    }

    console.log('Done')
    process.exit(0)
  } catch (err: any) {
    console.error('Failed to add deletedAt:', err && err.message ? err.message : err)
    process.exit(1)
  }
}

run()



// manual query
// ALTER TABLE inventory_item_location
// ADD COLUMN address LONGTEXT;

// ALTER TABLE ticket_history
// ADD COLUMN type LONGTEXT NOT NULL;
// UPDATE ticket_history
// SET type = 'SMS';