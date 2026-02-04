import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const { text, type = 'text' } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Missing text' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = type === 'html'
            ? `Translate the following HTML content from English to Bulgarian. Preserve all HTML tags, attributes, and structure. Only translate the text content.
               
               English HTML:
               ${text}`
            : `Translate the following text from English to Bulgarian. Preserve brand names, model numbers, and technical terms.
               
               English text:
               ${text}`;

        const result = await model.generateContent(prompt);
        const translated = result.response.text().trim() || '';

        return NextResponse.json({ translated });
    } catch (error: any) {
        console.error('Translation failed:', error);
        return NextResponse.json({ error: error?.message || 'Translation failed' }, { status: 500 });
    }
}
