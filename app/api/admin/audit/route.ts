import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Google PageSpeed Insights API endpoint
const PSI_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const targetUrl = searchParams.get('url');

        if (!targetUrl) {
            return NextResponse.json(
                { error: 'Missing target URL' },
                { status: 400 }
            );
        }

        // We use categories: PERFORMANCE, SEO, ACCESSIBILITY, BEST_PRACTICES
        const categories = ['performance', 'seo', 'accessibility', 'best-practices'];

        const params = new URLSearchParams({
            url: targetUrl,
            category: categories,
            strategy: 'mobile', // Default to mobile as per mobile-first strategy
        } as any);

        // Add API key if available
        if (process.env.PAGESPEED_API_KEY) {
            params.append('key', process.env.PAGESPEED_API_KEY);
        }

        const response = await fetch(`${PSI_API_URL}?${params.toString()}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('PSI API Error:', errorText);
            throw new Error(`PageSpeed Insights API returned ${response.status}`);
        }

        const data = await response.json();

        // Extract simplified results for the UI
        const lighthouseResult = data.lighthouseResult;
        const auditResults = {
            url: targetUrl,
            fetchTime: lighthouseResult.fetchTime,
            scores: {
                performance: (lighthouseResult.categories.performance?.score || 0) * 100,
                seo: (lighthouseResult.categories.seo?.score || 0) * 100,
                accessibility: (lighthouseResult.categories.accessibility?.score || 0) * 100,
                bestPractices: (lighthouseResult.categories['best-practices']?.score || 0) * 100,
            },
            opportunities: Object.values(lighthouseResult.audits || {})
                .filter((audit: any) => audit.details?.type === 'opportunity' && audit.score < 0.9)
                .map((audit: any) => ({
                    id: audit.id,
                    title: audit.title,
                    description: audit.description,
                    score: audit.score,
                    displayValue: audit.displayValue,
                }))
                .sort((a: any, b: any) => a.score - b.score)
                .slice(0, 10), // Return top 10 opportunities
        };

        return NextResponse.json(auditResults);

    } catch (error: any) {
        console.error('Error generating audit:', error);
        return NextResponse.json(
            { error: 'Failed to generate audit results', details: error.message },
            { status: 500 }
        );
    }
}
