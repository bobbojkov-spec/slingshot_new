import 'dotenv/config';
import { runAllTranslations } from '../lib/translation-manager';

async function main() {
    console.log('Starting batch translations with Gemini...');
    try {
        await runAllTranslations();
        console.log('Batch translations completed successfully!');
    } catch (error) {
        console.error('Batch translation failed:', error);
        process.exit(1);
    }
}

main();
