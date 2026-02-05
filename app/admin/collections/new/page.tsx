
import { query } from "@/lib/dbPg";
import { redirect } from "next/navigation";
import AdminCollectionForm from "@/components/admin/AdminCollectionForm";

export default function NewCollectionPage() {
    async function createCollection(formData: FormData) {
        "use server";

        const title_en = formData.get("title_en") as string;
        const desc_en = formData.get("desc_en") as string;
        const title_bg = formData.get("title_bg") as string;
        const desc_bg = formData.get("desc_bg") as string;
        // Auto-generate handle if missing, simple slugify
        let handle = formData.get("handle") as string;
        if (!handle) {
            handle = title_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        // Insert main collection
        const res = await query(
            `INSERT INTO collections (title, handle, slug, source, visible, description, created_at, updated_at)
        VALUES ($1, $2, $2, 'rideengine', true, $3, NOW(), NOW())
        RETURNING id`,
            [title_en, handle, desc_en]
        );
        const id = res.rows[0].id;

        // Insert Translations
        // EN
        await query(
            `INSERT INTO collection_translations (collection_id, language_code, title, description, slug)
        VALUES ($1, 'en', $2, $3, $4)`,
            [id, title_en, desc_en, handle]
        );

        // BG
        await query(
            `INSERT INTO collection_translations (collection_id, language_code, title, description, slug)
        VALUES ($1, 'bg', $2, $3, $4)`,
            [id, title_bg, desc_bg, handle]
        );

        redirect("/admin/collections");
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-8">Create New Collection</h1>
            <AdminCollectionForm action={createCollection} />
        </div>
    );
}
