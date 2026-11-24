import sequelize from "../config/database";
import { DataTypes } from "sequelize";

async function migrateTicketReadAt() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const queryInterface = sequelize.getQueryInterface();

    // 1. Add read_at column to tickets if it doesn't exist
    try {
      await queryInterface.addColumn('tickets', 'read_at', {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      });
      console.log('Added read_at column to tickets table.');
    } catch (err: any) {
      if (err.message?.includes('Duplicate column')) {
        console.log('Column read_at already exists on tickets, skipping.');
      } else {
        console.warn('Failed to add read_at column:', err.message || err);
      }
    }

    // 2. Drop ticket_reads table if it exists
    try {
      await queryInterface.dropTable('ticket_reads');
      console.log('Dropped ticket_reads table.');
    } catch (err: any) {
      if (err.message?.includes("Unknown table") || err.message?.includes("doesn't exist")) {
        console.log('Table ticket_reads does not exist, skipping.');
      } else {
        console.warn('Failed to drop ticket_reads:', err.message || err);
      }
    }

    // 3. Mark all existing tickets as read except the 5 most recent
    await sequelize.query(`
      UPDATE tickets
      SET read_at = createdAt
      WHERE read_at IS NULL
        AND id NOT IN (
          SELECT id FROM (SELECT id FROM tickets ORDER BY id DESC LIMIT 5) AS recent
        )
    `);
    console.log('Marked existing tickets as read (kept last 5 as new).');

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('DB connection failed', err);
    process.exit(1);
  }
}

migrateTicketReadAt();
