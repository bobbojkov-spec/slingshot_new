import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbPg';

// GET /api/admin/menu-groups?source=slingshot
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');

    const queryStr = source
      ? `SELECT 
            mg.*,
            (SELECT COUNT(*)::int FROM menu_group_collections mgc WHERE mgc.menu_group_id = mg.id) as collection_count
         FROM menu_groups mg
         WHERE mg.source = $1
         ORDER BY mg.sort_order ASC, mg.title ASC`
      : `SELECT 
            mg.*,
            (SELECT COUNT(*)::int FROM menu_group_collections mgc WHERE mgc.menu_group_id = mg.id) as collection_count
         FROM menu_groups mg
         ORDER BY mg.source ASC, mg.sort_order ASC, mg.title ASC`;

    const queryParams = source ? [source] : [];
    const result = await query(queryStr, queryParams);

    return NextResponse.json({ groups: result.rows });
  } catch (error: any) {
    console.error('Error fetching menu groups:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch menu groups' },
      { status: 500 }
    );
  }
}

// POST /api/admin/menu-groups
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, title_bg, slug, source, sort_order } = body;

    if (!title || !source) {
      return NextResponse.json({ error: 'Title and Source are required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO menu_groups (title, title_bg, slug, source, sort_order, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             RETURNING *`,
      [title, title_bg, slug, source, sort_order || 0]
    );

    return NextResponse.json({ group: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating menu group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create menu group' },
      { status: 500 }
    );
  }
}
