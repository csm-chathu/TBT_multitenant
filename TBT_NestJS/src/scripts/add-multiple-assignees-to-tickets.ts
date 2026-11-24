import sequelize from "../config/database";
import { DataTypes } from "sequelize";

async function addMultipleAssigneesToTickets() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const queryInterface = sequelize.getQueryInterface();

    try {
      await queryInterface.addColumn('tickets', 'multiple_assignees', {
        type: DataTypes.JSON,
        allowNull: true,
      });
      console.log('Successfully added multiple_assignees column to tickets table.');
    } catch (err: any) {
      if (err.message && (err.message.includes('Duplicate column name') || err.message.includes('already exists'))) {
        console.log('Column multiple_assignees already exists on tickets table.');
      } else {
        console.warn('Failed to add column:', err.message || err);
      }
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('DB connection failed', err);
    process.exit(1);
  }
}

addMultipleAssigneesToTickets();
