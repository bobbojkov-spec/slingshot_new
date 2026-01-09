import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import OpenAI from 'openai';

// Initialized lazily inside handler

type CategoryTranslationPayload = {
  categoryId: string;
  slug?: string;
  translation_en: {
    name?: string;
    description?: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const body: CategoryTranslationPayload = await req.json();
    const { categoryId, slug, translation_en } = body;

    if (!categoryId || !translation_en?.name) {
      return NextResponse.json(
        { error: 'categoryId and English name are required' },
        { status: 400 }
      );
    }

    const englishName = translation_en.name.trim();
    const englishDescription = (translation_en.description || '').trim();

    const prompt = `
You are a professional translator. Translate the following category content from English to Bulgarian.
Keep brand terminology, technical terms, measurements, and product names as they are. Return the translation as valid JSON with "name" and "description" fields.

English category data:
${JSON.stringify({ name: englishName, description: englishDescription }, null, 2)}

Provide only the JSON object in your response.`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const translatedContent = JSON.parse(
      completion.choices[0].message?.content || '{}'
    );

    const finalName = translatedContent.name || englishName;
    const finalDescription = translatedContent.description || englishDescription;
    const finalSlug =
      slug ||
      englishName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    await query(
      `
        INSERT INTO category_translations (
          category_id,
          language_code,
          name,
          slug,
          description,
          updated_at
        ) VALUES (
          $1, 'bg', $2, $3, $4, NOW()
        )
        ON CONFLICT (category_id, language_code) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          updated_at = NOW()
      `,
      [categoryId, finalName, finalSlug, finalDescription]
    );

    return NextResponse.json({
      translation_bg: {
        name: finalName,
        description: finalDescription,
      },
    });
  } catch (error: any) {
    console.error('Category translation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to translate category' },
      { status: 500 }
    );
  }
}

