require('dotenv').config({ path: '.env' });
const { connect } = require('@tidbcloud/serverless');

async function checkTable() {
  try {
    const db = connect({ url: process.env.CACHE_DATABASE_URL });
    
    console.log('Connecting to TiDB and checking tables...');
    
    const tables = await db.execute(`SHOW TABLES`);
    console.log('Tables in sys:', tables);
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

checkTable();
