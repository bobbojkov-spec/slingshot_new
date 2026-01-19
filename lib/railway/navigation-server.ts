import { query } from '@/lib/db';
import { getPresignedUrl } from '@/lib/railway/storage';
import { NavigationData, NavigationSport, MenuGroup, MenuCollection } from '@/hooks/useNavigation';

// Simple memory cache
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const navCache: Record<string, { data: NavigationData, expires: number }> = {};

export async function getNavigationData(lang: string = 'en') {
    const { rows: sportsRows } = await query(
        `
    SELECT
      c.id,
      c.slug,
      c.handle,
      c.sort_order,
      c.custom_link,
      COALESCE(ct.name, c.name) as name,
      COALESCE(ct.description, c.description) as description
    FROM categories c
    LEFT JOIN category_translations ct
      ON ct.category_id = c.id AND ct.language_code = $1
    WHERE c.parent_id IS NULL
      AND c.visible = true
      AND c.status = 'active'
    ORDER BY c.sort_order, c.name
    `,
        [lang],
    );

    const { rows: meta } = await query(
        `SELECT to_regclass('public.menu_group_assignments') as table_exists`,
    );
    const hasMenuAssignments = Boolean(meta[0]?.table_exists);

    const typeRows = hasMenuAssignments
        ? (await query(
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
      WHERE c.parent_id IS NULL
        AND c.visible = true
        AND c.status = 'active'
        AND pt.visible = true
        AND pt.status = 'active'
      GROUP BY c.slug, c.sort_order, pt.id, pt.slug, pt.sort_order, pt.name, ptt.name, mga.menu_group
      ORDER BY c.sort_order, pt.sort_order, pt.name
      `,
            [lang],
        )).rows
        : (await query(
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
      WHERE c.parent_id IS NULL
        AND c.visible = true
        AND c.status = 'active'
        AND pt.visible = true
        AND pt.status = 'active'
      GROUP BY c.slug, pt.id, pt.slug, pt.name, ptt.name, c.sort_order, pt.sort_order
      ORDER BY c.sort_order, pt.sort_order, pt.name
      `,
            [lang],
        )).rows;

    const { rows: activitiesResult } = await query(
        `
    SELECT id, slug, name_en, name_bg,
           CASE WHEN $1 = 'bg' THEN name_bg ELSE name_en END as name
    FROM activity_categories
    WHERE is_active = true
    ORDER BY position ASC, name_en ASC
    `,
        [lang],
    );

    const { rows: rideEngineRows } = await query(`
    SELECT DISTINCT c.handle
    FROM collections c
    JOIN collection_products cp ON c.id = cp.collection_id
    WHERE c.source = 'rideengine'
  `);

    const sportMap = new Map<string, any>();
    sportsRows.forEach((sport: any) => {
        sportMap.set(sport.slug, {
            id: sport.id,
            slug: sport.slug,
            handle: sport.handle,
            customLink: sport.custom_link,
            name: sport.name,
            description: sport.description,
            productGroups: { gear: [], accessories: [] },
        });
    });

    typeRows.forEach((row: any) => {
        const sport = sportMap.get(row.category_slug);
        if (sport) {
            const group = row.menu_group || 'gear';
            sport.productGroups[group]?.push({
                id: row.product_type_id,
                slug: row.product_type_slug,
                name: row.product_type_name,
                productCount: row.product_count,
            });
        }
    });

    return {
        language: lang,
        sports: sportsRows.map((row: any) => sportMap.get(row.slug)).filter(Boolean),
        activityCategories: activitiesResult,
        rideEngineHandles: rideEngineRows.map((r: any) => r.handle),
    };
}

export async function getMenuStructure(source: string, lang: string = 'en') {
    const { rows: groups } = await query(
        `SELECT id, title, title_bg, slug, sort_order FROM menu_groups WHERE source = $1 ORDER BY sort_order ASC`,
        [source]
    );
    if (!groups.length) return [];

    const { rows: collectionsRows } = await query(
        `
    WITH CollectionCategories AS (
        SELECT cp.collection_id, array_agg(DISTINCT c_curr.slug) as category_slugs
        FROM collection_products cp
        JOIN products p ON cp.product_id = p.id
        JOIN categories c_curr ON p.category_id = c_curr.id
        GROUP BY cp.collection_id
    )
    SELECT mgc.menu_group_id, c.id, c.slug, COALESCE(ct.title, c.title) as title, c.image_url, CC.category_slugs
    FROM menu_group_collections mgc
    JOIN collections c ON mgc.collection_id = c.id
    LEFT JOIN collection_translations ct ON c.id = ct.collection_id AND ct.language_code = $2
    LEFT JOIN CollectionCategories CC ON c.id = CC.collection_id
    WHERE mgc.menu_group_id = ANY($1)
    ORDER BY mgc.sort_order ASC
    `,
        [groups.map((g: any) => g.id), lang]
    );

    const collectionsByGroup = new Map<string, any[]>();

    // Parallelize pre-signed URL generation
    const signedRows = await Promise.all(collectionsRows.map(async (row) => {
        let imageUrl = row.image_url;
        if (imageUrl && !imageUrl.startsWith('http')) {
            try {
                imageUrl = await getPresignedUrl(imageUrl);
            } catch (e) {
                console.error(`Failed to sign URL for collection ${row.slug}:`, e);
            }
        }
        return { ...row, imageUrl };
    }));

    for (const row of signedRows) {
        if (!collectionsByGroup.has(row.menu_group_id)) collectionsByGroup.set(row.menu_group_id, []);

        collectionsByGroup.get(row.menu_group_id)?.push({
            id: row.id,
            title: row.title,
            slug: row.slug,
            image_url: row.imageUrl,
            category_slugs: row.category_slugs || []
        });
    }

    return groups.map((g: any) => ({
        id: g.id,
        title: g.title,
        title_bg: g.title_bg,
        slug: g.slug,
        collections: collectionsByGroup.get(g.id) || []
    }));
}

export async function getFullNavigation(lang: string = 'en'): Promise<NavigationData> {
    const now = Date.now();
    if (navCache[lang] && navCache[lang].expires > now) {
        return navCache[lang].data;
    }

    const [nav, slingshot, rideEngine] = await Promise.all([
        getNavigationData(lang),
        getMenuStructure('slingshot', lang),
        getMenuStructure('rideengine', lang)
    ]);

    const data = {
        ...nav,
        slingshotMenuGroups: slingshot,
        rideEngineMenuGroups: rideEngine,
    } as NavigationData;

    // Update cache
    navCache[lang] = {
        data,
        expires: now + CACHE_DURATION
    };

    return data;
}
