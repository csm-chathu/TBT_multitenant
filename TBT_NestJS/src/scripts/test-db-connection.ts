import { sequelize } from '../config/database';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Database config:', {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      dialect: process.env.DB_DIALECT,
    });
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test if we can query the database
    const [results] = await sequelize.query('SELECT 1 as test');
    console.log('✅ Database query test successful:', results);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure your MySQL server is running');
    console.log('2. Check your .env file has correct database credentials');
    console.log('3. Verify the database exists');
    console.log('4. Check if the user has proper permissions');
    process.exit(1);
  }
}

testConnection();

