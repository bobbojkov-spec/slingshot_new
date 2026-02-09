
import { notFound } from 'next/navigation';
import { getPageBySlug, getPageBlocks } from '@/lib/db/repositories/pages';
import { getFaqItems } from '@/lib/db/repositories/faq';
import DynamicPageContent from '@/components/DynamicPageContent';
import { Metadata } from 'next';
import { buildMetadataFromSeo, resolvePageSEO } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const seo = await resolvePageSEO({ type: "page", slug, path: `/${slug}` });
    return buildMetadataFromSeo(seo);
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const page = await getPageBySlug(slug);

    if (!page || page.status !== 'published') {
        notFound();
    }

    const blocks = await getPageBlocks(page.id);

    // Check if we need FAQs
    const hasFaqBlock = blocks.some(b => b.type === 'FAQ' && b.enabled);
    const faqItems = hasFaqBlock || slug === 'faq' ? await getFaqItems(true) : [];
    // ^ Also load if slug is 'faq' to support "basic info + Module hardcoded" logic if admin forgets block

    // Add virtual blocks for hardcoded modules if they don't exist in DB blocks
    // User requirement: "Contact - uses basic info + Module hardcoded"
    const hasContactBlock = blocks.some(b => b.type === 'CONTACT_FORM');
    if (slug === 'contact' && !hasContactBlock) {
        blocks.push({
            id: -1,
            page_id: page.id,
            type: 'CONTACT_FORM',
            position: 999,
            data: { title_en: "Get in Touch", title_bg: "Свържете се с нас" },
            enabled: true,
            created_at: new Date(),
            updated_at: new Date(),
        } as any);
    }

    // "FAQ - uses basic text infos + MODULE FAQ"
    if (slug === 'faq' && !hasFaqBlock) {
        blocks.push({
            id: -2,
            page_id: page.id,
            type: 'FAQ',
            position: 999,
            data: {},
            enabled: true,
            created_at: new Date(),
            updated_at: new Date(),
        } as any);
    }

    return (
        <DynamicPageContent page={page} blocks={blocks} faqItems={faqItems} />
    );
}
