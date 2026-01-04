// Update image URLs in database after storage migration
// Replaces Supabase URLs with Railway storage URLs
// Usage: node scripts/migration/update-database-urls.js

const { Pool } = require('pg');
const { ensureEnv } = require('../../lib/env');

ensureEnv();

const databaseUrl = process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL;
const supabaseUrlBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
const railwayUrlBase = process.env.RAILWAY_STORAGE_PUBLIC_URL_BASE;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL or RAILWAY_DATABASE_URL');
  process.exit(1);
}

if (!supabaseUrlBase || !railwayUrlBase) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or RAILWAY_STORAGE_PUBLIC_URL_BASE');
  console.error('These are needed to identify and replace URLs');
  process.exit(1);
}

// Extract domain from Supabase URL
const supabaseDomain = supabaseUrlBase.replace('https://', '').replace('http://', '');
const railwayDomain = railwayUrlBase.replace('https://', '').replace('http://', '');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('railway') ? { rejectUnauthorized: false } : undefined,
});

async function updateUrls() {
  console.log('🔄 Updating image URLs in database...\n');
  console.log(`From: ${supabaseDomain}`);
  console.log(`To:   ${railwayDomain}\n`);

  const client = await pool.connect();

  try {
    // Find all tables with URL columns that might contain Supabase URLs
    const tables = [
      { table: 'product_images', column: 'url' },
      { table: 'products', column: 'seo_og_image_url' },
      { table: 'collections', column: 'hero_image_url' },
      { table: 'blog_posts', column: 'hero_image_url' },
    ];

    let totalUpdated = 0;

    for (const { table, column } of tables) {
      // Check if table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);

      if (!tableCheck.rows[0].exists) {
        console.log(`⚠️  Table ${table} does not exist, skipping`);
        continue;
      }

      // Check if column exists
      const columnCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = $2
        );
      `, [table, column]);

      if (!columnCheck.rows[0].exists) {
        console.log(`⚠️  Column ${table}.${column} does not exist, skipping`);
        continue;
      }

      // Count rows with Supabase URLs
      const countResult = await client.query(`
        SELECT COUNT(*) as count
        FROM ${table}
        WHERE ${column} LIKE $1
      `, [`%${supabaseDomain}%`]);

      const count = parseInt(countResult.rows[0].count);

      if (count === 0) {
        console.log(`✓ ${table}.${column}: No Supabase URLs found`);
        continue;
      }

      console.log(`\n📝 Updating ${table}.${column}...`);
      console.log(`   Found ${count} rows with Supabase URLs`);

      // Update URLs
      const updateResult = await client.query(`
        UPDATE ${table}
        SET ${column} = REPLACE(${column}, $1, $2)
        WHERE ${column} LIKE $3
      `, [
        `https://${supabaseDomain}`,
        `https://${railwayDomain}`,
        `%${supabaseDomain}%`
      ]);

      const updated = updateResult.rowCount;
      totalUpdated += updated;
      console.log(`   ✅ Updated ${updated} rows`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ URL update complete!`);
    console.log(`   Total rows updated: ${totalUpdated}`);
    console.log(`${'='.repeat(60)}\n`);

    if (totalUpdated > 0) {
      console.log('Next steps:');
      console.log('1. Verify URLs are correct in the database');
      console.log('2. Test the application');
      console.log('3. Check that images load correctly\n');
    }

  } catch (error) {
    console.error('❌ Error updating URLs:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateUrls().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

