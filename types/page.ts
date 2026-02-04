export type BlockType = 'HERO' | 'TEXT' | 'TEXT_IMAGE';

export type CropMetadata = {
    x: number;
    y: number;
    width: number;
    height: number;
    ratio: number | null;
};

export type PageRecord = {
    id: number;
    title: string;
    slug: string;
    status: string | null;
    show_header: boolean | null;
    header_order: number | null;
    show_dropdown: boolean | null;
    dropdown_order: number | null;
    show_footer?: boolean | null;
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

export type PageBlock = {
    id: number;
    page_id: number;
    type: BlockType;
    position: number;
    data: {
        title_en?: string;
        title_bg?: string;
        subtitle_en?: string;
        subtitle_bg?: string;
        description_en?: string;
        description_bg?: string;
        content_en?: string;
        content_bg?: string;
        cta_text_en?: string;
        cta_text_bg?: string;
        cta_link?: string;
        image_url?: string; // Bucket relative path or full URL
        video_url?: string; // YouTube link or Bucket path
        layout?: 'left' | 'right';
        [key: string]: unknown;
    } | null;
    enabled: boolean | null;
    created_at: string | null;
    updated_at: string | null;
};

export type GalleryImageRecord = never;
