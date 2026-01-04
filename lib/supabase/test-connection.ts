import { supabaseAdmin } from './server';

async function testSupabaseConnection() {
  try {
    console.log('🔌 Testing Supabase connection...\n');

    // Test 1: Check if we can connect
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, title, handle')
      .limit(5);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful!');
    console.log(`📊 Found ${products?.length || 0} products\n`);

    if (products && products.length > 0) {
      console.log('Sample products:');
      products.forEach((p: any) => {
        console.log(`  - ${p.title} (${p.handle})`);
      });
    }

    // Test 2: Check product_images table
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('product_images')
      .select('id, product_id, url')
      .limit(3);

    if (!imagesError && images) {
      console.log(`\n📸 Found ${images.length} product images`);
    }

    return true;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

testSupabaseConnection();

