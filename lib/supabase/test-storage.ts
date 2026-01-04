import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

// Create Supabase client directly in the test script
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function testStorageUpload() {
  try {
    console.log('🪣 Testing Supabase Storage upload...\n');

    // Check if we have the service role key
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key-here') {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not configured in .env.local');
      console.log('\nPlease add your Supabase keys to .env.local');
      return false;
    }

    // List existing buckets
    console.log('📋 Checking existing buckets...');
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return false;
    }

    console.log(`✅ Found ${buckets?.length || 0} buckets:`);
    buckets?.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    // Use 'slingshot-images-dev' bucket for public files
    const bucketName = 'slingshot-images-dev';
    const existingBucket = buckets?.find(b => b.name === bucketName);

    if (!existingBucket) {
      console.error(`❌ Bucket '${bucketName}' not found!`);
      return false;
    }

    console.log(`\n✅ Using existing bucket '${bucketName}' (public)`);

    // Try to upload a test image
    console.log('\n📤 Uploading test image...');
    const testImagePath = join(process.cwd(), 'public', 'products', 'duotone-evo.jpg');
    
    let fileBuffer: Buffer;
    try {
      fileBuffer = readFileSync(testImagePath);
      console.log(`✅ Found test image: ${testImagePath} (${(fileBuffer.length / 1024).toFixed(2)} KB)`);
    } catch (error) {
      console.error('❌ Could not read test image:', testImagePath);
      console.log('Trying alternative image...');
      
      // Try another image
      const altImagePath = join(process.cwd(), 'public', 'hero', 'hero-kitesurfer.jpg');
      try {
        fileBuffer = readFileSync(altImagePath);
        console.log(`✅ Found alternative image: ${altImagePath} (${(fileBuffer.length / 1024).toFixed(2)} KB)`);
      } catch (altError) {
        console.error('❌ Could not find any test images');
        return false;
      }
    }

    const fileName = `test-upload-${Date.now()}.jpg`;
    const filePath = `test/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      return false;
    }

    console.log(`✅ Image uploaded successfully!`);
    console.log(`   Path: ${uploadData.path}`);

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log(`\n🔗 Public URL:`);
    console.log(`   ${urlData.publicUrl}`);

    // List files in the bucket
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(bucketName)
      .list('test', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (!listError && files) {
      console.log(`\n📁 Files in 'test/' folder: ${files.length}`);
      files.slice(0, 5).forEach(file => {
        const size = file.metadata?.size ? (file.metadata.size / 1024).toFixed(2) : 'unknown';
        console.log(`  - ${file.name} (${size} KB)`);
      });
    }

    console.log(`\n💡 Note: Use 'slingshot-images-dev' for all public files`);
    console.log(`   Use 'slingshot-raw' only for admin/private files`);

    return true;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

testStorageUpload();

