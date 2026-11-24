import { sequelize } from '../models'
import { DataTypes } from 'sequelize'

const TABLES = ['inventory_item', 'inventory_item_brand', 'inventory_item_category', 'inventory_item_location' ]

async function run() {
  try {
    const qi = (sequelize as any).getQueryInterface()
    for (const table of TABLES) {
      try {
        const desc = await qi.describeTable(table).catch(() => null)
        if (!desc) {
          console.log(`Table ${table} not found, skipping.`)
          continue
        }
        // Check common name variants for soft-delete column
        const hasDeletedAt = Object.prototype.hasOwnProperty.call(desc, 'deletedAt') || Object.prototype.hasOwnProperty.call(desc, 'deleted_at') || Object.prototype.hasOwnProperty.call(desc, 'deleted_at')
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
    console.log('Done')
    process.exit(0)
  } catch (err: any) {
    console.error('Failed to add deletedAt:', err && err.message ? err.message : err)
    process.exit(1)
  }
}

run()
