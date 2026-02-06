import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MenuGroupEditClient from '@/components/admin/MenuGroupEditClient';
import { query } from '@/lib/dbPg';

export const dynamic = 'force-dynamic';

type RouteContext = {
    params: Promise<{ id: string }>;
};

async function getData(groupId: string, source: string) {
    // 1. Get Group Details
    const groupRes = await query('SELECT * FROM menu_groups WHERE id = $1', [groupId]);
    const group = groupRes.rows[0];

    // 2. Get Group Collections (Assigned)
    const assignedRes = await query(
        'SELECT collection_id as id, sort_order FROM menu_group_collections WHERE menu_group_id = $1 ORDER BY sort_order ASC',
        [groupId]
    );

    // 3. Get ALL Collections for this source (Available)
    const allRes = await query(
        `SELECT c.id, c.title, c.slug, c.source 
         FROM collections c 
         JOIN collection_products cp ON c.id = cp.collection_id 
         WHERE c.source = $1 
         GROUP BY c.id 
         HAVING COUNT(cp.product_id) > 0 
         ORDER BY c.title ASC`,
        [source]
    );

    return {
        group: {
            ...group,
            collections: assignedRes.rows
        },
        allCollections: allRes.rows
    };
}

export default async function RideEngineMenuGroupEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { group, allCollections } = await getData(id, 'rideengine');

    if (!group) return <div>Group not found</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/admin/collections-rideengine/groups"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={16} />
                    Back to Groups
                </Link>

                <h1 className="text-3xl font-bold text-gray-900">
                    Edit Group: {group.title}
                </h1>
            </div>

            <MenuGroupEditClient group={group} allCollections={allCollections} />
        </div>
    );
}
