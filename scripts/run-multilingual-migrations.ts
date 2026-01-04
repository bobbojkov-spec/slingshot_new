import { query } from '../lib/db/index';
import fs from 'fs';
import path from 'path';

async function runMigration(filePath: string, phaseName: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 Running ${phaseName}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Remove comments and split by semicolon
  const statements = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.toLowerCase().startsWith('commit'));
  
  for (const statement of statements) {
    try {
      if (statement.toLowerCase().startsWith('select')) {
        // Show report/verification queries
        const result = await query(statement);
        if (result.rows.length > 0) {
          console.log('\n📊 Results:');
          console.table(result.rows);
        }
      } else {
        // Execute DDL/DML statements
        await query(statement);
        console.log('✓ Executed statement');
      }
    } catch (error: any) {
      // Skip verification queries if tables don't exist yet
      if (error.code === '42P01' && statement.toLowerCase().startsWith('select')) {
        console.log('⏭️  Skipping verification query (tables not created yet)');
      } else {
        throw error;
      }
    }
  }
  
  console.log(`\n✅ ${phaseName} completed successfully!\n`);
}

async function main() {
  const docsDir = path.join(__dirname, '..', 'docs');
  
  try {
    // Phase 1: Create translation tables
    await runMigration(
      path.join(docsDir, 'sql-migrations-multilingual-01-create-tables.sql'),
      'PHASE 1: Create Translation Tables'
    );
    
    // Phase 2: Backfill English
    await runMigration(
      path.join(docsDir, 'sql-migrations-multilingual-02-backfill-english.sql'),
      'PHASE 2: Backfill English Translations'
    );
    
    // Phase 3: Initialize Bulgarian
    await runMigration(
      path.join(docsDir, 'sql-migrations-multilingual-03-initialize-bulgarian.sql'),
      'PHASE 3: Initialize Bulgarian Translations'
    );
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(80) + '\n');
    
    // Final summary
    const summary = await query(`
      SELECT 
        'Products' as entity,
        COUNT(CASE WHEN language_code = 'en' THEN 1 END) as english,
        COUNT(CASE WHEN language_code = 'bg' THEN 1 END) as bulgarian
      FROM product_translations
      UNION ALL
      SELECT 
        'Categories',
        COUNT(CASE WHEN language_code = 'en' THEN 1 END),
        COUNT(CASE WHEN language_code = 'bg' THEN 1 END)
      FROM category_translations
      UNION ALL
      SELECT 
        'Variants',
        COUNT(CASE WHEN language_code = 'en' THEN 1 END),
        COUNT(CASE WHEN language_code = 'bg' THEN 1 END)
      FROM product_variant_translations
      UNION ALL
      SELECT 
        'Product Types',
        COUNT(CASE WHEN language_code = 'en' THEN 1 END),
        COUNT(CASE WHEN language_code = 'bg' THEN 1 END)
      FROM product_type_translations
    `);
    
    console.log('📊 FINAL TRANSLATION COVERAGE:');
    console.table(summary.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main().catch(console.error).finally(() => process.exit(0));

