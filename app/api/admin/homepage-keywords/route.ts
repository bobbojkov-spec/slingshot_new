import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

// GET - Fetch selected keywords with details
export async function GET() {
  try {
    const result = await query(`
      SELECT
        hfk.id,
        hfk.tag_name_en,
        hfk.sort_order,
        t.name_bg
      FROM homepage_featured_keywords hfk
      LEFT JOIN tags t ON lower(t.name_en) = lower(hfk.tag_name_en)
      ORDER BY hfk.sort_order ASC
    `);

    return NextResponse.json({ keywords: result.rows });
  } catch (error: any) {
    console.error('Error fetching homepage keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage keywords', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update selection (replaces all)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tagNames } = body;

    if (!Array.isArray(tagNames)) {
      return NextResponse.json(
        { error: 'tagNames must be an array' },
        { status: 400 }
      );
    }

    // Delete all existing
    await query('DELETE FROM homepage_featured_keywords');

    // Insert new with sort order
    for (let i = 0; i < tagNames.length; i++) {
      await query(
        `INSERT INTO homepage_featured_keywords (tag_name_en, sort_order)
         VALUES ($1, $2)
         ON CONFLICT (tag_name_en) DO UPDATE SET sort_order = $2`,
        [tagNames[i], i]
      );
    }

    return NextResponse.json({ success: true, count: tagNames.length });
  } catch (error: any) {
    console.error('Error updating homepage keywords:', error);
    return NextResponse.json(
      { error: 'Failed to update homepage keywords', details: error?.message },
      { status: 500 }
    );
  }
}
