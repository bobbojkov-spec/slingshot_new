import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API Key is missing' },
                { status: 500 }
            );
        }

        const languageName = LANUGAGE_NAMES[lang] || 'English';
        let systemPrompt = '';
        let userPrompt = '';

        if (type === 'keywords') {
            systemPrompt = `You are an SEO expert specializing in the ${languageName} market. Generate high-value, relevant keywords based on the user's input. Return strictly JSON format.`;
            userPrompt = `Generate a list of 10-15 high-value SEO keywords related to "${term}" specifically for the ${languageName} market/language.
            Return a JSON object with a key "results" which is an array of objects. Each object should have:
            - "keyword": the keyword string in ${languageName}
            - "volume": estimated monthly search volume (e.g. "High", "Medium", "Low")
            - "difficulty": estimated difficulty (e.g. "Hard", "Medium", "Easy")
            - "intent": search intent (e.g. "Informational", "Transactional", "Navigational")`;
        } else if (type === 'questions') {
            systemPrompt = `You are a content strategist specializing in the ${languageName} market. Generate user questions based on the user's input. Return strictly JSON format.`;
            userPrompt = `Generate a list of 10 common questions users ask about "${term}" in ${languageName}.
            Return a JSON object with a key "results" which is an array of objects. Each object should have:
            - "question": the question string in ${languageName}
            - "intent": the underlying need (e.g. "Learning", "Buying", "Troubleshooting")`;
        } else if (type === 'competitors') {
            systemPrompt = `You are a market researcher specializing in the ${languageName} market. Identify top competitors based on the user's input. Return strictly JSON format.`;
            userPrompt = `Identify 5-7 top online competitors or relevant websites for "${term}" in the ${languageName} market.
            Return a JSON object with a key "results" which is an array of objects. Each object should have:
            - "name": the competitor's name
            - "url": their website URL
            - "strength": their key strength or market positioning`;
        } else {
            return NextResponse.json(
                { error: 'Invalid research type' },
                { status: 400 }
            );
        }

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error('No content received from OpenAI');
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
