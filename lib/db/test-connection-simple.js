const { Client } = require('pg');
const { ensureEnv } = require('../../lib/env');

ensureEnv();

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT version()');
    console.log('📊 Database version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    // List tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (tables.rows.length > 0) {
      console.log('\n📋 Existing tables:');
      tables.rows.forEach(row => {
        console.log('  -', row.table_name);
      });
    } else {
      console.log('\n📋 No tables found. Database is empty.');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    return false;
  } finally {
    await client.end();
  }
}

testConnection();

