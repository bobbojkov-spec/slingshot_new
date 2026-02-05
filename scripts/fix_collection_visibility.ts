import { Pool } from 'pg';
import dotenv from 'dotenv';
import { query } from '@/lib/db';

dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Standardizing Ride Engine collection metadata...');

    try {
        // 1. Update all 'Ride Engine EU' source to 'rideengine'
        const res1 = await query(`
            UPDATE collections 
            SET source = 'rideengine',
                visible = true
            WHERE source = 'Ride Engine EU'
        `);
        console.log(`Updated ${res1.rowCount} collections from 'Ride Engine EU' to 'rideengine' and set visible=true.`);

        // 2. Fix 'Travel, Duffle & Luggage' duplicates
        // We have one with handle 'travel-duffle-and-luggage' (invisible, source 'rideengine')
        // And one with 'travel-duffle-luggage' (visible, source 'Ride Engine EU', now 'rideengine')

        // Let's delete the one with 'travel-duffle-and-luggage' if it's invisible and we have the other one
        const delRes = await query(`
            DELETE FROM collections 
            WHERE handle = 'travel-duffle-and-luggage' AND visible = false
        `);
        console.log(`Deleted ${delRes.rowCount} invisible duplicate collection(s).`);

        // 3. Ensure all collections with 'rideengine' source are visible (if they were imported/approved)
        const res2 = await query(`
            UPDATE collections 
            SET visible = true 
            WHERE source = 'rideengine' AND visible = false AND handle IN (
                'backpacks', 'travel-duffle-luggage', 'gear-bags', 'mens-spring-suits',
                'mens-onsen-wetsuits', 'womens-onsen-wetsuits', 'womens-sensor-wetsuits',
                'roof-rack-accessories', 'harness-parts-and-accessories',
                'harness-hooks-and-accessories', 'hardgood-accessories',
                'boardshorts-and-changing-robes', 'sup-surf-parts-acc'
            )
        `);
        console.log(`Ensured visibility for ${res2.rowCount} approved collections.`);

    } catch (error) {
        console.error('Error standardizing collections:', error);
    }
}

main().catch(console.error);
