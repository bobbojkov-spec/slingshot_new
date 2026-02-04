export interface SEOCheck {
    id: string;
    name: string;
    passed: boolean;
    score: number;
    message: string;
    impactWeight: number;
}

export interface SEOResult {
    score: number;
    checks: SEOCheck[];
}

export interface SEOData {
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
    og_title?: string;
    og_description?: string;
    og_image_id?: number | null;
    canonical_url?: string;
}

export function calculateSEOScore(data: SEOData): SEOResult {
    const checks: SEOCheck[] = [];

    // 1. Meta Title Check
    const title = data.seo_title || '';
    const titleLength = title.length;
    let titleScore = 0;
    let titleMessage = 'Missing meta title';

    if (titleLength >= 30 && titleLength <= 60) {
        titleScore = 20;
        titleMessage = 'Meta title length is optimal (30-60 characters)';
    } else if (titleLength > 0) {
        titleScore = 10;
        titleMessage = titleLength < 30 ? 'Meta title is too short (< 30 chars)' : 'Meta title is too long (> 60 chars)';
    }

    checks.push({
        id: 'meta_title',
        name: 'Meta Title',
        passed: titleScore === 20,
        score: titleScore,
        message: titleMessage,
        impactWeight: 20
    });

    // 2. Meta Description Check
    const desc = data.seo_description || '';
    const descLength = desc.length;
    let descScore = 0;
    let descMessage = 'Missing meta description';

    if (descLength >= 120 && descLength <= 160) {
        descScore = 20;
        descMessage = 'Meta description length is optimal (120-160 characters)';
    } else if (descLength > 0) {
        descScore = 10;
        descMessage = descLength < 120 ? 'Meta description is too short (< 120 chars)' : 'Meta description is too long (> 160 chars)';
    }

    checks.push({
        id: 'meta_description',
        name: 'Meta Description',
        passed: descScore === 20,
        score: descScore,
        message: descMessage,
        impactWeight: 20
    });

    // 3. Keywords Check
    const keywords = data.seo_keywords || '';
    const keywordCount = keywords ? keywords.split(',').filter(k => k.trim()).length : 0;
    let keywordScore = 0;
    let keywordMessage = 'No keywords defined';

    if (keywordCount >= 3 && keywordCount <= 10) {
        keywordScore = 15;
        keywordMessage = `Found ${keywordCount} keywords (optimal range: 3-10)`;
    } else if (keywordCount > 0) {
        keywordScore = 8;
        keywordMessage = keywordCount < 3 ? 'Too few keywords' : 'Too many keywords';
    }

    checks.push({
        id: 'keywords',
        name: 'SEO Keywords',
        passed: keywordScore === 15,
        score: keywordScore,
        message: keywordMessage,
        impactWeight: 15
    });

    // 4. Open Graph Image Check
    const hasOgImage = !!data.og_image_id;
    checks.push({
        id: 'og_image',
        name: 'Social Sharing Image',
        passed: hasOgImage,
        score: hasOgImage ? 15 : 0,
        message: hasOgImage ? 'Social image is set' : 'Missing social image',
        impactWeight: 15
    });

    // 5. Open Graph Metadata Check
    const hasOgMeta = !!(data.og_title && data.og_description);
    checks.push({
        id: 'og_meta',
        name: 'Social Sharing Text',
        passed: hasOgMeta,
        score: hasOgMeta ? 15 : 0,
        message: hasOgMeta ? 'Social metadata is complete' : 'Missing social title or description',
        impactWeight: 15
    });

    // 6. Canonical URL Check
    const hasCanonical = !!data.canonical_url;
    checks.push({
        id: 'canonical',
        name: 'Canonical URL',
        passed: hasCanonical,
        score: hasCanonical ? 15 : 0,
        message: hasCanonical ? 'Canonical URL is set' : 'Missing canonical URL',
        impactWeight: 15
    });

    const totalScore = checks.reduce((sum, c) => sum + c.score, 0);

    return {
        score: Math.min(100, totalScore),
        checks
    };
}
