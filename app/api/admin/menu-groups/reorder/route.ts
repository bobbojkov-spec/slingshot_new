import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbPg';
import { revalidateTag } from 'next/cache';

// PUT /api/admin/menu-groups/reorder
// Body: { updates: [{ id: string, sort_order: number }] }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      );
    }

    // Start transaction
    await query('BEGIN');

    try {
      // Update each group's sort_order
      for (const update of updates) {
        if (!update.id || typeof update.sort_order !== 'number') {
          throw new Error('Each update must have id and sort_order');
        }

        await query(
          `UPDATE menu_groups 
           SET sort_order = $1, updated_at = NOW()
           WHERE id = $2`,
          [update.sort_order, update.id]
        );
      }

      await query('COMMIT');

      // Revalidate navigation cache
      revalidateTag('navigation', {});

      return NextResponse.json({ success: true });
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  } catch (error: any) {
    console.error('Error reordering menu groups:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reorder menu groups' },
      { status: 500 }
    );
  }
}
