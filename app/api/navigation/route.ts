import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const TOP_LEVEL_SPORTS = ['kites', 'wings', 'foils', 'wake'];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedLang = (searchParams.get('lang') || 'en').toLowerCase();
    const lang = requestedLang === 'bg' ? 'bg' : 'en';

    const { rows: sportsRows } = await query(
      `
        SELECT
          c.id,
          c.slug,
          c.handle,
          c.sort_order,
          COALESCE(ct.name, c.name) as name,
          COALESCE(ct.description, c.description) as description
        FROM categories c
        LEFT JOIN category_translations ct
          ON ct.category_id = c.id AND ct.language_code = $1
        WHERE c.slug = ANY($2)
          AND c.visible = true
          AND c.status = 'active'
        ORDER BY c.sort_order, c.name
      `,
      [lang, TOP_LEVEL_SPORTS],
    );

    const { rows: menuGroupMeta } = await query(
      `SELECT to_regclass('public.menu_group_assignments') as table_exists`,
    );
    const hasMenuAssignments = Boolean(menuGroupMeta[0]?.table_exists);

    const typeRows =
      hasMenuAssignments
        ? (
            await query(
              `
                SELECT
                  c.slug as category_slug,
                  pt.id as product_type_id,
                  pt.slug as product_type_slug,
                  COALESCE(ptt.name, pt.name) as product_type_name,
                  CAST(COUNT(p.id) AS INTEGER) as product_count,
                  COALESCE(mga.menu_group, 'gear') as menu_group
                FROM categories c
                JOIN products p ON p.category_id = c.id
                JOIN product_types pt ON pt.name = p.product_type
                LEFT JOIN product_type_translations ptt
                  ON pt.id = ptt.product_type_id AND ptt.language_code = $1
                LEFT JOIN menu_group_assignments mga
                  ON mga.category_id = c.id AND mga.product_type_id = pt.id
                WHERE c.slug = ANY($2)
                  AND c.visible = true
                  AND c.status = 'active'
                  AND pt.visible = true
                  AND pt.status = 'active'
                GROUP BY c.slug, c.sort_order, pt.id, pt.slug, pt.sort_order, pt.name, ptt.name, mga.menu_group
                ORDER BY c.sort_order, pt.sort_order, pt.name
              `,
              [lang, TOP_LEVEL_SPORTS],
            )
          ).rows
        : (
            await query(
              `
                SELECT
                  c.slug as category_slug,
                  pt.id as product_type_id,
                  pt.slug as product_type_slug,
                  COALESCE(ptt.name, pt.name) as product_type_name,
                  CAST(COUNT(p.id) AS INTEGER) as product_count,
                  'gear' as menu_group
                FROM categories c
                JOIN products p ON p.category_id = c.id
                JOIN product_types pt ON pt.name = p.product_type
                LEFT JOIN product_type_translations ptt
                  ON pt.id = ptt.product_type_id AND ptt.language_code = $1
                WHERE c.slug = ANY($2)
                  AND c.visible = true
                  AND c.status = 'active'
                  AND pt.visible = true
                  AND pt.status = 'active'
                GROUP BY c.slug, pt.id, pt.slug, pt.name, ptt.name
                ORDER BY c.sort_order, pt.sort_order, pt.name
              `,
              [lang, TOP_LEVEL_SPORTS],
            )
          ).rows;

    const activitiesResult = await query(
      `
        SELECT
          id,
          slug,
          name_en,
          name_bg,
          CASE WHEN $1 = 'bg' THEN name_bg ELSE name_en END as name
        FROM activity_categories
        WHERE is_active = true
        ORDER BY position ASC, name_en ASC
      `,
      [lang],
    );

    const sportMap = new Map<string, any>();
    sportsRows.forEach((sport: any) => {
      sportMap.set(sport.slug, {
        id: sport.id,
        slug: sport.slug,
        handle: sport.handle,
        name: sport.name,
        description: sport.description,
        productGroups: {
          gear: [],
          accessories: [],
        },
      });
    });

    typeRows.forEach((row: any) => {
      const sport = sportMap.get(row.category_slug);
      if (!sport) return;
      const group = row.menu_group || 'gear';
      if (!sport.productGroups[group]) return;
      sport.productGroups[group].push({
        id: row.product_type_id,
        slug: row.product_type_slug,
        name: row.product_type_name,
        productCount: row.product_count,
      });
    });

    const sports = TOP_LEVEL_SPORTS.map((slug) => sportMap.get(slug)).filter(Boolean);

    return NextResponse.json({
      language: lang,
      sports,
      activityCategories: activitiesResult.rows,
    });
  } catch (error: any) {
    console.error('Failed to load navigation data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load navigation data' },
      { status: 500 },
    );
  }
}

