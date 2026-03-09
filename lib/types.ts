export interface MasterSKU {
    sku_id: string;
    created_at: string;
    source: {
        input_type: string;
        image_url?: string;
        user_language: string;
        market: string;
    };
    product_identity: {
        brand: string;
        product_name: string;
        product_line: string;
        category: string;
        subcategory: string;
        product_type: string;
        sku_code: string | null;
        presentations: string[];
    };
    physical_attributes: {
        material: string;
        format: string;
        color: string;
        packaging_type: string;
        dimensions: string | null;
        weight: string | null;
        texture: string;
        shape_constraints: string[];
    };
    functional_attributes: {
        main_use: string[];
        secondary_use: string[];
        benefits_core: string[];
        differentiators: string[];
        certifications: string[];
        warnings: string[];
        instructions: string[];
    };
    targeting: {
        target_audience: string[];
        skin_type: string[];
        usage_context: string[];
        tone: string;
    };
    brand_style: {
        style_keywords: string[];
        visual_palette: string[];
        design_rules: string[];
    };
    seo_geo: {
        primary_keywords: string[];
        secondary_keywords: string[];
        entities: string[];
        search_intents: string[];
        faq_candidates: string[];
    };
    marketplace_metadata: {
        channel: string;
        country: string;
        listing_title_max_length: number;
        bullet_count: number;
        requires_white_background: boolean;
        requires_structured_attributes: boolean;
    };
    content_outputs: {
        seo_title: string | null;
        short_description: string | null;
        long_description: string | null;
        bullets: string[];
        meta_description: string | null;
        alt_texts: string[];
        faq: { q: string; a: string }[];
    };
    image_strategy: {
        [key: string]: {
            objective: string;
            scene_type: string;
            human_presence: boolean;
            environment?: string;
            graphic_elements?: boolean;
            max_claims?: number;
        };
    };
    ai_constraints: {
        product_lock: boolean;
        allow_packaging_redesign: boolean;
        allow_text_regeneration: boolean;
        allow_logo_changes: boolean;
        allow_background_generation: boolean;
        allow_lighting_adjustment: boolean;
        allow_scene_context: boolean;
    };
    review_flags: {
        needs_human_review: boolean;
        missing_data: string[];
        confidence_score: number;
        isValidProduct?: boolean;
        rejectionReason?: string;
    };
}
