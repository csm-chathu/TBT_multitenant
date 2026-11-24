import sequelize from "../config/database";
import { DataTypes } from "sequelize";

async function createTicketUpdateQueueTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database successfully.');

    const queryInterface = sequelize.getQueryInterface();

    try {
      await queryInterface.createTable('ticket_update_queue', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        ticket_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'tickets',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        event_type: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        status: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        priority: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'medium',
        },
        payload: {
          type: DataTypes.TEXT('long'),
          allowNull: true,
        },
        error_message: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        processed_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        created_by: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      });
      console.log('Successfully created ticket_update_queue table.');

      // Add indexes for high-performance dashboard queue querying
      try {
        await queryInterface.addIndex('ticket_update_queue', ['status', 'createdAt'], {
          name: 'idx_ticket_update_queue_status_created',
        });
        console.log('Added index on (status, createdAt).');
      } catch {}

      try {
        await queryInterface.addIndex('ticket_update_queue', ['ticket_id'], {
          name: 'idx_ticket_update_queue_ticket_id',
        });
        console.log('Added index on (ticket_id).');
      } catch {}

    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        console.log('Table ticket_update_queue already exists, changing status column to BOOLEAN...');
        try {
          // Alter status column to TINYINT(1) / BOOLEAN
          await sequelize.query('ALTER TABLE `ticket_update_queue` MODIFY COLUMN `status` TINYINT(1) NOT NULL DEFAULT 0;');
          // Update existing string values 'pending' -> 0, 'completed' -> 1
          await sequelize.query("UPDATE `ticket_update_queue` SET `status` = 0 WHERE `status` = 'pending' OR `status` = '0';");
          await sequelize.query("UPDATE `ticket_update_queue` SET `status` = 1 WHERE `status` = 'completed' OR `status` = '1';");
          console.log('Successfully updated status column to BOOLEAN (0/1 / false/true).');
        } catch (alterErr: any) {
          console.warn('Column alter notice:', alterErr.message || alterErr);
        }
      } else {
        console.warn('Notice during table creation:', err.message || err);
      }
    }

    console.log('Database script execution completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Database connection / migration failed:', err);
    process.exit(1);
  }
}

createTicketUpdateQueueTable();
