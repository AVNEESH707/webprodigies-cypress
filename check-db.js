const postgres = require('postgres');
require('dotenv').config();

async function checkDatabase() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const sql = postgres(dbUrl);

    // Check each table
    const tables = ['users', 'products', 'prices', 'customers', 'subscriptions', 'collaborators', 'folders', 'files', 'workspaces'];
    
    console.log('Database Tables Status:\n');
    
    for (const table of tables) {
      try {
        const result = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
        console.log(`✓ ${table} - Ready (${result[0].count} rows)`);
      } catch (error) {
        console.log(`✗ ${table} - Error: ${error.message}`);
      }
    }
    
    await sql.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDatabase();
