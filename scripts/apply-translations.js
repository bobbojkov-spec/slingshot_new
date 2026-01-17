
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const menuGroups = {
    'Accessories': 'Аксесоари',
    'Harnesses': 'Трапеци',
    'Wetsuits': 'Неопрени',
    'Apparel': 'Облекло',
    'Protection': 'Защита',
    'Bags': 'Чанти',
    'Gear': 'Екипировка',
    'Categories': 'Категории'
};

const collections = {
    'kites': 'Високопроизводителни хвърчила за големи скокове, свободен стил и фрирайд сесии.',
    'surfboards': 'Дирекшънъл сърфборди за каране на вълни.',
    'twin-tips': 'Универсални туин-тип дъски за всякакъв вид кайбординг.',
    'trainer-kites': 'Научете се да карате кайт с учебни хвърчила.',
    'apparel': 'Маркови дрехи и екипировка на Slingshot.',
    'big-air': 'Екипировка, оптимизирана за големи скокове.',
    'kite-foil-boards': 'Специализирани дъски за кайт фойл.',
    'kite-main': 'Високопроизводителни хвърчила за големи скокове, свободен стил и фрирайд сесии.',
    'bars': 'Прецизни контролни барове за кайтбординг.',
    'kite-foils': 'Пълни фойл системи за кайтбординг.',
    'kite-accessories': 'Основни аксесоари за вашата кайт настройка.',
    'pumps': 'Помпи с високо налягане за надуваеми хвърчила.',
    'kite-parts': 'Резервни части и подобрения.',
    'wave-mastery': 'Екипировка за съвършенство в карането на вълни.',
    'wings': 'Високопроизводителни крила за винг фойл.',
    'wing-boards': 'Производителни винг фойл дъски за всички нива на умения и условия.',
    'wing-foils': 'Пълни фойл системи за винг фойл.',
    'wing-accessories': 'Основни аксесоари за винг фойл.',
    'board-mounting-systems': 'Монтажни системи за фойл дъски.',
    'wing-flow-state': 'Екипировка за върховно реене.',
    'quick-flite': 'Бърза и лесна настройка за винг фойл.',
    'wake-main': 'Професионални уейкборди и ботуши, проектирани за парк и лодка. Ненадминат поп, гъвкавост и контрол.',
    'wake-boots': 'Удобни и поддържащи уейкборд ботуши.',
    'wake-foil-boards': 'Дъски, проектирани за уейк фойл.',
    'wake-foils': 'Пълни фойл системи за уейк фойл.',
    'wakesurf': 'Уейксърф дъски за безкрайни вълни.',
    'gummy-straps': 'Удобни връзки с гумени каишки.',
    'wake-parts': 'Резервни части за уейк екипировка.',
    'jibbers': 'Дъски, оптимизирани за джибинг в кейбъл паркове.',
    'cable-quick-start': 'Всичко необходимо за започване на кейбъл райдинг.',
    'wake-foil-quick-start': 'Пълни пакети за начинаещи в уейк фойла.',
    'foil-boards': 'Специализирани дъски за фойл.',
    'foil-packages': 'Пълни фойл пакети, готови за каране.',
    'web-specials-foil-masts': 'Намалени фойл мачти.',
    'web-specials-kite': 'Намалена кайт екипировка и оборудване.',
    'web-specials-kites': 'Намалени хвърчила.',
    'kite-bars': 'Системи за прецизен контрол.',
    'wing-main': 'Иновативни хидрофойли, крила и дъски за безпроблемно плъзгане и скорост. Преминете границите си.',
    'wing-sup-boards': 'SUP дъски, оптимизирани за винг фойл.',
    'wing-parts': 'Резервни части за крила и фойлове.',
    'wing-glide-zone': 'Екипировка за максимално реене.',
    'wakeboards': 'Водещи в индустрията уейкборди за кейбъл и лодка.',
    'wake-accessories': 'Основни аксесоари за уейкбординг.',
    'senders': 'Дъски, създадени за скачане.',
    'wake-glide-zone': 'Екипировка за гладък уейк фойл.',
    'dock-pump': 'Екипировка за док старт и уейк фойл.',
    'best-gear-for-dock-pumping': 'Основна екипировка за овладяване на док старта.',
    'foil-main': 'Производителни фойлове за кайт, уейк, сърф и винг фойл.',
    'foil-front-wings': 'Високопроизводителни предни крила за фойл.',
    'web-specials-foils': 'Ексклузивни оферти за фойл екипировка за всеки стил на каране и ниво.',
    'web-specials-foil-front-wings': 'Намалени предни крила за фойл.',
    'web-specials-foil-stabilizers': 'Намалени стабилизатори за фойл.',
    'web-specials-foil-packages': 'Намалени пълни фойл пакети.',
    'web-specials-foil-windsurf': 'Намалена уиндсърф фойл екипировка.',
    'web-specials-foil-parts': 'Намалени резервни части за фойл.',
    'web-specials-kite-bars': 'Намалени контролни барове за кайт.',
    'championship-freestyle': 'Фрийстайл хвърчила, проектирани за експлозивен поп и представяне на ниво подиум.',
    'ride-to-fly': 'Удобни за начинаещи кайт сърф фойл хвърчила за гладко, стабилно и лесно обучение.',
    'more-from-less': 'Минималистични кайт сърф фойл хвърчила за оптимална ефективност, подемна сила и контрол.'
};

async function run() {
    try {
        console.log("Applying translations...");

        // Update Menu Groups
        for (const [en, bg] of Object.entries(menuGroups)) {
            const res = await pool.query(
                `UPDATE menu_groups SET title_bg = $1 WHERE title = $2`,
                [bg, en]
            );
            if (res.rowCount > 0) console.log(`Updated Menu Group: ${en} -> ${bg}`);
        }

        // Update Collections
        for (const [slug, bgSubtitle] of Object.entries(collections)) {
            // Upsert translation
            // First get collection ID
            const cRes = await pool.query(`SELECT id FROM collections WHERE slug = $1`, [slug]);
            if (cRes.rows.length === 0) {
                console.log(`Skipping unknown collection: ${slug}`);
                continue;
            }
            const collectionId = cRes.rows[0].id;

            // Upsert
            const upRes = await pool.query(`
                INSERT INTO collection_translations (collection_id, language_code, title, subtitle)
                VALUES ($1, 'bg', (SELECT title FROM collection_translations WHERE collection_id=$1 AND language_code='bg'), $2)
                ON CONFLICT (collection_id, language_code) 
                DO UPDATE SET subtitle = $2
            `, [collectionId, bgSubtitle]);
            console.log(`Updated Collection Translation: ${slug}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
