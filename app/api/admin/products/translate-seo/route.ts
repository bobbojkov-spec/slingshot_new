import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
    try {
        const { fields } = await req.json();
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        if (!fields || typeof fields !== 'object') {
            return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });
        }

        const openai = new OpenAI({ apiKey });

        const prompt = `
You are a professional translator for an e-commerce platform.
Translate the following SEO metadata from English to Bulgarian.
Preserve brand names, technical terms, and measurements.
The tone should be compelling and optimized for search engines.

English metadata:
${JSON.stringify(fields, null, 2)}

Return ONLY a JSON object with the exact same keys.
`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        });

        const translatedFields = JSON.parse(completion.choices[0].message?.content || '{}');

        return NextResponse.json({ translatedFields });
    } catch (error: any) {
        console.error('SEO translation failed:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to translate SEO' },
            { status: 500 }
        );
    }
}
