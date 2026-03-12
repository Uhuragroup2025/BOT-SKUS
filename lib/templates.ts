export type CategoryKey = 'personal_care' | 'food_and_beverage' | 'home_textile' | 'general';

export interface CategoryTemplate {
    template_id: string;
    template_name: string;
    template_family: string;
    required_inputs: string[];
    visual_moments: string[];
}

export const CATEGORY_TEMPLATES: Record<CategoryKey, CategoryTemplate> = {
    personal_care: {
        template_id: "personal_care_v1",
        template_name: "Personal Care",
        template_family: "beauty_and_personal_care",
        required_inputs: [
            "brand", "product_name", "category", "main_use", "main_benefits", "material", "target_audience"
        ],
        visual_moments: [
            "hero_white_background", "benefits", "lifestyle_person", "texture_zoom", "dimensions_or_pack_content"
        ]
    },
    food_and_beverage: {
        template_id: "food_v1",
        template_name: "Food and Beverage",
        template_family: "food_and_beverage",
        required_inputs: [
            "brand", "product_name", "category", "ingredients", "nutrition_facts", "main_benefits", "target_audience"
        ],
        visual_moments: [
            "hero_white_background", "benefits", "ingredients_visual", "nutrition_table", "consumption_context"
        ]
    },
    home_textile: {
        template_id: "textile_v1",
        template_name: "Home Textile",
        template_family: "home_textile",
        required_inputs: [
            "brand", "product_name", "category", "dimensions", "material", "texture", "usage_scenarios"
        ],
        visual_moments: [
            "hero_white_background", "benefits", "room_context", "texture_zoom", "dimensions_visual"
        ]
    },
    general: {
        template_id: "general_v1",
        template_name: "General",
        template_family: "general",
        required_inputs: ["brand", "product_name", "category"],
        visual_moments: ["hero_white_background", "benefits", "lifestyle_person", "lifestyle_product", "context"]
    }
};

export const VISUAL_STRATEGY_MAP: Record<string, any> = {
    hero_white_background: {
        type: "hero",
        objective: "IMAGEN PRINCIPAL AMAZON: Fondo blanco puro (RGB 255,255,255), producto Solo (85% del cuadro), calidad profesional render, sin accesorios ni ambientación.",
        requires_product_lock: true,
        requires_graphics: false,
        amazon_compliant: true
    },
    benefits: { type: "benefits", objective: "Mostrar hasta 4 beneficios principales con apoyo visual", requires_product_lock: true, requires_graphics: true },
    lifestyle_person: { type: "lifestyle_person", objective: "Mostrar una persona usando el producto en un contexto real", requires_product_lock: true, requires_human: true },
    texture_zoom: { type: "texture_zoom", objective: "Mostrar textura, calidad y detalle del material", requires_product_lock: false, requires_macro: true },
    dimensions_or_pack_content: { type: "dimensions_or_pack_content", objective: "Mostrar tamaño, medidas o contenido del producto", requires_product_lock: true, requires_overlay_data: true },
    ingredients_visual: { type: "ingredients_visual", objective: "Mostrar ingredientes frescos y naturales del producto", requires_product_lock: false, requires_macro: true },
    nutrition_table: { type: "nutrition_table", objective: "Mostrar tabla nutricional clara y profesional", requires_overlay_data: true, data_source: "nutrition_facts" },
    consumption_context: { type: "consumption_context", objective: "Mostrar el producto en un momento de consumo real", requires_product_lock: true, requires_human: true },
    room_context: { type: "room_context", objective: "Mostrar el producto decorando una habitación real", requires_product_lock: true, requires_human: false },
    dimensions_visual: { type: "dimensions_visual", objective: "Infografía de medidas y dimensiones reales", requires_overlay_data: true, data_source: "dimensions" },
    lifestyle_product: { type: "lifestyle_product", objective: "Entorno cotidiano del producto", requires_product_lock: true },
    context: { type: "context", objective: "Contexto amplio del producto", requires_product_lock: true }
};
