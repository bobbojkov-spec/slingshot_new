import { NextResponse } from 'next/server';
import { translateMissingSpecs } from '@/lib/translation-manager';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Trigger the translation process
        // Note: This might timeout on Vercel/Railway if there are many products, 
        // but for a trigger it's fine or we could use background jobs. 
        // For now, we await it to see the result.
        await translateMissingSpecs();

        return NextResponse.json({ success: true, message: 'Missing specs translation process completed.' });
    } catch (error: any) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { error: 'Failed to run translations', details: error.message },
            { status: 500 }
        );
    }
}
