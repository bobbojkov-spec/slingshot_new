
import { query } from "@/lib/dbPg";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdminHierarchyTable from "@/components/admin/AdminHierarchyTable";

async function getCollectionsTree() {
    // 1. Fetch all collections
    const res = await query(`
    SELECT c.id, c.title, c.handle, c.parent_id,
           (SELECT COUNT(*) FROM collection_products WHERE collection_id = c.id) as product_count
    FROM collections c
    ORDER BY c.title ASC
  `);
    const all = res.rows;

    // 2. Build Tree
    const nodeMap: Record<string, any> = {};
    const roots: any[] = [];

    // init map
    all.forEach(c => {
        nodeMap[c.id] = { ...c, children: [] };
    });

    // link parents
    all.forEach(c => {
        if (c.parent_id && nodeMap[c.parent_id]) {
            nodeMap[c.parent_id].children.push(nodeMap[c.id]);
        } else {
            roots.push(nodeMap[c.id]);
        }
    });

    return roots;
}

export default async function AdminCollectionsPage() {
    const tree = await getCollectionsTree();

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Collections</h1>
                <Link
                    href="/admin/collections/new"
                    className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800"
                >
                    <Plus size={16} />
                    New Collection
                </Link>
            </div>

            <AdminHierarchyTable collections={tree} />
        </div>
    );
}
