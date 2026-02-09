import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

type ResearchType = 'keywords' | 'questions' | 'competitors';

interface ResearchRequest {
    term: string;
    lang: 'en' | 'de' | 'bg';
    type: ResearchType;
}

const LANUGAGE_NAMES = {
    en: 'English',
    de: 'German',
    bg: 'Bulgarian',
};

export async function POST(request: NextRequest) {
    try {
        const body: ResearchRequest = await request.json();
        const { term, lang, type } = body;

        if (!term || !lang || !type) {
            return NextResponse.json(
                { error: 'Missing required fields: term, lang, type' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY is missing' },
                { status: 500 }
            );
        }

        const languageName = LANUGAGE_NAMES[lang] || 'English';
        let userPrompt = '';

        if (type === 'keywords') {
            userPrompt = `You are an SEO expert specializing in the ${languageName} market. Generate a list of 10-15 high-value SEO keywords related to "${term}" specifically for the ${languageName} market.
            Return ONLY a JSON object with a key "results" which is an array of objects. Each object must have:
            - "keyword": the keyword string in ${languageName}
            - "volume": estimated monthly search volume (e.g. "High", "Medium", "Low")
            - "difficulty": estimated difficulty (e.g. "Hard", "Medium", "Easy")
            - "intent": search intent (e.g. "Informational", "Transactional", "Navigational")`;
        } else if (type === 'questions') {
            userPrompt = `You are a content strategist specializing in the ${languageName} market. Generate a list of 10 common questions users ask about "${term}" in ${languageName}.
            Return ONLY a JSON object with a key "results" which is an array of objects. Each object must have:
            - "question": the question string in ${languageName}
            - "intent": the underlying need (e.g. "Learning", "Buying", "Troubleshooting")`;
        } else if (type === 'competitors') {
            userPrompt = `You are a market researcher specializing in the ${languageName} market. Identify 5-7 top online competitors or relevant websites for "${term}" in the ${languageName} market.
            Return ONLY a JSON object with a key "results" which is an array of objects. Each object must have:
            - "name": the competitor's name
            - "url": their website URL
            - "strength": their key strength or market positioning`;
        } else {
            return NextResponse.json(
                { error: 'Invalid research type' },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });

        const result = await model.generateContent(userPrompt);
        const content = result.response.text();

        if (!content) {
            throw new Error('No content received from Gemini');
        }

        const data = JSON.parse(content);

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error generating research:', error);
        return NextResponse.json(
            { error: 'Failed to generate research', details: error.message },
            { status: 500 }
        );
    }
}
