import sequelize from "../config/database";
import { DataTypes } from "sequelize";

async function createZendeskWebhookLogsTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database successfully.');

    const queryInterface = sequelize.getQueryInterface();

    try {
      await queryInterface.createTable('zendesk_webhook_logs', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        zendesk_ticket_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        payload: {
          type: DataTypes.JSON,
          allowNull: false,
        },
        created_ticket_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
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
      console.log('Created: zendesk_webhook_logs table');
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        console.log('Skipped: zendesk_webhook_logs table already exists');
      } else {
        throw err;
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

createZendeskWebhookLogsTable();
