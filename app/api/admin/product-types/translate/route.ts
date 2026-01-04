import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type ProductTypeTranslationPayload = {
  productTypeId: string;
  slug?: string;
  translation_en: {
    name: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const body: ProductTypeTranslationPayload = await req.json();
    const { productTypeId, slug, translation_en } = body;

    if (!productTypeId || !translation_en?.name) {
      return NextResponse.json(
        { error: 'productTypeId and English name are required' },
        { status: 400 }
      );
    }

    const englishName = translation_en.name.trim();

    const prompt = `
You are a professional translator. Translate the following product type name from English to Bulgarian while preserving brand terminology, model names, and numbers. Return a JSON object with a "name" field.

English value:
"${englishName}"

Provide only the JSON object in your response.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const translatedContent = JSON.parse(
      completion.choices[0].message?.content || '{}'
    );

    const finalName = translatedContent.name || englishName;
    const finalSlug =
      slug ||
      englishName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    await query(
      `
        INSERT INTO product_type_translations (
          product_type_id,
          language_code,
          name,
          slug,
          updated_at
        ) VALUES (
          $1, 'bg', $2, $3, NOW()
        )
        ON CONFLICT (product_type_id, language_code) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          updated_at = NOW()
      `,
      [productTypeId, finalName, finalSlug]
    );

    return NextResponse.json({
      translation_bg: {
        name: finalName,
      },
    });
  } catch (error: any) {
    console.error('Product type translation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to translate product type' },
      { status: 500 }
    );
  }
}

