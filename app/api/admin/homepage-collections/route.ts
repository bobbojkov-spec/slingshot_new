import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

// GET - Fetch selected collections with details
export async function GET() {
  try {
    const result = await query(`
      SELECT
        hfc.id,
        hfc.collection_id,
        hfc.sort_order,
        c.title,
        c.slug,
        c.source,
        c.image_url,
        c.subtitle
      FROM homepage_featured_collections hfc
      JOIN collections c ON c.id = hfc.collection_id
      ORDER BY hfc.sort_order ASC
    `);

    return NextResponse.json({ collections: result.rows });
  } catch (error: any) {
    console.error('Error fetching homepage collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage collections', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update selection (replaces all)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { collectionIds } = body;

    if (!Array.isArray(collectionIds)) {
      return NextResponse.json(
        { error: 'collectionIds must be an array' },
        { status: 400 }
      );
    }

    // Delete all existing
    await query('DELETE FROM homepage_featured_collections');

    // Insert new with sort order
    for (let i = 0; i < collectionIds.length; i++) {
      await query(
        `INSERT INTO homepage_featured_collections (collection_id, sort_order)
         VALUES ($1, $2)
         ON CONFLICT (collection_id) DO UPDATE SET sort_order = $2`,
        [collectionIds[i], i]
      );
    }

    return NextResponse.json({ success: true, count: collectionIds.length });
  } catch (error: any) {
    console.error('Error updating homepage collections:', error);
    return NextResponse.json(
      { error: 'Failed to update homepage collections', details: error?.message },
      { status: 500 }
    );
  }
}
