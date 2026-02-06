
"use client";

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Page, PageBlock, FaqItem } from '@/lib/db/models';
import FaqAccordion from './modules/FaqAccordion'; // Client
import ContactForm from './modules/ContactForm'; // Client
import Image from 'next/image';

interface DynamicPageContentProps {
    page: Page;
    blocks: PageBlock[];
    faqItems: FaqItem[];
}

export default function DynamicPageContent({ page, blocks, faqItems }: DynamicPageContentProps) {
    const { language } = useLanguage();

    const title = language === 'bg' ? (page.title_bg || page.title) : page.title;

    // Separate Hero blocks (Legacy support)
    const heroBlock = blocks.find(b => b.type === 'HERO' && b.enabled);
    const contentBlocks = blocks.filter(b => b.type !== 'HERO' && b.enabled);

    // Determine Hero Data (New > Legacy)
    // We expect signed URLs or direct paths. If signed_hero_image_url is present (from server), use it? 
    // Actually the prop `page` might reference the DB Record. The Server Component `app/[slug]/page.tsx` needs to ensure signed URLs if they are private.
    // For now assuming public or simple paths, or that the Prop passed down has what we need.
    // In `page.tsx` we fetch with `getPageBySlug`. If `getPageBySlug` doesn't sign, we might have issues if bucket is private.
    // However, existing HERO block worked with `image_url`. 
    // Let's use `page.hero_image_url` / `page.hero_video_url`.

    const heroImage = page.hero_image_url || (heroBlock?.data?.image_url as string);
    const heroVideo = page.hero_video_url || (heroBlock?.data?.video_url as string);
    const heroSubtitle = language === 'bg'
        ? (page.subtitle_bg || heroBlock?.data?.subtitle_bg)
        : (page.subtitle_en || heroBlock?.data?.subtitle_en);

    // Main Content logic
    const mainContent = language === 'bg' ? page.content_bg : page.content;

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            {(heroImage || heroVideo) ? (
                <div className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center overflow-hidden">
                    {heroVideo ? (
                        <video
                            src={heroVideo}
                            autoPlay muted loop playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <Image
                            src={heroImage || '/placeholder.jpg'}
                            alt={title}
                            fill
                            className="object-cover"
                            priority
                        />
                    )}
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative z-10 text-center text-white p-4 max-w-4xl">
                        <h1 className="text-4xl md:text-6xl font-bold mb-4 uppercase tracking-tight drop-shadow-lg">{title}</h1>
                        {heroSubtitle && (
                            <p className="text-lg md:text-xl opacity-90 drop-shadow-md">
                                {heroSubtitle as string}
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-gray-100 py-20 md:py-32 px-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 uppercase tracking-tight">{title}</h1>
                </div>
            )}

            {/* Main Content & Blocks */}
            <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">

                {/* 1. Main Page Body (New Tiptap Content) */}
                {mainContent && (
                    <div className="prose prose-lg max-w-none text-gray-700">
                        <div dangerouslySetInnerHTML={{ __html: mainContent }} />
                    </div>
                )}
                {contentBlocks.map((block) => {
                    const data = block.data || {};
                    const blockTitle = language === 'bg' ? (data.title_bg || data.title_en) : data.title_en;
                    const blockContent = language === 'bg' ? (data.content_bg || data.content_en) : data.content_en;

                    if (block.type === 'TEXT') {
                        return (
                            <div key={block.id} className="prose prose-lg max-w-none text-gray-700">
                                {blockTitle && <h2 className="text-3xl font-bold mb-6 text-gray-900">{blockTitle}</h2>}
                                <div dangerouslySetInnerHTML={{ __html: blockContent as string || '' }} />
                            </div>
                        );
                    }

                    if (block.type === 'TEXT_IMAGE') {
                        return (
                            <div key={block.id} className={`flex flex-col md:flex-row gap-12 items-center ${data.layout === 'right' ? 'md:flex-row-reverse' : ''}`}>
                                <div className="flex-1 prose prose-lg text-gray-700">
                                    {blockTitle && <h2 className="text-3xl font-bold mb-6 text-gray-900">{blockTitle}</h2>}
                                    <div dangerouslySetInnerHTML={{ __html: blockContent as string || '' }} />
                                </div>
                                <div className="flex-1 w-full">
                                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden md:shadow-xl">
                                        <Image
                                            src={(data.image_url as string) || '/placeholder.jpg'}
                                            alt={blockTitle as string || ''}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    if (block.type === 'FAQ') {
                        return (
                            <div key={block.id} className="w-full">
                                {blockTitle && <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">{blockTitle}</h2>}
                                <FaqAccordion items={faqItems} />
                            </div>
                        );
                    }

                    if (block.type === 'CONTACT_FORM') {
                        return (
                            <div key={block.id} className="w-full bg-gray-50 rounded-xl p-8 md:p-12">
                                {blockTitle && <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">{blockTitle}</h2>}
                                <ContactForm />
                            </div>
                        );
                    }

                    return null;
                })}
            </div>
        </div>
    );
}
