import { query } from '../index';
import { Promotion } from '../models';

export const promotionsRepository = {
    async getAll(): Promise<Promotion[]> {
        const result = await query('SELECT * FROM promotions ORDER BY created_at DESC');
        return result.rows;
    },

    async getById(id: string): Promise<Promotion | null> {
        const result = await query('SELECT * FROM promotions WHERE id = $1', [id]);
        return result.rows[0] || null;
    },

    async getActivePromotions(): Promise<Promotion[]> {
        const now = new Date();
        const result = await query(
            `SELECT * FROM promotions 
             WHERE is_active = true 
             AND (valid_from IS NULL OR valid_from <= $1)
             AND (valid_to IS NULL OR valid_to >= $1)
             ORDER BY created_at DESC`,
            [now]
        );
        return result.rows;
    },

    async create(data: Partial<Promotion>): Promise<Promotion> {
        const { title, content, image_url, display_type, placement, valid_from, valid_to, is_active } = data;
        const result = await query(
            `INSERT INTO promotions (title, content, image_url, display_type, placement, valid_from, valid_to, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [title, content, image_url, display_type || 'small', placement || 'homepage', valid_from, valid_to, is_active ?? true]
        );
        return result.rows[0];
    },

    async update(id: string, data: Partial<Promotion>): Promise<Promotion | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        const updatableFields = ['title', 'content', 'image_url', 'display_type', 'placement', 'valid_from', 'valid_to', 'is_active'];

        updatableFields.forEach(field => {
            if (data[field as keyof Promotion] !== undefined) {
                fields.push(`${field} = $${i}`);
                values.push(data[field as keyof Promotion]);
                i++;
            }
        });

        if (fields.length === 0) return this.getById(id);

        values.push(id);
        const result = await query(
            `UPDATE promotions SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    },

    async delete(id: string): Promise<boolean> {
        const result = await query('DELETE FROM promotions WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }
};
