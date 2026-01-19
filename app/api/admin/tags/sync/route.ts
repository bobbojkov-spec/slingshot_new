
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
    try {
        console.log('Starting Tag Sync Migration...');

        // 1. Create table if not exists
        await query(`
            DROP TABLE IF EXISTS tags;
            CREATE TABLE IF NOT EXISTS tags (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name_en TEXT UNIQUE NOT NULL,
                name_bg TEXT,
                slug TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 2. Fetch all products with translations to extract unique pairs
        // We look for alignment in array indices between EN and BG tags
        const { rows: products } = await query(`
            SELECT 
                p.id,
                pt_en.tags as tags_en,
                pt_bg.tags as tags_bg
            FROM products p
            JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
            LEFT JOIN product_translations pt_bg ON p.id = pt_bg.product_id AND pt_bg.language_code = 'bg'
        `);

        const tagMap = new Map<string, string>(); // EN -> BG
        const allEnTags = new Set<string>();

        products.forEach((prod: any) => {
            const enTags: string[] = prod.tags_en || [];
            const bgTags: string[] = prod.tags_bg || [];

            enTags.forEach((tagEn, index) => {
                if (!tagEn) return;
                const trimmedEn = tagEn.trim();
                allEnTags.add(trimmedEn);

                const tagBg = bgTags[index];
                if (tagBg && tagBg.trim()) {
                    // Update map if not present, effectively grabbing first translation found
                    if (!tagMap.has(trimmedEn)) {
                        tagMap.set(trimmedEn, tagBg.trim());
                    }
                }
            });
        });

        console.log(`Found ${allEnTags.size} unique EN tags.`);

        let insertedCount = 0;
        let updatedCount = 0;

        // 3. Upsert into tags table
        for (const tagEn of allEnTags) {
            const tagBg = tagMap.get(tagEn) || null;
            // distinct slug from EN
            const slug = tagEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

            // We use ON CONFLICT to update BG translation if we found one and existing was null?
            // User wants "ALL tags available".
            const res = await query(`
                INSERT INTO tags (name_en, name_bg, slug)
                VALUES ($1, $2, $3)
                ON CONFLICT (name_en) 
                DO UPDATE SET 
                    name_bg = COALESCE(EXCLUDED.name_bg, tags.name_bg),
                    updated_at = NOW()
                RETURNING id
            `, [tagEn, tagBg, slug]);

            // We can't easily know if it was insert or update without xmax check or separate query, 
            // but for migration script it's fine.
            insertedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${allEnTags.size} tags.`,
            details: {
                uniqueEnTags: allEnTags.size,
                translationsFound: tagMap.size
            }
        });

    } catch (error: any) {
        console.error('Tag Sync Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
