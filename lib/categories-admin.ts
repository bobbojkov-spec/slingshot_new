import { query } from '@/lib/db';

export async function getAdminCategoriesList() {
    const { rows } = await query(`
    SELECT 
      c.*,
      (SELECT CAST(COUNT(*) AS INTEGER) FROM products p WHERE p.category_id = c.id) as product_count,
      (SELECT json_build_object('name', ct.name, 'description', ct.description)
       FROM category_translations ct 
       WHERE ct.category_id = c.id AND ct.language_code = 'en') as translation_en,
      (SELECT json_build_object('name', ct.name, 'description', ct.description)
       FROM category_translations ct 
       WHERE ct.category_id = c.id AND ct.language_code = 'bg') as translation_bg
    FROM categories c
    ORDER BY c.name ASC
  `);
    return rows;
}
