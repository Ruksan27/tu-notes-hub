require('dotenv').config({ path: '.env' });
const { connect } = require('@tidbcloud/serverless');

async function createTable() {
  try {
    const db = connect({ url: process.env.CACHE_DATABASE_URL });
    
    console.log('Connecting to TiDB and creating table...');
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ai_answers_cache (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_hash VARCHAR(64) NOT NULL UNIQUE,
        question_text TEXT NOT NULL,
        answer TEXT NOT NULL,
        hit_count INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_hash (question_hash)
      )
    `);
    
    console.log('✅ Table ai_answers_cache created successfully!');
  } catch (error) {
    console.error('❌ Error creating table:');
    console.error(error);
  }
}

createTable();
