import { runAllTranslations } from '../lib/translation-manager.js';

runAllTranslations()
  .then(() => {
    console.log('✅ All translations completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Translation script failed', error);
    process.exit(1);
  });

