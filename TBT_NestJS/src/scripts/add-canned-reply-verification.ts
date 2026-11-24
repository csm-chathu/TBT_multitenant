import sequelize from "../config/database";
import { DataTypes } from "sequelize";

async function addCannedReplyVerification() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database successfully.');

    const queryInterface = sequelize.getQueryInterface();

    // 1. Add status column to canned_reply
    const tableDesc = await queryInterface.describeTable('canned_reply');

    if (!tableDesc['status']) {
      await queryInterface.addColumn('canned_reply', 'status', {
        type: DataTypes.ENUM('pending', 'approved'),
        allowNull: false,
        defaultValue: 'pending',
      });
      console.log('Added: canned_reply.status');
    } else {
      console.log('Skipped: canned_reply.status already exists');
    }

    // 2. Add verification_count column to canned_reply
    if (!tableDesc['verification_count']) {
      await queryInterface.addColumn('canned_reply', 'verification_count', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
      console.log('Added: canned_reply.verification_count');
    } else {
      console.log('Skipped: canned_reply.verification_count already exists');
    }

    // 3. Create canned_reply_verification table
    try {
      await queryInterface.createTable('canned_reply_verification', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        canned_reply_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'canned_reply', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      });
      console.log('Created: canned_reply_verification table');
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        console.log('Skipped: canned_reply_verification table already exists');
      } else {
        throw err;
      }
    }

    // 4. Add unique index
    try {
      await queryInterface.addIndex('canned_reply_verification', ['canned_reply_id', 'user_id'], {
        unique: true,
        name: 'uq_canned_reply_verification_user',
      });
      console.log('Added: unique index uq_canned_reply_verification_user');
    } catch (err: any) {
      if (err.message && (err.message.includes('already exists') || err.message.includes('Duplicate'))) {
        console.log('Skipped: index uq_canned_reply_verification_user already exists');
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

addCannedReplyVerification();
