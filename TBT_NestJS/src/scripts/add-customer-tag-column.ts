import sequelize from "../config/database";
import { DataTypes } from "sequelize";

async function addCustomerTagColumn() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB successfully.');

    const queryInterface = sequelize.getQueryInterface();

    console.log('Adding tag column to customers table if not exists...');
    try {
      await queryInterface.addColumn('customers', 'tag', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      });
      console.log('Successfully added tag column to customers table.');
    } catch (err: any) {
      if (err.message && (err.message.includes('Duplicate column name') || err.message.includes('already exists'))) {
        console.log('Column tag already exists on customers table.');
      } else {
        console.warn('Failed to add column tag:', err.message || err);
      }
    }

    console.log('Database migration tasks completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Database migration failed due to connection error:', err);
    process.exit(1);
  }
}

addCustomerTagColumn();
