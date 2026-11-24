import sequelize from "../config/database";
import { DataTypes } from "sequelize";

async function addActionTypesSchema() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB successfully.');

    const queryInterface = sequelize.getQueryInterface();

    // 1. Create action_types table if it doesn't exist
    try {
      console.log('Creating action_types table if not exists...');
      await queryInterface.createTable('action_types', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        application_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'applications',
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
        }
      });
      console.log('Successfully created action_types table.');
    } catch (err: any) {
      if (err.message && (err.message.includes('already exists') || err.message.includes('Duplicate table'))) {
        console.log('Table action_types already exists.');
      } else {
        console.warn('Failed to create action_types table:', err.message || err);
      }
    }

    // 2. Add action_types column to tickets table if not exists
    try {
      console.log('Adding action_types column to tickets table if not exists...');
      await queryInterface.addColumn('tickets', 'action_types', {
        type: DataTypes.JSON,
        allowNull: true,
      });
      console.log('Successfully added action_types column to tickets table.');
    } catch (err: any) {
      if (err.message && (err.message.includes('Duplicate column name') || err.message.includes('already exists'))) {
        console.log('Column action_types already exists on tickets table.');
      } else {
        console.warn('Failed to add column action_types:', err.message || err);
      }
    }

    console.log('Database migration tasks completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Database migration failed due to connection error:', err);
    process.exit(1);
  }
}

addActionTypesSchema();
