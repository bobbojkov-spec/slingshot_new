const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const s3 = new S3Client({
    region: 'us-east-1',
    endpoint: process.env.RAILWAY_STORAGE_ENDPOINT || 'https://storage.railway.app',
    credentials: {
        accessKeyId: process.env.RAILWAY_STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY,
    },
    // forcePathStyle: true, // Try without first, match existing config
});

async function run() {
    const key = 'ride-engine/universe-helmet-v2/original/07_3232560_UNIVERSEHELMETV2_GREY_23X_02.jpg';
    const bucket = process.env.RAILWAY_STORAGE_BUCKET_PUBLIC || 'slingshotnewimages-hw-tht';
    console.log(`Downloading ${key} from ${bucket}...`);

    try {
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const response = await s3.send(command);

        const chunks = [];
        for await (const chunk of response.Body) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        console.log(`Successfully downloaded! Size: ${buffer.length} bytes`);
        fs.writeFileSync('download_test.jpg', buffer);
    } catch (e) {
        console.error('Download failed:', e);
    }
}
run();
