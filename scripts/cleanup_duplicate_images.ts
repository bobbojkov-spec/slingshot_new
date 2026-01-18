
import { query } from '../lib/db';

async function main() {
    console.log('Starting duplicate image cleanup...');

    try {
        // 1. Get all images
        const allImagesRes = await query(`
            SELECT id, product_id, size, storage_path, display_order 
            FROM product_images_railway
            ORDER BY product_id, size, display_order
        `, []);

        const allImages = allImagesRes.rows;
        console.log(`Found ${allImages.length} total images.`);

        const imagesToDelete: string[] = [];

        // Group by product and size
        const grouped: Record<string, typeof allImages> = {};

        for (const img of allImages) {
            const key = `${img.product_id}:${img.size}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(img);
        }

        // Analyze each group
        for (const [key, images] of Object.entries(grouped)) {
            // Map of "index" -> imageId to keep
            // We assume the filename ends with "-{index}.jpg" or similar
            const seenIndices = new Set<string>();

            // Sort images by ID (roughly creation time) or extraction from path timestamp?
            // Paths look like: .../1767637244223-01.jpg
            // Let's sort by the timestamp in the filename to be deterministic.
            // If we cant parse, we fall back to DB id.

            images.sort((a, b) => {
                const getTs = (path: string) => {
                    const match = path.match(/\/(\d+)-(\d+)\.(jpg|jpeg|png|webp)$/);
                    return match ? parseInt(match[1]) : 0;
                };
                return getTs(a.storage_path) - getTs(b.storage_path);
            });

            const uniqueImages = [];

            for (const img of images) {
                // Extract unique index from filename (e.g. "01" from "...-01.jpg")
                // file name format: {timestamp}-{index}.{ext}
                const match = img.storage_path.match(/-(\d+)\.(jpg|jpeg|png|webp)$/);

                if (match) {
                    const index = match[1]; // "01", "02", etc.

                    if (seenIndices.has(index)) {
                        // Duplicate!
                        imagesToDelete.push(img.id);
                    } else {
                        seenIndices.add(index);
                        uniqueImages.push(img);
                    }
                } else {
                    // unexpected format, keep it to be safe (or maybe log warning)
                    // if multiple unparseable, we might duplicates, but safer to skip deletion.
                    console.warn(`Skipping unparseable path: ${img.storage_path}`);
                    uniqueImages.push(img);
                }
            }
        }

        console.log(`Found ${imagesToDelete.length} duplicates to delete.`);

        if (imagesToDelete.length > 0) {
            // Batch delete
            // Postgres limit for parameters is 65535, so batching might be needed if HUGE.
            // But let's do chunks of 1000.

            const chunkSize = 1000;
            for (let i = 0; i < imagesToDelete.length; i += chunkSize) {
                const chunk = imagesToDelete.slice(i, i + chunkSize);
                await query(`
                    DELETE FROM product_images_railway 
                    WHERE id = ANY($1)
                `, [chunk]);
                console.log(`Deleted chunk ${i / chunkSize + 1}`);
            }

            console.log('Cleanup complete.');
        } else {
            console.log('No duplicates found.');
        }

    } catch (e) {
        console.error('Error during cleanup:', e);
    }
}

main();
