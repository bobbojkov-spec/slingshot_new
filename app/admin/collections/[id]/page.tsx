
import { query } from "@/lib/dbPg";
import { notFound, redirect } from "next/navigation";
import AdminCollectionForm from "@/components/admin/AdminCollectionForm";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AdminCollectionEditPage({ params }: PageProps) {
    const { id } = await params;

    // Fetch collection
    const cols = await query(`SELECT * FROM collections WHERE id = $1`, [id]);
    if (cols.rows.length === 0) notFound();

    const collection = cols.rows[0];

    // Fetch translations
    const transRes = await query(
        `SELECT * FROM collection_translations WHERE collection_id = $1`,
        [id]
    );
    const translations = transRes.rows;

    async function updateCollection(formData: FormData) {
        "use server";

        const title_en = formData.get("title_en") as string;
        const desc_en = formData.get("desc_en") as string;
        const title_bg = formData.get("title_bg") as string;
        const desc_bg = formData.get("desc_bg") as string;
        const handle = formData.get("handle") as string;

        // Update main collection (Source of truth handles & structural data)
        await query(
            `UPDATE collections 
        SET title = $1, 
            handle = $2, 
            description = $3,
            updated_at = NOW()
        WHERE id = $4`,
            [title_en, handle, desc_en, id]
        );

        // Update Translations
        // EN
        await query(
            `INSERT INTO collection_translations (collection_id, language_code, title, description, slug)
        VALUES ($1, 'en', $2, $3, $4)
        ON CONFLICT (collection_id, language_code) 
        DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, slug = EXCLUDED.slug, updated_at = NOW()`,
            [id, title_en, desc_en, handle]
        );

        // BG
        await query(
            `INSERT INTO collection_translations (collection_id, language_code, title, description, slug)
        VALUES ($1, 'bg', $2, $3, $4)
        ON CONFLICT (collection_id, language_code) 
        DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, slug = EXCLUDED.slug, updated_at = NOW()`,
            [id, title_bg, desc_bg, handle]
        );

        redirect("/admin/collections");
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-8">Edit Collection: {collection.title}</h1>
            <AdminCollectionForm
                collection={collection}
                translations={translations}
                action={updateCollection}
            />
        </div>
    );
}
