
import { getFaqItems } from '@/lib/db/repositories/faq';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Collapse } from 'antd'; // Or better, use a custom Tailwind accordion to avoid Antd in frontend if possible, but Antd is available.
// Actually, sticking to Tailwind is better for performance and visual consistency with the site.
import FaqAccordion from './FaqAccordion'; // Client component for interactivity

export default async function FaqModule() {
    const items = await getFaqItems(true); // activeOnly = true

    return (
        <section className="max-w-4xl mx-auto py-12 px-4">
            <FaqAccordion items={items} />
        </section>
    );
}
