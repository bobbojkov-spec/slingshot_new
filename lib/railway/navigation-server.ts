import { query } from '@/lib/db';
import { getPresignedUrl } from '@/lib/railway/storage';
import { NavigationData } from '@/hooks/useNavigation';
import { unstable_cache } from 'next/cache';

// Hard timeout for DB operations to prevent RootLayout hangs
// Increased to 10s to handle cold starts and complex multi-query operations
const DB_TIMEOUT_MS = 10000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T, operationName: string = 'navigation'): Promise<T> {
    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => {
            const elapsed = Date.now() - startTime;
            console.error(`[NAV SERVER] Timeout reached for "${operationName}" after ${elapsed}ms (limit: ${timeoutMs}ms). Returning fallback.`);
            resolve(fallback);
        }, timeoutMs);
    });

    return Promise.race([
        promise.then((result) => {
            clearTimeout(timeoutId);
            const elapsed = Date.now() - startTime;
            if (elapsed > 2000) {
                console.warn(`[NAV SERVER] Slow "${operationName}" operation completed in ${elapsed}ms`);
            }
            return result;
        }),
        timeoutPromise
    ]);
}

export async function getNavigationData(lang: string = 'en') {
    const operationStart = Date.now();
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

    const { rows: customPages } = await query(
        `
        SELECT id, title, title_bg, slug, status, show_header, header_order, show_dropdown, dropdown_order, show_footer, footer_column, footer_order
        FROM pages
        WHERE status = 'published'
          AND (show_header = true OR show_dropdown = true OR show_footer = true OR footer_column IS NOT NULL)
        ORDER BY header_order ASC, footer_order ASC
        `
    );

    const result = {
        language: lang,
        sports: sportsRows.map((row: any) => sportMap.get(row.slug)).filter(Boolean),
        activityCategories: activitiesResult,
        rideEngineHandles: rideEngineRows.map((r: any) => r.handle),
        customPages: customPages.map((p: any) => ({
            id: Number(p.id),
            title: String(p.title),
            title_bg: p.title_bg ? String(p.title_bg) : undefined,
            slug: String(p.slug),
            status: String(p.status),
            show_header: Boolean(p.show_header),
            header_order: p.header_order ? Number(p.header_order) : null,
            show_dropdown: Boolean(p.show_dropdown),
            dropdown_order: p.dropdown_order ? Number(p.dropdown_order) : null,
            show_footer: Boolean(p.show_footer),
            footer_column: p.footer_column ? Number(p.footer_column) : null,
            footer_order: p.footer_order ? Number(p.footer_order) : null,
        })),
    };
    
    const duration = Date.now() - operationStart;
    if (duration > 1000) {
        console.warn(`[NAV SERVER] getNavigationData took ${duration}ms for lang=${lang}`);
    }
    
    return result;
}

export async function getMenuStructure(source: string, lang: string = 'en', sport?: string) {
    const operationStart = Date.now();
    
    // Build query based on whether sport is specified
    let groupsQuery = `SELECT id, title, title_bg, slug, sort_order, sport FROM menu_groups WHERE source = $1`;
    const queryParams: any[] = [source];
    
    if (sport) {
        groupsQuery += ` AND sport = $2`;
        queryParams.push(sport);
    }
    
    groupsQuery += ` ORDER BY sort_order ASC`;
    
    const { rows: groups } = await query(groupsQuery, queryParams);
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

    const result = groups.map((g: any) => ({
        id: g.id,
        title: g.title,
        title_bg: g.title_bg,
        slug: g.slug,
        collections: collectionsByGroup.get(g.id) || []
    }));
    
    const duration = Date.now() - operationStart;
    if (duration > 1000) {
        console.warn(`[NAV SERVER] getMenuStructure("${source}") took ${duration}ms for lang=${lang}`);
    }
    
    return result;
}

// Internal base fetcher
async function fetchFullNavigationData(lang: string = 'en'): Promise<NavigationData> {
    const fetchStart = Date.now();
    try {
        // Fetch all menu structures in parallel
        const [nav, slingshotKite, slingshotWake, slingshotWing, slingshotFoil, rideEngine] = await Promise.all([
            getNavigationData(lang),
            getMenuStructure('slingshot', lang, 'kite'),
            getMenuStructure('slingshot', lang, 'wake'),
            getMenuStructure('slingshot', lang, 'wing'),
            getMenuStructure('slingshot', lang, 'foil'),
            getMenuStructure('rideengine', lang)
        ]);

        const duration = Date.now() - fetchStart;
        console.log(`[NAV SERVER] Navigation data fetched in ${duration}ms for lang=${lang}`);
        
        // Combine all slingshot menu groups for backward compatibility
        const allSlingshotGroups = [
            ...slingshotKite,
            ...slingshotWake,
            ...slingshotWing,
            ...slingshotFoil
        ];
        
        return {
            ...nav,
            slingshotMenuGroups: allSlingshotGroups,
            rideEngineMenuGroups: rideEngine,
            slingshotBySport: {
                kite: slingshotKite,
                wake: slingshotWake,
                wing: slingshotWing,
                foil: slingshotFoil
            },
            language: lang,
        } as NavigationData;
    } catch (error: any) {
        console.error('[NAV SERVER] fetchFullNavigationData failed:', error.message);
        return {
            language: lang,
            sports: [],
            activityCategories: [],
            rideEngineHandles: [],
            customPages: [],
            slingshotMenuGroups: [],
            rideEngineMenuGroups: [],
            slingshotBySport: {
                kite: [],
                wake: [],
                wing: [],
                foil: []
            }
        } as NavigationData;
    }
}

// Cached version for public use
export const getFullNavigation = async (lang: string = 'en'): Promise<NavigationData> => {
    // Wrap with Next.js caching
    const cachedFetch = unstable_cache(
        async (l: string) => fetchFullNavigationData(l),
        [`navigation-${lang}`],
        { revalidate: 300, tags: ['navigation'] }
    );

    // Hard fallback structure
    const fallback: NavigationData = {
        language: lang,
        sports: [],
        activityCategories: [],
        rideEngineHandles: [],
        customPages: [],
        slingshotMenuGroups: [],
        rideEngineMenuGroups: [],
        slingshotBySport: {
            kite: [],
            wake: [],
            wing: [],
            foil: []
        }
    };

    // Apply hard timeout to the cached fetch
    return withTimeout(cachedFetch(lang), DB_TIMEOUT_MS, fallback, `navigation-${lang}`);
};
