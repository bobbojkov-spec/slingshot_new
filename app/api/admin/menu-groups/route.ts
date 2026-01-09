import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const ALLOWED_GROUPS = ['gear', 'accessories'];

export async function GET() {
  try {
    const { rows: tableInfo } = await query(
      `SELECT to_regclass('public.menu_group_assignments') AS table_exists`,
    );
    const hasAssignments = Boolean(tableInfo?.[0]?.table_exists);

    const { rows } = await query(
      hasAssignments
        ? `
          SELECT
            c.id as category_id,
            c.name as category_name,
            c.slug as category_slug,
            c.handle as category_handle,
            pt.id as product_type_id,
            pt.slug as product_type_slug,
            pt.name as product_type_name,
            COALESCE(mga.menu_group, 'gear') as menu_group,
            CAST(COUNT(p.id) AS INTEGER) as product_count
          FROM categories c
          JOIN products p ON p.category_id = c.id
          JOIN product_types pt ON pt.name = p.product_type
          LEFT JOIN menu_group_assignments mga ON
            mga.category_id = c.id AND mga.product_type_id = pt.id
          WHERE c.visible = true AND c.status = 'active'
          GROUP BY c.id, c.name, c.slug, c.handle, pt.id, pt.slug, pt.name, mga.menu_group
          ORDER BY c.name, pt.name
        `
        : `
          SELECT
            c.id as category_id,
            c.name as category_name,
            c.slug as category_slug,
            c.handle as category_handle,
            pt.id as product_type_id,
            pt.slug as product_type_slug,
            pt.name as product_type_name,
            'gear' as menu_group,
            CAST(COUNT(p.id) AS INTEGER) as product_count
          FROM categories c
          JOIN products p ON p.category_id = c.id
          JOIN product_types pt ON pt.name = p.product_type
          WHERE c.visible = true AND c.status = 'active'
          GROUP BY c.id, c.name, c.slug, c.handle, pt.id, pt.slug, pt.name
          ORDER BY c.name, pt.name
        `,
    );

    const categoryMap = new Map<string, any>();
    rows.forEach((row: any) => {
      const categoryId = row.category_id;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: row.category_name,
          slug: row.category_slug,
          handle: row.category_handle,
          productTypes: [],
        });
      }

      const category = categoryMap.get(categoryId);
      category.productTypes.push({
        id: row.product_type_id,
        slug: row.product_type_slug,
        name: row.product_type_name,
        menuGroup: row.menu_group || 'gear',
        productCount: row.product_count,
      });
    });

    return NextResponse.json({
      categories: Array.from(categoryMap.values()),
    });
  } catch (error: any) {
    console.error('Failed to load menu groups', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load menu groups' },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { categoryId, productTypeId, menuGroup } = await req.json();

    if (!categoryId || !productTypeId || !menuGroup) {
      return NextResponse.json(
        { error: 'categoryId, productTypeId and menuGroup are required' },
        { status: 400 },
      );
    }

    if (!ALLOWED_GROUPS.includes(menuGroup)) {
      return NextResponse.json(
        { error: `menuGroup must be one of: ${ALLOWED_GROUPS.join(', ')}` },
        { status: 400 },
      );
    }

    await query(
      `
        INSERT INTO menu_group_assignments (category_id, product_type_id, menu_group, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (category_id, product_type_id)
        DO UPDATE SET
          menu_group = EXCLUDED.menu_group,
          updated_at = NOW()
      `,
      [categoryId, productTypeId, menuGroup],
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save menu group assignment', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save assignment' },
      { status: 500 },
    );
  }
}

