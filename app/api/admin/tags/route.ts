
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        // improved query to match EN tags with their BG counterparts per product
        // We aggregate unique pairs (TagEN, TagBG)
        // This assumes that if "Kite" translates to "Кайт" in one product, it should be the same in others.
        // If there are inconsistencies, we pick the most frequent one or just one of them.
        const { rows } = await query(`
      WITH exploded_tags AS (
        SELECT 
          p.id,
          unnest(pt_en.tags) AS tag_en,
          -- We align by index. This is tricky in SQL if arrays aren't guaranteed same length/order.
          -- A better heuristic: if we used the script, they are aligned. 
          -- Let's try to trust the recent translation-tags-only script which mapped distinct EN -> BG.
          -- But for display, we need to show what is currently in DB.
          -- Simplest approach: Fetch all BG tags and their occurrence count? No, we need EN->BG mapping.
          
          -- ALTERNATIVE: just return the distinct set of EN tags found.
          -- And for each EN tag, try to find a "likely" BG translation from the same product.
          pt_bg.tags AS tags_bg_arr,
          pt_en.tags AS tags_en_arr
        FROM products p
        JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
        JOIN product_translations pt_bg ON p.id = pt_bg.product_id AND pt_bg.language_code = 'bg'
      )
      SELECT DISTINCT tag_en FROM exploded_tags ORDER BY tag_en
    `);

        // Let's refine: We want { en: "Kite", bg: "Кайт" }
        // Since SQL unnesting blindly doesn't guarantee index alignment easily without ordinality,
        // and we might have mixed states.
        // 
        // PLAN B: 
        // 1. Fetch ALL products with both arrays.
        // 2. JS processing to build the map.

        const { rows: allData } = await query(`
      SELECT 
        pt_en.tags as tags_en,
        pt_bg.tags as tags_bg
      FROM products p
      JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
      JOIN product_translations pt_bg ON p.id = pt_bg.product_id AND pt_bg.language_code = 'bg'
    `);

        const tagMap = new Map<string, string>(); // EN -> BG
        const tagCounts = new Map<string, number>();

        allData.forEach((row: any) => {
            const en = row.tags_en || [];
            const bg = row.tags_bg || [];

            if (!Array.isArray(en) || !Array.isArray(bg)) return;

            // Assuming same length from our script, but safeguard:
            en.forEach((tEn: string, idx: number) => {
                const tBg = bg[idx]; // likely translation at same index
                if (tEn && tBg) {
                    // If we already have a translation, we keep existing or overwrite?
                    // Let's keep the first one found or maybe the most common one?
                    if (!tagMap.has(tEn)) {
                        tagMap.set(tEn, tBg);
                    }
                }
            });

            en.forEach((t: string) => {
                tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
            });
        });

        const result = Array.from(tagMap.entries()).map(([en, bg]) => ({
            en,
            bg,
            count: tagCounts.get(en) || 0
        })).sort((a, b) => a.en.localeCompare(b.en));

        return NextResponse.json({ tags: result });
    } catch (error: any) {
        console.error('Failed to fetch tags', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { oldTagEn, newTagBg } = await req.json();

        if (!oldTagEn || !newTagBg) {
            return NextResponse.json({ error: 'Missing oldTagEn or newTagBg' }, { status: 400 });
        }

        // 1. Find all products that have this EN tag
        // 2. Identify the index of the EN tag
        // 3. Update the BG tag at that index
        // This is hard to do purely in SQL given Postgres array functions vary by version and complexity.
        // JS loop is safer and we have < 1000 products.

        const { rows: products } = await query(`
      SELECT 
        p.id,
        pt_en.tags as tags_en,
        pt_bg.tags as tags_bg
      FROM products p
      JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
      LEFT JOIN product_translations pt_bg ON p.id = pt_bg.product_id AND pt_bg.language_code = 'bg'
      WHERE $1 = ANY(pt_en.tags)
    `, [oldTagEn]);

        let updatedCount = 0;

        for (const prod of products) {
            const tagsEn: string[] = prod.tags_en || [];
            let tagsBg: string[] = prod.tags_bg || [];

            // Find indices of the tag in EN (could be multiple? unlikely but possible)
            const indices = tagsEn.map((t, i) => t === oldTagEn ? i : -1).filter(i => i !== -1);

            if (indices.length === 0) continue;

            // Ensure BG array is long enough
            if (tagsBg.length < tagsEn.length) {
                // fill gaps with original EN or empty if we have to extend
                // for now, let's just extend with current content or empty strings
                const missing = tagsEn.length - tagsBg.length;
                tagsBg = [...tagsBg, ...new Array(missing).fill('')];
            }

            let changed = false;
            indices.forEach(idx => {
                if (tagsBg[idx] !== newTagBg) {
                    tagsBg[idx] = newTagBg;
                    changed = true;
                }
            });

            if (changed) {
                await query(`
          INSERT INTO product_translations (product_id, language_code, tags, updated_at)
          VALUES ($1, 'bg', $2, NOW())
          ON CONFLICT (product_id, language_code) 
          DO UPDATE SET tags = $2, updated_at = NOW()
        `, [prod.id, tagsBg]);
                updatedCount++;
            }
        }

        return NextResponse.json({ success: true, updatedCount });
    } catch (error: any) {
        console.error('Failed to update tag', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
