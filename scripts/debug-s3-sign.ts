import { getPresignedUrl } from '../lib/railway/storage';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkSign() {
    const testPath = 'slingshotnewimages-hw-tht/product-images/03eaa3ea-c48e-4551-a13d-c850d70dfabc/cf609f0a-2400-4c90-b6c4-6b563073f7e8/big/1767911422360-01.jpg';
    // Note: The path above seems to INCLUDE the bucket name in the URL provided by user?
    // User URL: https://storage.railway.app/slingshotnewimages-hw-tht/product-images/...
    // Storage Path in DB usually: product-images/...

    // Checking typical path
    const dbPath = 'product-images/03eaa3ea-c48e-4551-a13d-c850d70dfabc/cf609f0a-2400-4c90-b6c4-6b563073f7e8/big/1767911422360-01.jpg';

    try {
        const url = await getPresignedUrl(dbPath);
        console.log('--- Generated URL ---');
        console.log(url);

        if (url.includes('X-Amz-Signature')) {
            console.log('✅ Has Signature');
        } else {
            console.log('❌ NO Signature (Public access assumed?)');
        }
    } catch (err) {
        console.error('❌ Failed to sign:', err);
    } finally {
        process.exit(0);
    }
}
checkSign();
