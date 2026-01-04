import { query } from '../lib/db/index';

async function main() {
  console.log('Creating product_types table...\\n');
  
  await query(`
    CREATE TABLE IF NOT EXISTS product_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      handle TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      visible BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✓ Created product_types table');
  
  await query('CREATE INDEX IF NOT EXISTS idx_product_types_status ON product_types(status)');
  await query('CREATE INDEX IF NOT EXISTS idx_product_types_visible ON product_types(visible)');
  await query('CREATE INDEX IF NOT EXISTS idx_product_types_slug ON product_types(slug)');
  console.log('✓ Added indexes');
  
  const { rows: existingTypes } = await query(`
    SELECT DISTINCT product_type
    FROM products 
    WHERE product_type IS NOT NULL AND product_type != ''
    ORDER BY product_type
  `);
  
  console.log(`\\n📊 Migrating ${existingTypes.length} product types...\\n`);
  
  for (const row of existingTypes) {
    const name = (row as any).product_type.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    try {
      await query(
        'INSERT INTO product_types (name, slug, handle, status, visible) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING',
        [name, slug, slug, 'active', true]
      );
      console.log(`  ✓ ${name}`);
    } catch (err: any) {
      console.log(`  ✗ ${name}`);
    }
  }
  
  const result = await query('SELECT COUNT(*) as count FROM product_types');
  console.log(`\\n✅ Successfully created ${result.rows[0].count} product types!`);
}

main().catch(console.error).finally(() => process.exit(0));

