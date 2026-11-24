import { QueryInterface, DataTypes } from 'sequelize'

export async function up(queryInterface: QueryInterface) {
  // 1. Add status column to canned_reply
  const tableDesc = await queryInterface.describeTable('canned_reply')

  if (!tableDesc['status']) {
    await queryInterface.addColumn('canned_reply', 'status', {
      type: DataTypes.ENUM('pending', 'approved'),
      allowNull: false,
      defaultValue: 'pending',
    })
    console.log('Added: canned_reply.status')
  }

  if (!tableDesc['verification_count']) {
    await queryInterface.addColumn('canned_reply', 'verification_count', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    })
    console.log('Added: canned_reply.verification_count')
  }

  // 2. Create canned_reply_verification table
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
  })

  await queryInterface.addIndex('canned_reply_verification', ['canned_reply_id', 'user_id'], {
    unique: true,
    name: 'uq_canned_reply_verification_user',
  })

  console.log('Created: canned_reply_verification table')
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('canned_reply_verification')
  await queryInterface.removeColumn('canned_reply', 'verification_count')
  await queryInterface.removeColumn('canned_reply', 'status')
  console.log('Rolled back: canned reply verification migration')
}
