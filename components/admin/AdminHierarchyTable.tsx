"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Edit, ChevronRight, ChevronDown } from "lucide-react";

type CollectionNode = {
    id: string;
    title: string;
    handle: string;
    product_count: string | number;
    children?: CollectionNode[];
};

export default function AdminHierarchyTable({ collections }: { collections: CollectionNode[] }) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggle = (id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const renderRow = (col: CollectionNode, depth: number = 0) => {
        const hasChildren = col.children && col.children.length > 0;
        const isExpanded = expanded[col.id];

        return (
            <React.Fragment key={col.id}>
                <tr className="hover:bg-gray-50 border-b last:border-0 transition-colors">
                    <td className="py-4 px-6 font-medium">
                        <div className="flex items-center gap-2" style={{ paddingLeft: depth * 24 }}>
                            {hasChildren ? (
                                <button onClick={() => toggle(col.id)} className="p-2 hover:bg-gray-200 rounded">
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                            ) : (
                                <span className="w-6" /> // Spacer
                            )}
                            {col.title}
                        </div>
                    </td>
                    <td className="py-4 px-6 text-gray-500">{col.handle}</td>
                    <td className="py-4 px-6 text-gray-500">{col.product_count}</td>
                    <td className="py-4 px-6 text-right">
                        <Link
                            href={`/admin/collections/${col.id}`}
                            className="text-blue-600 hover:text-blue-800 flex items-center justify-end gap-1"
                        >
                            <Edit size={16} />
                            Edit
                        </Link>
                    </td>
                </tr>
                {hasChildren && isExpanded && col.children!.map((child) => renderRow(child, depth + 1))}
            </React.Fragment>
        );
    };

    return (
        <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="text-left py-4 px-6 font-medium text-gray-500">Title</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500">Handle</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500">Products</th>
                        <th className="text-right py-4 px-6 font-medium text-gray-500">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {collections.map(col => renderRow(col))}
                </tbody>
            </table>
        </div>
    );
}
