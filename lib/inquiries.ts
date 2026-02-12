import { query } from '@/lib/db';

export type InquiryItemInput = {
  product_id: string;
  product_name: string;
  product_slug: string | null;
  product_image: string | null;
  variant_id: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  price: number | null;
};

export type InquiryInput = {
  name: string;
  email: string;
  phone: string;
  message?: string | null;
  items: InquiryItemInput[];
};

export type InquiryRecord = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_message: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
};

export type InquiryWithItems = InquiryRecord & {
  is_archived: boolean;
  items: InquiryItemInput[];
};

const TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_message TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS inquiry_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_slug TEXT,
    product_image TEXT,
    variant_id TEXT,
    size TEXT,
    color TEXT,
    quantity INT NOT NULL DEFAULT 1,
    price NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS inquiry_items_inquiry_id_idx ON inquiry_items(inquiry_id);
  CREATE INDEX IF NOT EXISTS inquiries_status_idx ON inquiries(status);
  CREATE INDEX IF NOT EXISTS inquiries_archived_idx ON inquiries(is_archived);
`;

export async function ensureInquiriesTables() {
  await query(TABLE_SQL);
}

export async function createInquiry(payload: InquiryInput): Promise<InquiryRecord> {
  await ensureInquiriesTables();

  const { rows } = await query(
    `INSERT INTO inquiries (customer_name, customer_email, customer_phone, customer_message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, customer_name, customer_email, customer_phone, customer_message, status, created_at`,
    [payload.name, payload.email, payload.phone, payload.message || null]
  );

  const inquiry = rows[0] as InquiryRecord;

  if (payload.items?.length) {
    const values: any[] = [];
    const placeholders = payload.items
      .map((item, index) => {
        const baseIndex = index * 10;
        values.push(
          inquiry.id,
          item.product_id,
          item.product_name,
          item.product_slug,
          item.product_image,
          item.variant_id,
          item.size,
          item.color,
          item.quantity,
          item.price
        );
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10})`;
      })
      .join(', ');

    await query(
      `INSERT INTO inquiry_items (
        inquiry_id, product_id, product_name, product_slug, product_image, variant_id, size, color, quantity, price
      ) VALUES ${placeholders}`,
      values
    );
  }

  return inquiry;
}

export async function listInquiries(limit = 50, includeArchived = false) {
  await ensureInquiriesTables();
  const { rows } = await query(
    `SELECT id, customer_name, customer_email, customer_phone, customer_message, status, created_at, updated_at
     FROM inquiries
     WHERE ($2::boolean IS TRUE OR is_archived = false)
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit, includeArchived]
  );
  return rows as InquiryRecord[];
}

export async function listInquiriesWithItems(limit = 50, includeArchived = false): Promise<InquiryWithItems[]> {
  await ensureInquiriesTables();
  const { rows } = await query(
    `SELECT i.id, i.customer_name, i.customer_email, i.customer_phone, i.customer_message,
            i.status, i.created_at, i.updated_at, i.is_archived,
            COALESCE(json_agg(json_build_object(
              'product_id', ii.product_id,
              'product_name', ii.product_name,
              'product_slug', ii.product_slug,
              'product_image', ii.product_image,
              'variant_id', ii.variant_id,
              'size', ii.size,
              'color', ii.color,
              'quantity', ii.quantity,
              'price', ii.price
            )) FILTER (WHERE ii.id IS NOT NULL), '[]') as items
     FROM inquiries i
     LEFT JOIN inquiry_items ii ON ii.inquiry_id = i.id
     WHERE ($2::boolean IS TRUE OR i.is_archived = false)
     GROUP BY i.id
     ORDER BY i.created_at DESC
     LIMIT $1`,
    [limit, includeArchived]
  );
  return rows.map((r: any) => ({
    ...r,
    items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
  })) as InquiryWithItems[];
}

export async function getInquiry(inquiryId: string) {
  const { rows } = await query(
    `SELECT id, customer_name, customer_email, customer_phone, customer_message, status, created_at, updated_at, is_archived
     FROM inquiries
     WHERE id = $1`,
    [inquiryId]
  );
  return rows[0] as InquiryRecord & { is_archived: boolean } | undefined;
}

export async function updateInquiryStatus(inquiryId: string, status: string) {
  await query(
    `UPDATE inquiries
     SET status = $1, updated_at = now()
     WHERE id = $2`,
    [status, inquiryId]
  );
}

export async function setInquiryArchived(inquiryId: string, isArchived: boolean) {
  await query(
    `UPDATE inquiries
     SET is_archived = $1, updated_at = now()
     WHERE id = $2`,
    [isArchived, inquiryId]
  );
}

export async function deleteInquiry(inquiryId: string) {
  await query('DELETE FROM inquiries WHERE id = $1', [inquiryId]);
}

export async function getInquiryItems(inquiryId: string) {
  const { rows } = await query(
    `SELECT product_name, product_slug, product_image, variant_id, size, color, quantity, price
     FROM inquiry_items
     WHERE inquiry_id = $1
     ORDER BY created_at ASC`,
    [inquiryId]
  );
  return rows as InquiryItemInput[];
}