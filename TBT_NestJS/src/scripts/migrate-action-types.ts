import sequelize from '../config/database';
import { initTicket } from '../models/ticket';

async function migrateActionTypes() {
  console.log('Starting data migration for indicatorType -> action_types...');
  
  const Ticket = initTicket(sequelize);

  try {
    // Fetch and process in batches to avoid OOM in production
    const batchSize = 100;
    let offset = 0;
    let hasMore = true;
    let migratedCount = 0;

    while (hasMore) {
      const tickets = await Ticket.findAll({ limit: batchSize, offset });
      if (tickets.length === 0) {
        hasMore = false;
        break;
      }

      for (const ticket of tickets) {
        let updated = false;

        // Helper to migrate a JSON column
        const migrateColumn = (colName: 'data' | 'additinal_data' | 'serialNo') => {
          if (ticket[colName]) {
            try {
              let parsed = typeof ticket[colName] === 'string' ? JSON.parse(ticket[colName] as string) : ticket[colName];
              if (parsed && Array.isArray(parsed.indicatorType)) {
                if (!ticket.action_types) {
                  ticket.action_types = parsed.indicatorType;
                }
                delete parsed.indicatorType;
                ticket[colName] = JSON.stringify(parsed);
                updated = true;
              }
            } catch (err) {
              // Ignore parse errors
            }
          }
        };

        migrateColumn('data');
        migrateColumn('additinal_data');
        migrateColumn('serialNo');

        if (updated) {
          await ticket.save();
          migratedCount++;
          console.log(`Migrated ticket ID: ${ticket.id}`);
        }
      }
      
      offset += batchSize;
    }

    console.log(`Migration completed successfully. Total tickets migrated: ${migratedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateActionTypes();
