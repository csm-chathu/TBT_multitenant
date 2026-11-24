import sequelize from "../config/database";
import { DataTypes } from "sequelize";

async function createTicketReadsTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const queryInterface = sequelize.getQueryInterface();

    try {
      await queryInterface.createTable('ticket_reads', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        ticket_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'tickets',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        user_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        read_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      });
      console.log('Successfully created ticket_reads table.');

      // Unique constraint — one read record per user per ticket
      await queryInterface.addIndex('ticket_reads', ['ticket_id', 'user_id'], {
        unique: true,
        name: 'ticket_reads_ticket_user_unique',
      });
      console.log('Added unique index on (ticket_id, user_id).');

    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        console.log('Table ticket_reads already exists, skipping.');
      } else {
        console.warn('Failed to create table:', err.message || err);
      }
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('DB connection failed', err);
    process.exit(1);
  }
}

createTicketReadsTable();
