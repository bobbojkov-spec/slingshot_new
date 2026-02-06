
import { query, queryOne } from '../connection';
import { FaqItem } from '../models';

export async function getFaqItems(activeOnly: boolean = false): Promise<FaqItem[]> {
    let sql = 'SELECT * FROM faq_items';
    const params: any[] = [];
    if (activeOnly) {
        sql += ' WHERE is_active = TRUE';
    }
    sql += ' ORDER BY sort_order ASC, created_at DESC';
    return await query<FaqItem>(sql, params);
}

export async function getFaqItemById(id: number): Promise<FaqItem | null> {
    return await queryOne<FaqItem>('SELECT * FROM faq_items WHERE id = ?', [id]);
}

export async function createFaqItem(item: Omit<FaqItem, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await query<{ insertId: number }>(
        `INSERT INTO faq_items (question_en, question_bg, answer_en, answer_bg, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            item.question_en,
            item.question_bg || null,
            item.answer_en,
            item.answer_bg || null,
            item.sort_order || 0,
            item.is_active // Pass boolean directly for Postgres
        ]
    );
    return result[0]?.insertId || 0;
}

export async function updateFaqItem(id: number, item: Partial<Omit<FaqItem, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(item).forEach(([key, value]) => {
        if (value !== undefined) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
    });

    if (fields.length === 0) return false;

    values.push(id);
    await query(`UPDATE faq_items SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
}

export async function deleteFaqItem(id: number): Promise<boolean> {
    await query('DELETE FROM faq_items WHERE id = ?', [id]);
    return true;
}

export async function reorderFaqItems(updates: { id: number; sort_order: number }[]): Promise<boolean> {
    if (updates.length === 0) return true;
    for (const update of updates) {
        await query('UPDATE faq_items SET sort_order = ? WHERE id = ?', [update.sort_order, update.id]);
    }
    return true;
}
