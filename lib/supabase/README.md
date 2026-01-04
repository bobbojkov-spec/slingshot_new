# Supabase Storage Upload Test

## Setup

1. Add your Supabase API keys to `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL="https://uoueioxlyfplslxchqht.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   ```

2. Get your keys from: https://supabase.com/dashboard/project/uoueioxlyfplslxchqht/settings/api

## Test Storage Upload

Once keys are added, run:
```bash
npx tsx lib/supabase/test-storage.ts
```

This will:
- ✅ Check existing buckets
- ✅ Create a 'products' bucket if it doesn't exist
- ✅ Upload a test image
- ✅ Show the public URL
- ✅ List files in the bucket

## Usage in Code

```typescript
import { supabaseAdmin } from '@/lib/supabase/server';

// Upload an image
const { data, error } = await supabaseAdmin.storage
  .from('products')
  .upload('path/to/image.jpg', fileBuffer, {
    contentType: 'image/jpeg',
  });

// Get public URL
const { data: urlData } = supabaseAdmin.storage
  .from('products')
  .getPublicUrl('path/to/image.jpg');
```

