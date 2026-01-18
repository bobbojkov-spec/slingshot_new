const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config({ path: '.env.local' });

const s3 = new S3Client({
    region: 'us-east-1',
    endpoint: process.env.RAILWAY_STORAGE_ENDPOINT || 'https://storage.railway.app',
    credentials: {
        accessKeyId: process.env.RAILWAY_STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
});

async function run() {
    // Key confirmed to exist by check-s3-keys.js
    const key = 'ride-engine/universe-helmet-v2/original/07_3232560_UNIVERSEHELMETV2_GREY_23X_02.jpg';
    const bucket = process.env.RAILWAY_STORAGE_BUCKET_PUBLIC || 'slingshotnewimages-hw-tht';

    console.log('--- SIGNED URL TEST ---');
    console.log('Bucket:', bucket);
    console.log('Key:', key);

    try {
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        console.log('\nGenerated Signed URL:');
        console.log(url);
        console.log('\nTry opening this in a browser (incognito) to verify visibility.');
    } catch (e) {
        console.error('Error generating signed URL:', e);
    }
}
run();
