import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import OpenAI from 'openai';

// Initialized lazily inside handler

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    console.log(`[AI Translate] Starting translation for product ${productId}`);

    // 1. Fetch English translation
    const { rows: enRows } = await query(
      'SELECT * FROM product_translations WHERE product_id = $1 AND language_code = $2',
      [productId, 'en']
    );

    if (!enRows || enRows.length === 0) {
      return NextResponse.json({ error: 'English translation not found' }, { status: 404 });
    }

    const enTranslation = enRows[0];

    // 2. Prepare content for translation
    const contentToTranslate = {
      title: enTranslation.title || '',
      description_html: enTranslation.description_html || '',
      description_html2: enTranslation.description_html2 || '',
      specs_html: enTranslation.specs_html || '',
      package_includes: enTranslation.package_includes || '',
      tags: enTranslation.tags || [],
      seo_title: enTranslation.seo_title || '',
      seo_description: enTranslation.seo_description || '',
    };

    console.log('[AI Translate] Content prepared, calling OpenAI...');

    // 3. Call OpenAI for translation
    const prompt = `You are a professional translator specializing in product descriptions for sports equipment (wakeboards, foilboards, kiteboards, etc.).

Translate the following product content from English to Bulgarian. 

IMPORTANT RULES:
- Keep ALL HTML tags exactly as they are (e.g., <p>, <strong>, </p>, etc.)
- Keep brand names in English (e.g., "Slingshot", "Ghost", "Sentry", "WF-1")
- Keep technical terms and model numbers in English
- Keep measurements in their original format
- Translate naturally and professionally for the Bulgarian market
- Preserve the tone: exciting and promotional

Content to translate:
${JSON.stringify(contentToTranslate, null, 2)}

Return ONLY a valid JSON object with the same structure, but with Bulgarian translations. Do not add any explanation or markdown formatting.`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Return ONLY valid JSON, no markdown or explanation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const translatedContent = JSON.parse(completion.choices[0].message.content || '{}');

    console.log('[AI Translate] Translation received from OpenAI');

    // 4. Update Bulgarian translation in database
    await query(
      `
        UPDATE product_translations
        SET
          title = $1,
          description_html = $2,
          description_html2 = $3,
          specs_html = $4,
          package_includes = $5,
          tags = $6,
          seo_title = $7,
          seo_description = $8,
          updated_at = NOW()
        WHERE product_id = $9 AND language_code = 'bg'
      `,
      [
        translatedContent.title || enTranslation.title,
        translatedContent.description_html || enTranslation.description_html,
        translatedContent.description_html2 || enTranslation.description_html2,
        translatedContent.specs_html || enTranslation.specs_html,
        translatedContent.package_includes || enTranslation.package_includes,
        translatedContent.tags || enTranslation.tags,
        translatedContent.seo_title || enTranslation.seo_title,
        translatedContent.seo_description || enTranslation.seo_description,
        productId,
      ]
    );

    console.log('[AI Translate] Bulgarian translation updated in database');

    return NextResponse.json({
      success: true,
      message: 'Product translated to Bulgarian successfully!',
      translation: translatedContent,
    });
  } catch (error: any) {
    console.error('[AI Translate] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Translation failed' },
      { status: 500 }
    );
  }
}

