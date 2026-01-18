import { query } from '../lib/db';

async function main() {
    console.log('Cleaning bad data...');
    
    // 1. Clean description_html2 (footer garbage)
    await query(`
        UPDATE products 
        SET description_html2 = '' 
        WHERE description_html2 LIKE '%site-footer%' 
           OR description_html2 LIKE '%footer__collapsible%'
    `, []);
    console.log('Cleaned description_html2');

    // 2. Clean specs_html (no table)
    await query(`
        UPDATE products 
        SET specs_html = '' 
        WHERE specs_html NOT LIKE '%<table%'
    `, []);
    console.log('Cleaned specs_html');
}

main();
