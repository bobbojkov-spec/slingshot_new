import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getPresignedUrl } from '@/lib/railway/storage';

export const runtime = 'nodejs';

// GET - Fetch first 8 collections for homepage display
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';

    const result = await query(`
      SELECT
        hfc.id,
        hfc.collection_id,
        hfc.sort_order,
        c.title as title_en,
        c.slug,
        c.source,
        c.image_url,
        c.subtitle as subtitle_en,
        ct.title as title_translated,
        ct.subtitle as subtitle_translated
      FROM homepage_featured_collections hfc
      JOIN collections c ON c.id = hfc.collection_id
      LEFT JOIN collection_translations ct ON ct.collection_id = c.id AND ct.language_code = $1
      WHERE c.visible = true
      ORDER BY hfc.sort_order ASC
      LIMIT 12
    `, [lang]);

    let rawCollections = result.rows;

    // If less than 12, fill with other visible collections
    if (rawCollections.length < 12) {
      const remainingCount = 12 - rawCollections.length;
      const featuredIds = rawCollections.map(r => r.collection_id).filter(id => id);

      const fillResult = await query(`
        SELECT 
          c.id as collection_id,
          c.title as title_en,
          c.slug,
          c.source,
          c.image_url,
          c.subtitle as subtitle_en,
          ct.title as title_translated,
          ct.subtitle as subtitle_translated
        FROM collections c
        LEFT JOIN collection_translations ct ON ct.collection_id = c.id AND ct.language_code = $1
        WHERE c.visible = true
        ${featuredIds.length > 0 ? `AND c.id NOT IN (${featuredIds.join(',')})` : ''}
        ORDER BY c.created_at DESC
        LIMIT $2
      `, [lang, remainingCount]);

      rawCollections = [...rawCollections, ...fillResult.rows];
    }

    // Sign image URLs
    const collections = await Promise.all(
      rawCollections.map(async (row) => {
        let signedImageUrl = null;
        if (row.image_url) {
          // Convert to middle size for grid display
          const imagePath = row.image_url.replace('/thumb/', '/middle/').replace('/full/', '/middle/');
          try {
            signedImageUrl = await getPresignedUrl(imagePath);
          } catch (e) {
            // Fallback to original URL if signing fails
            signedImageUrl = row.image_url;
          }
        }

        return {
          id: row.collection_id,
          title: row.title_translated || row.title_en,
          subtitle: row.subtitle_translated || row.subtitle_en,
          slug: row.slug,
          source: row.source,
          image_url: signedImageUrl,
        };
      })
    );

    return NextResponse.json({ collections });
  } catch (error: any) {
    console.error('Error fetching homepage collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage collections', details: error?.message },
      { status: 500 }
    );
  }
}
