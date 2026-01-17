
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const translations = {
    "Apparel": "Облекло",
    "Bags": "Чанти",
    "Board Bags": "Калъфи за дъски",
    "Day Protection": "Ежедневна защита",
    "E Inflation": "Електрическо помпене",
    "Foot Straps": "Страпове",
    "Hand Knee Protection": "Защита за ръце и колене",
    "Harnesses": "Трапеци",
    "Harness Parts Accessories": "Части и аксесоари за трапеци",
    "Hats": "Шапки",
    "Helmets": "Каски",
    "Hoodies": "Суичъри",
    "Hyperlock System": "Система Hyperlock",
    "Impact Vests": "Защитни жилетки",
    "Inflation Accessories": "Аксесоари за помпене",
    "Leashes": "Лишове",
    "Manual Pumps": "Ръчни помпи",
    "Mens Wetsuits": "Мъжки неопрени",
    "Performance Pwc": "Performance PWC",
    "Performance Sleds": "Спасителни шейни",
    "Protection": "Защита",
    "Pwc Collars Pontoons": "PWC буйове и понтони",
    "Robes Ponchos": "Пончота и халати",
    "Spreader Bars": "Куки за трапеци",
    "Technical Jackets": "Технически якета",
    "T Shirts": "Тениски",
    "Vehicle Accessories": "Аксесоари за автомобил",
    "Water Wear": "Водно облекло",
    "Wetsuit Accessories": "Аксесоари за неопрени",
    "Wetsuits": "Неопрени",
    "Wheeled Travel Bags": "Чанти с колела",
    "Wing Foil Harnesses": "Трапеци за уинг фойл",
    "Womens Wetsuits": "Дамски неопрени"
};

async function run() {
    try {
        for (const [enTitle, bgTitle] of Object.entries(translations)) {
            // Find collection by EN title
            const res = await pool.query('SELECT id FROM collections WHERE title = $1', [enTitle]);
            if (res.rows.length === 0) {
                console.log(`Collection not found: ${enTitle}`);
                continue;
            }
            const collectionId = res.rows[0].id;

            // Update BG translation
            const sql = `
        INSERT INTO collection_translations (collection_id, language_code, title, description, slug)
        VALUES ($1, 'bg', $2, '', '')
        ON CONFLICT (collection_id, language_code) 
        DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()
      `;

            await pool.query(sql, [collectionId, bgTitle]);

            console.log(`Updated: ${enTitle} -> ${bgTitle}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
