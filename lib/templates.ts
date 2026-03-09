export type CategoryKey = 'personal_care' | 'food' | 'textile' | 'general';

export interface CategoryTemplate {
    name: string;
    inputs: {
        label: string;
        key: string;
        placeholder: string;
        type: 'text' | 'textarea';
    }[];
    moments: {
        id: string;
        title: string;
        objective: string;
        scene_type: string;
        human_presence: boolean;
    }[];
}

export const CATEGORY_TEMPLATES: Record<CategoryKey, CategoryTemplate> = {
    personal_care: {
        name: 'Cuidado Personal',
        inputs: [
            { label: 'Beneficios', key: 'functional_attributes.benefits_core', placeholder: 'Ej: Hidratación profunda, Anti-edad...', type: 'textarea' },
            { label: 'Tipo de Piel / Cabello', key: 'targeting.skin_type', placeholder: 'Ej: Piel seca, Cabello graso...', type: 'text' },
            { label: 'Textura', key: 'physical_attributes.texture', placeholder: 'Ej: Crema ligera, Gel granulado...', type: 'text' },
            { label: 'Material / Envase', key: 'physical_attributes.material', placeholder: 'Ej: Envase biodegradable, Vidrio...', type: 'text' },
        ],
        moments: [
            { id: 'hero', title: 'Hero', objective: 'Producto limpio y centrado', scene_type: 'hero', human_presence: false },
            { id: 'benefits', title: 'Beneficios', objective: 'Resaltar promesas clave', scene_type: 'benefits', human_presence: false },
            { id: 'lifestyle_person', title: 'Lifestyle Persona', objective: 'Uso real por una persona', scene_type: 'lifestyle_person', human_presence: true },
            { id: 'texture_zoom', title: 'Zoom Textura', objective: 'Detalle macro de la textura', scene_type: 'texture_zoom', human_presence: false },
            { id: 'dimensions', title: 'Dimensiones / Contenido', objective: 'Contexto de tamaño real', scene_type: 'dimensions', human_presence: false },
        ]
    },
    food: {
        name: 'Alimentos y Bebidas',
        inputs: [
            { label: 'Ingredientes', key: 'physical_attributes.material', placeholder: 'Ej: Trigo integral, Stevia...', type: 'textarea' },
            { label: 'Tabla Nutricional', key: 'functional_attributes.instructions', placeholder: 'Ej: Grasas 0g, Azúcares 2g...', type: 'textarea' },
            { label: 'Calorías', key: 'functional_attributes.differentiators', placeholder: 'Ej: 150 kcal por porción', type: 'text' },
            { label: 'Porciones', key: 'physical_attributes.format', placeholder: 'Ej: 6 porciones por envase', type: 'text' },
        ],
        moments: [
            { id: 'hero', title: 'Hero', objective: 'Empaque frontal impecable', scene_type: 'hero', human_presence: false },
            { id: 'nutrition_table', title: 'Ingredientes / Tabla', objective: 'Enfoque en salud/componentes', scene_type: 'nutrition_table', human_presence: false },
            { id: 'ingredients', title: 'Raw Ingredients', objective: 'Ingredientes naturales alrededor', scene_type: 'ingredients_focus', human_presence: false },
            { id: 'lifestyle_consumption', title: 'Lifestyle Consumo', objective: 'Alimento listo para comer/beber', scene_type: 'lifestyle_consumption', human_presence: true },
            { id: 'pack_contents', title: 'Beneficios / Empaque', objective: 'Interior del empaque / Contenido', scene_type: 'pack_contents', human_presence: false },
        ]
    },
    textile: {
        name: 'Textil / Hogar',
        inputs: [
            { label: 'Dimensiones (Largo x Ancho)', key: 'physical_attributes.dimensions', placeholder: 'Ej: 200cm x 150cm', type: 'text' },
            { label: 'Tipo de Tela', key: 'physical_attributes.material', placeholder: 'Ej: Lino, Algodón egipcio...', type: 'text' },
            { label: 'Grosor / Peso', key: 'physical_attributes.weight', placeholder: 'Ej: 300 GSM, Blackout...', type: 'text' },
        ],
        moments: [
            { id: 'hero', title: 'Hero', objective: 'Producto extendido o colgado', scene_type: 'hero', human_presence: false },
            { id: 'dimensions', title: 'Dimensiones', objective: 'Infografía de medidas reales', scene_type: 'dimensions', human_presence: false },
            { id: 'texture_zoom', title: 'Textura Tela', objective: 'Detalle macro de la fibra', scene_type: 'texture_zoom', human_presence: false },
            { id: 'lifestyle_room', title: 'Contexto Hogar', objective: 'Producto en una habitación real', scene_type: 'lifestyle_room', human_presence: false },
            { id: 'functionality', title: 'Funcionalidad', objective: 'Demostración de uso (ej: cerrando cortina)', scene_type: 'functionality_focus', human_presence: true },
        ]
    },
    general: {
        name: 'General',
        inputs: [
            { label: 'Material', key: 'physical_attributes.material', placeholder: 'Ej: Plástico, Metal...', type: 'text' },
            { label: 'Beneficios', key: 'functional_attributes.benefits_core', placeholder: 'Ej: Duradero, Ergonómico...', type: 'textarea' },
        ],
        moments: [
            { id: 'hero', title: 'Hero', objective: 'Producto limpio', scene_type: 'hero', human_presence: false },
            { id: 'benefits', title: 'Beneficios', objective: 'Mostrar beneficios', scene_type: 'benefits', human_presence: false },
            { id: 'lifestyle_person', title: 'Lifestyle Persona', objective: 'Uso real por persona', scene_type: 'lifestyle_person', human_presence: true },
            { id: 'lifestyle_product', title: 'Lifestyle Producto', objective: 'Entorno cotidiano', scene_type: 'lifestyle_product', human_presence: false },
            { id: 'context', title: 'Contexto', objective: 'Contexto amplio', scene_type: 'zoom_out', human_presence: false },
        ]
    }
};
