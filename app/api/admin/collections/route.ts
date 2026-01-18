
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/&/g, '-and-')   // Replace & with 'and'
        .replace(/[^\w\u0400-\u04FF-]+/g, '') // Remove all non-word chars (allowing Cyrillic)
        .replace(/--+/g, '-')     // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '');      // Trim - from end of text
}

export async function POST(req: Request) {
    try {
        const { title, source } = await req.json();

        if (!title || !source) {
            return NextResponse.json({ error: 'Title and Source are required' }, { status: 400 });
        }

        const slug = slugify(title);

        // Check for existing slug to avoid unique constraint error
        // Simple collision handling: append -timestamp if exists? Or let it fail?
        // Let's try to append if exists, or just let DB fail and user retry.
        // For now, simple slugify.

        // Insert new collection
        // Defaulting visible to false or true? Usually false until populated. 
        // But let's verify schema defaults or commonly used values.
        // task.md says "visible=true" in queries usually. Let's set visible=false initially so they can setup image first.

        // We need to fetch max sort_order to append to end
        const lastOrderRes = await query(`SELECT MAX(sort_order) as max_order FROM collections WHERE source = $1`, [source]);
        const nextOrder = (lastOrderRes.rows[0]?.max_order || 0) + 1;

        const { rows } = await query(
            `
                INSERT INTO collections (
                  title, 
                  slug, 
                  handle,
                  source, 
                  sort_order, 
                  visible, 
                  created_at, 
                  updated_at
                )
                values ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                RETURNING *
              `,
            [title, slug, slug, source, nextOrder, false] // Default hidden
        );

        return NextResponse.json({ collection: rows[0] });

    } catch (error: any) {
        console.error('Error creating collection:', error);
        // Handle unique constraint violation for slug
        if (error.code === '23505') { // Postgres unique violation
            return NextResponse.json({ error: 'A collection with this name/slug already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
