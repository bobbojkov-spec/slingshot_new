import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbPg';
import { revalidateTag } from 'next/cache';

// GET /api/admin/menu-groups?source=slingshot&sport=kite
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const sport = searchParams.get('sport');

    let queryStr = `SELECT
            mg.*,
            (SELECT COUNT(*)::int FROM menu_group_collections mgc WHERE mgc.menu_group_id = mg.id) as collection_count
         FROM menu_groups mg`;
    
    const conditions: string[] = [];
    const queryParams: any[] = [];
    
    if (source) {
      conditions.push(`mg.source = $${queryParams.length + 1}`);
      queryParams.push(source);
    }
    
    if (sport) {
      conditions.push(`mg.sport = $${queryParams.length + 1}`);
      queryParams.push(sport);
    }
    
    if (conditions.length > 0) {
      queryStr += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    queryStr += ` ORDER BY mg.sport ASC NULLS LAST, mg.sort_order ASC, mg.title ASC`;

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
    const { title, title_bg, slug, source, sport, sort_order } = body;

    if (!title || !source) {
      return NextResponse.json({ error: 'Title and Source are required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO menu_groups (title, title_bg, slug, source, sport, sort_order, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             RETURNING *`,
      [title, title_bg, slug, source, sport || null, sort_order || 0]
    );

    // Revalidate navigation cache to reflect changes immediately
    revalidateTag('navigation', {});

    return NextResponse.json({ group: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating menu group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create menu group' },
      { status: 500 }
    );
  }
}
