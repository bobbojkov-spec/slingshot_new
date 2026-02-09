import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { buildMetadataFromSeo, resolvePageSEO } from '@/lib/seo/metadata';
import {
    HeroBlock,
    TextBlock,
    TextImageBlock,
    GalleryBlock,
    YoutubeBlock,
    FeaturedProductsBlock
} from '@/components/pages/Blocks';

interface PageProps {
    params: Promise<{ slug: string }>;
}

async function getPageData(slug: string) {
    const { rows } = await query(
        `SELECT * FROM pages WHERE slug = $1 AND status = 'published' LIMIT 1`,
        [slug]
    );
    return rows[0] || null;
}

async function getPageBlocks(pageId: number) {
    const { rows } = await query(
        `SELECT * FROM page_blocks WHERE page_id = $1 AND enabled = true ORDER BY position ASC`,
        [pageId]
    );
    return rows;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const seo = await resolvePageSEO({ type: "page", slug, path: `/p/${slug}` });
    return buildMetadataFromSeo(seo);
}

export default async function CustomPage({ params }: PageProps) {
    const { slug } = await params;
    const page = await getPageData(slug);

    if (!page) {
        notFound();
    }

    const blocks = await getPageBlocks(page.id);

    return (
        <div className="flex flex-col">
            {blocks.map((block) => {
                switch (block.type) {
                    case 'HERO':
                        return <HeroBlock key={block.id} data={block.data} />;
                    case 'TEXT':
                        return <TextBlock key={block.id} data={block.data} />;
                    case 'TEXT_IMAGE':
                        return <TextImageBlock key={block.id} data={block.data} />;
                    case 'GALLERY':
                        return <GalleryBlock key={block.id} data={block.data} />;
                    case 'YOUTUBE':
                        return <YoutubeBlock key={block.id} data={block.data} />;
                    case 'FEATURED_PRODUCTS':
                        return <FeaturedProductsBlock key={block.id} data={block.data} />;
                    default:
                        return null;
                }
            })}
        </div>
    );
}
