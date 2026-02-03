import { query } from '@/lib/db';
import HomepageKeywordsClient from './HomepageKeywordsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Shop by KW - Admin',
};

type Tag = {
    name_en: string;
    name_bg: string | null;
    slug: string;
    count: number;
};

export default async function HomepageKeywordsPage() {
    // Fetch all tags with usage count (tags are stored as arrays in products table)
    const tagsResult = await query(`
        SELECT
            t.name_en,
            t.name_bg,
            t.slug,
            (
                SELECT COUNT(DISTINCT p.id)
                FROM products p
                LEFT JOIN product_translations pt ON p.id = pt.product_id
                WHERE p.status = 'active' AND (
                    t.name_en = ANY(p.tags) OR
                    t.name_en = ANY(pt.tags)
                )
            ) as count
        FROM tags t
        ORDER BY count DESC, t.name_en ASC
    `);

    // Fetch currently selected keywords
    const selectedResult = await query(`
        SELECT tag_name_en, sort_order
        FROM homepage_featured_keywords
        ORDER BY sort_order ASC
    `);

    const allTags: Tag[] = tagsResult.rows;
    const selectedNames: string[] = selectedResult.rows.map((r: any) => r.tag_name_en);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Shop by Keywords</h1>
            <p className="text-gray-500 mb-6">
                Select up to 20 keywords. These will appear as buttons on the homepage in a colorful section.
                Keywords are displayed randomly.
            </p>
            <HomepageKeywordsClient
                allTags={allTags}
                initialSelectedNames={selectedNames}
            />
        </div>
    );
}
