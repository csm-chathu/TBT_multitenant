import sequelize from "../config/database";
import { DataTypes } from "sequelize";

async function createCannedReplyTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database successfully.');

    const queryInterface = sequelize.getQueryInterface();

    try {
      await queryInterface.createTable('canned_reply', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        text: {
          type: DataTypes.TEXT,
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
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      });
      console.log('Successfully created canned_reply table.');

      try {
        await queryInterface.addIndex('canned_reply', ['application_id'], {
          name: 'idx_canned_reply_application_id',
        });
        console.log('Added index on application_id.');
      } catch (idxErr: any) {
        console.log('Index application_id may already exist:', idxErr.message || idxErr);
      }

    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        console.log('Table canned_reply already exists.');
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

createCannedReplyTable();
