import { query } from '../lib/db/index';

async function main() {
  console.log('Setting all categories and product types to active and visible...\n');
  
  // 1. Update categories
  const catResult = await query(`
    UPDATE categories 
    SET status = 'active', visible = true
  `);
  console.log(`✓ Updated ${catResult.rowCount} categories to active and visible`);
  
  // 2. Update product types
  const typeResult = await query(`
    UPDATE product_types 
    SET status = 'active', visible = true
  `);
  console.log(`✓ Updated ${typeResult.rowCount} product types to active and visible`);
  
  // 3. Verify categories
  const { rows: cats } = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
      COUNT(CASE WHEN visible = true THEN 1 END) as visible
    FROM categories
  `);
  
  console.log('\n📊 Categories:');
  console.log(`   Total: ${cats[0].total}`);
  console.log(`   Active: ${cats[0].active}`);
  console.log(`   Visible: ${cats[0].visible}`);
  
  // 4. Verify product types
  const { rows: types } = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
      COUNT(CASE WHEN visible = true THEN 1 END) as visible
    FROM product_types
  `);
  
  console.log('\n📦 Product Types:');
  console.log(`   Total: ${types[0].total}`);
  console.log(`   Active: ${types[0].active}`);
  console.log(`   Visible: ${types[0].visible}`);
  
  console.log('\n✅ All categories and product types are now active and visible!');
}

main().catch(console.error).finally(() => process.exit(0));

