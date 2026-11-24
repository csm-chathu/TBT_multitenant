import sequelize from "../config/database";
import { DataTypes } from "sequelize";

async function createNotesTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database successfully.');

    const queryInterface = sequelize.getQueryInterface();

    try {
      await queryInterface.createTable('notes', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false,
          defaultValue: 'Untitled',
        },
        content: {
          type: DataTypes.TEXT('long'),
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
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      });
      console.log('Successfully created notes table.');

      // Add indexes for quick lookups
      try {
        await queryInterface.addIndex('notes', ['user_id'], {
          name: 'idx_notes_user_id',
        });
        console.log('Added index on user_id.');
      } catch (idxErr: any) {
        console.log('Index user_id may already exist:', idxErr.message || idxErr);
      }

      try {
        await queryInterface.addIndex('notes', ['updatedAt'], {
          name: 'idx_notes_updated_at',
        });
        console.log('Added index on updatedAt.');
      } catch (idxErr: any) {
        console.log('Index updatedAt may already exist:', idxErr.message || idxErr);
      }

    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        console.log('Table notes already exists.');
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

createNotesTable();
