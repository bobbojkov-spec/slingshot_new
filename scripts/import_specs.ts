
import fs from 'fs';
import path from 'path';
import { query } from '../lib/db';

const SCRAPED_DIR = path.join(process.cwd(), 'scraped_data', 'specs');

async function main() {
    try {
        if (!fs.existsSync(SCRAPED_DIR)) {
            console.error('Scraped directory not found.');
            return;
        }

        const files = fs.readdirSync(SCRAPED_DIR).filter(f => f.endsWith('.json'));
        console.log(`Found ${files.length} files to import.`);

        for (const file of files) {
            const raw = fs.readFileSync(path.join(SCRAPED_DIR, file), 'utf8');
            const data = JSON.parse(raw);
            const { slug, specs_html, package_includes, description_html, description_html2 } = data;

            console.log(`Importing ${slug}...`);

            // Only update fields if they have content
            const updateFields = [];
            const values = [];
            let idx = 1;

            if (specs_html) {
                updateFields.push(`specs_html = $${idx++}`);
                values.push(specs_html);
            }
            if (package_includes) {
                updateFields.push(`package_includes = $${idx++}`);
                values.push(package_includes);
            }
            if (description_html) {
                updateFields.push(`description_html = $${idx++}`);
                values.push(description_html);
            }
            if (description_html2) {
                updateFields.push(`description_html2 = $${idx++}`);
                values.push(description_html2);
            }

            if (updateFields.length > 0) {
                try {
                    values.push(slug); // last param
                    await query(`
                        UPDATE products 
                        SET ${updateFields.join(', ')}
                        WHERE slug = $${idx}
                    `, values);
                    console.log(`Updated ${slug}`);
                } catch (dbErr) {
                    console.error(`Failed DB update for ${slug}`, dbErr);
                }
            } else {
                console.log(`No data to update for ${slug}`);
            }
        }
    } catch (err) {
        console.error('Fatal error:', err);
    }
}

main();
