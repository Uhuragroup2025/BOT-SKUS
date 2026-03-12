export interface MasterSKU {
    sku_id: string;
    source: {
        input_image_url: string;
        input_language: string;
        marketplace: string;
        country: string;
    };
    extraction: {
        status: 'pending' | 'completed' | 'error';
        confidence_score: number;
        raw_text_detected: string[];
        normalized_text: string;
        detected_brand: string;
        detected_product_name: string;
        detected_category: string;
        detected_subcategory: string;
        detected_variant: string;
        detected_presentations: string[];
        detected_claims: string[];
        detected_certifications: string[];
        detected_dimensions: string[];
        detected_nutrition_facts: string[];
        detected_ingredients: string[];
        detected_materials: string[];
        detected_usage_context: string[];
        missing_fields: string[];
    };
    product_identity: {
        brand: string;
        product_name: string;
        line: string;
        category: string;
        subcategory: string;
        product_type: string;
        variant: string;
        presentation: string;
        sku_code: string | null;
    };
    physical_attributes: {
        material: string;
        format: string;
        shape: string;
        texture: string;
        color_palette: string[];
        packaging_type: string;
        dimensions: {
            height_cm: number | null;
            width_cm: number | null;
            depth_cm: number | null;
            diameter_cm: number | null;
            weight_g: number | null;
            volume_ml: number | null;
        };
    };
    functional_attributes: {
        main_use: string[];
        secondary_use: string[];
        main_benefits: string[];
        differentiators: string[];
        target_audience: string[];
        usage_scenarios: string[];
    };
    compliance_attributes: {
        certifications: string[];
        seals: string[];
        ingredients: string[];
        nutrition_facts: {
            serving_size: string;
            calories: string;
            protein: string;
            fat: string;
            carbohydrates: string;
            sugar: string;
            sodium: string;
            other: string[];
        };
        warnings: string[];
        legal_required_elements: string[];
    };
    brand_style: {
        tone: string;
        style_keywords: string[];
        visual_palette: string[];
        do_not_modify: string[];
    };
    seo_geo: {
        primary_keywords: string[];
        secondary_keywords: string[];
        entities: string[];
        search_intents: string[];
        faq_candidates: string[];
    };
    category_template: {
        template_id: string;
        template_name: string;
        template_family: string;
        required_inputs: string[];
        visual_moments: string[];
    };
    image_strategy: {
        [key: string]: {
            type?: string;
            objective: string;
            requires_product_lock?: boolean;
            requires_graphics?: boolean;
            requires_human?: boolean;
            requires_macro?: boolean;
            requires_overlay_data?: boolean;
            data_source?: string;
        };
    };
    ai_constraints: {
        product_lock: boolean;
        allow_background_generation: boolean;
        allow_packaging_redesign: boolean;
        allow_logo_changes: boolean;
        allow_text_regeneration: boolean;
        allow_scene_context: boolean;
    };
}
