import sequelize from "../config/database";
import { DataTypes } from "sequelize";

async function createTicketInvoicesTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const queryInterface = sequelize.getQueryInterface();

    try {
      await queryInterface.createTable('ticket_invoices', {
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
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        items: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        extra_notes: {
          type: DataTypes.TEXT('long'),
          allowNull: true,
        },
        subtotal: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        tax_rate: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
        },
        tax_amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        total: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        attachments: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        }
      });
      console.log('Successfully created ticket_invoices table.');
    } catch (err: any) {
      if (err.message && (err.message.includes('already exists'))) {
        console.log('Table ticket_invoices already exists.');
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

createTicketInvoicesTable();
