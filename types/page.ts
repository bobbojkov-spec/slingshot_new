export type PageRecord = {
    id: number;
    title: string;
    slug: string;
    status: string | null;
    show_header: boolean | null;
    header_order: number | null;
    show_dropdown: boolean | null;
    dropdown_order: number | null;
    footer_column: number | null;
    footer_order: number | null;
    order?: number | null;
    created_at: string | null;
    updated_at: string | null;
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
    og_title?: string;
    og_description?: string;
    og_image_id?: number | null;
    canonical_url?: string;
};

export type BlockType = 'HERO' | 'TEXT' | 'TEXT_IMAGE' | 'GALLERY' | 'YOUTUBE' | 'FEATURED_PRODUCTS';

export type PageBlock = {
    id: number;
    page_id: number;
    type: BlockType;
    position: number;
    data: Record<string, unknown> | null;
    enabled: boolean | null;
    created_at: string | null;
    updated_at: string | null;
};

export type GalleryImageRecord = {
    id: number;
    block_id: number;
    media_id: number;
    position: number;
    url?: string;
    filename?: string | null;
    created_at: string | null;
};
