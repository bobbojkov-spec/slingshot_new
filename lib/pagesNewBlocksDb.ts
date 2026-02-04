import { PoolClient } from 'pg';
import { query, transaction } from './dbPg';

export type BlockType = 'HERO' | 'TEXT' | 'TEXT_IMAGE';

export type PageBlockRecord = {
    id: number;
    page_id: number;
    type: BlockType;
    position: number;
    data: Record<string, unknown> | null;
    enabled: boolean | null;
    created_at: string | null;
    gallery_images?: never;
};

export const BLOCK_COLUMNS = ['id', 'page_id', 'type', 'position', 'data', 'enabled', 'created_at'].join(', ');
export const BLOCK_TYPES: BlockType[] = ['HERO', 'TEXT', 'TEXT_IMAGE'];

export async function listBlocksForPage(pageId: number): Promise<PageBlockRecord[]> {
    const { rows } = await query(
        `SELECT ${BLOCK_COLUMNS} FROM page_blocks WHERE page_id = $1 ORDER BY position ASC`,
        [pageId]
    );

    return rows;
}

const ALLOWED_TYPES: BlockType[] = BLOCK_TYPES;

export async function createBlock({
    pageId,
    type,
    data,
}: {
    pageId: number;
    type: BlockType;
    data: Record<string, unknown>;
}): Promise<PageBlockRecord> {
    if (!ALLOWED_TYPES.includes(type)) {
        throw new Error('Invalid block type');
    }

    return transaction(async (client: PoolClient) => {
        if (type === 'HERO') {
            const heroCount = await client.query(
                'SELECT COUNT(*)::int AS count FROM page_blocks WHERE page_id = $1 AND type = $2',
                [pageId, 'HERO']
            );
            if (heroCount.rows[0].count > 0) {
                throw new Error('Only one hero block is allowed per page');
            }

            await client.query(
                'UPDATE page_blocks SET position = position + 1 WHERE page_id = $1',
                [pageId]
            );
        }

        const { rows: nextPositionRows } = await client.query(
            'SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM page_blocks WHERE page_id = $1',
            [pageId]
        );

        const position =
            type === 'HERO' ? 1 : Number(nextPositionRows[0]?.next_position ?? 1);

        const { rows } = await client.query(
            `
      INSERT INTO page_blocks (page_id, type, position, data, enabled)
      VALUES ($1, $2, $3, $4, true)
      RETURNING ${BLOCK_COLUMNS}
    `,
            [pageId, type, position, data]
        );

        return rows[0];
    });
}

export async function updateBlock(
    blockId: number,
    payload: { data?: Record<string, unknown>; enabled?: boolean }
): Promise<PageBlockRecord> {
    return transaction(async (client) => {
        const { rows: existingBlocks } = await client.query('SELECT type FROM page_blocks WHERE id = $1', [blockId]);
        if (!existingBlocks.length) {
            throw new Error('Block not found');
        }

        const blockType = existingBlocks[0].type as BlockType;
        const updates: string[] = [];
        const params: unknown[] = [];

        if (payload.data !== undefined) {
            params.push(payload.data);
            updates.push(`data = $${params.length}`);
        }

        if (payload.enabled !== undefined) {
            params.push(payload.enabled);
            updates.push(`enabled = $${params.length}`);
        }

        if (!updates.length) {
            throw new Error('No updates provided');
        }

        params.push(blockId);
        const { rows } = await client.query(
            `
      UPDATE page_blocks
      SET ${updates.join(', ')}
      WHERE id = $${params.length}
      RETURNING ${BLOCK_COLUMNS}
    `,
            params
        );

        if (!rows.length) {
            throw new Error('Block not found');
        }

        return rows[0];
    });
}

export async function deleteBlock(blockId: number): Promise<void> {
    await transaction(async (client) => {
        await client.query('DELETE FROM page_blocks WHERE id = $1', [blockId]);
    });
}

export async function reorderBlocks(pageId: number, orderedIds: number[]): Promise<PageBlockRecord[]> {
    if (!orderedIds.length) {
        return [];
    }

    return transaction(async (client: PoolClient) => {
        const { rows } = await client.query(
            'SELECT id, type FROM page_blocks WHERE page_id = $1 ORDER BY position',
            [pageId]
        );

        const existingIds = rows.map((row) => row.id);
        if (existingIds.length !== orderedIds.length || !orderedIds.every((id) => existingIds.includes(id))) {
            throw new Error('Ordered block list must include all existing blocks');
        }

        const hero = rows.find((row) => row.type === 'HERO');
        if (hero) {
            if (orderedIds[0] !== hero.id) {
                throw new Error('Hero block must remain at position 1');
            }
        }

        for (let index = 0; index < orderedIds.length; index += 1) {
            const blockId = orderedIds[index];
            await client.query(
                'UPDATE page_blocks SET position = $1 WHERE id = $2',
                [index + 1, blockId]
            );
        }

        const { rows: updated } = await client.query(
            `SELECT ${BLOCK_COLUMNS} FROM page_blocks WHERE page_id = $1 ORDER BY position`,
            [pageId]
        );

        return updated;
    });
}
