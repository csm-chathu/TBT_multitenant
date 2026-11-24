import sequelize from "../config/database";

async function addNotificationTimestamps() {
  const queries = [
    `ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
  ];

  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    for (const q of queries) {
      try {
        await sequelize.query(q);
        console.log('Executed:', q);
      } catch (err: any) {
        console.warn('Query failed:', q, '\n', err.message || err);
      }
    }

    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('DB connection failed', err);
    process.exit(1);
  }
}

addNotificationTimestamps();
