import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MenuGroupsListClient from '@/components/admin/MenuGroupsListClient';

export const dynamic = 'force-dynamic';

async function getMenuGroups(source: string) {
    // We can call the API or DB directly. DB directly is better for Server Component.
    // However, to keep it simple and reuse the API logic (which might grow), let's just query DB here.
    // Duplication is fine for now to avoid circular fetch issues if auth is tricky.

    // Using simple fetch to local API might fail during build if not running.
    // So usually DB Query is safer for Page Components.
    const { query } = await import('@/lib/dbPg'); // Dynamic import to avoid build errors if env invalid

    const result = await query(
        `SELECT 
            mg.*,
            (SELECT COUNT(*)::int FROM menu_group_collections mgc WHERE mgc.menu_group_id = mg.id) as collection_count
         FROM menu_groups mg
         WHERE mg.source = $1
         ORDER BY mg.sort_order ASC, mg.title ASC`,
        [source]
    );

    return result.rows;
}

export default async function SlingshotMenuGroupsPage() {
    const groups = await getMenuGroups('slingshot');
    const sourceTitle = 'Slingshot';

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/admin/collections-slingshot"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={16} />
                    Back to Collections
                </Link>

                <h1 className="text-3xl font-bold text-gray-900">
                    {sourceTitle} Menu Groups
                </h1>
                <p className="text-gray-600 mt-2">
                    Organize collections into dropdown groups (e.g. Gear, Accessories) for the Mega Menu.
                </p>
            </div>

            <MenuGroupsListClient initialGroups={groups} source="slingshot" />
        </div>
    );
}
