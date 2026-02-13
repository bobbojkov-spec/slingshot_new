import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SlingshotSportsMenuClient from '@/components/admin/SlingshotSportsMenuClient';
import { query } from '@/lib/dbPg';

export const dynamic = 'force-dynamic';

// Define the 4 Slingshot sports
const SLINGSHOT_SPORTS = [
    { key: 'kite', label: 'Kite', labelBg: 'Кайт', color: '#FF6B35', icon: '🪁' },
    { key: 'wake', label: 'WAKE', labelBg: 'Уейк', color: '#00B4D8', icon: '🏄' },
    { key: 'wing', label: 'Wing', labelBg: 'Уинг', color: '#9B59B6', icon: '🪽' },
    { key: 'foil', label: 'Foil', labelBg: 'Фойл', color: '#27AE60', icon: '🏄‍♂️' },
];

async function getMenuGroupsBySport() {
    // Fetch all menu groups for slingshot, organized by sport
    const result = await query(
        `SELECT 
            mg.*,
            (SELECT COUNT(*)::int FROM menu_group_collections mgc WHERE mgc.menu_group_id = mg.id) as collection_count
         FROM menu_groups mg
         WHERE mg.source = 'slingshot'
         ORDER BY mg.sport ASC NULLS LAST, mg.sort_order ASC, mg.title ASC`
    );

    // Organize by sport
    const groupsBySport: Record<string, any[]> = {
        kite: [],
        wake: [],
        wing: [],
        foil: [],
        unassigned: []
    };

    for (const group of result.rows) {
        const sport = group.sport || 'unassigned';
        if (!groupsBySport[sport]) {
            groupsBySport[sport] = [];
        }
        groupsBySport[sport].push(group);
    }

    return groupsBySport;
}

async function getAvailableCollections() {
    // Get all slingshot collections with product counts and nesting info
    const result = await query(
        `SELECT
            c.id,
            c.title,
            c.slug,
            c.source,
            c.parent_id,
            COUNT(DISTINCT cp.product_id) as product_count,
            (SELECT COUNT(*) FROM collections c2 WHERE c2.parent_id = c.id) as child_count
         FROM collections c
         LEFT JOIN collection_products cp ON c.id = cp.collection_id
         WHERE c.source = 'slingshot'
         GROUP BY c.id
         HAVING COUNT(DISTINCT cp.product_id) > 0
         ORDER BY c.title ASC`
    );
    return result.rows.map(row => ({
        ...row,
        product_count: parseInt(row.product_count) || 0,
        has_nested: parseInt(row.child_count) > 0,
        child_count: parseInt(row.child_count) || 0
    }));
}

export default async function SlingshotSportsMenuPage() {
    const [groupsBySport, collections] = await Promise.all([
        getMenuGroupsBySport(),
        getAvailableCollections()
    ]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/admin/collections-slingshot"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={16} />
                    Back to Collections
                </Link>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Slingshot Mega Menu
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Organize collections into menu groups for each sport. Each sport has its own independent menu structure.
                        </p>
                    </div>
                </div>
            </div>

            <SlingshotSportsMenuClient
                sports={SLINGSHOT_SPORTS}
                initialGroupsBySport={groupsBySport}
                availableCollections={collections}
            />
        </div>
    );
}
