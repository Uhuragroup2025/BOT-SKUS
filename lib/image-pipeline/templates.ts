import type {
    BackgroundSpec,
    MomentMode,
    MomentRequirements,
    NormalizedRegion,
    PipelineCategoryKey,
    PipelineStage,
    VisualMomentKind,
} from "@/lib/image-pipeline/types";

export interface MomentTemplate {
    kind: VisualMomentKind;
    enabled: boolean;
    order: number;
    mode: MomentMode;
    stages: PipelineStage[];
    requirements: MomentRequirements;
    background?: BackgroundSpec;
    cropStrategy?: "auto_detail" | "center";
    placementRegion?: NormalizedRegion;
}

export interface PipelineCategoryTemplate {
    id: string;
    category: PipelineCategoryKey;
    moments: MomentTemplate[];
}

const PRODUCT_CENTER: NormalizedRegion = {
    x: 0.1,
    y: 0.08,
    width: 0.8,
    height: 0.84,
};

const PRODUCT_RIGHT: NormalizedRegion = {
    x: 0.55,
    y: 0.1,
    width: 0.38,
    height: 0.8,
};

const PRODUCT_LIFESTYLE: NormalizedRegion = {
    x: 0.58,
    y: 0.35,
    width: 0.32,
    height: 0.55,
};

const deterministicCompositeRequirements: MomentRequirements = {
    minimumSourceImages: 1,
    requiresCutout: true,
    requiresBackgroundGeneration: false,
    requiresComposition: true,
};

const generativeCompositeRequirements: MomentRequirements = {
    minimumSourceImages: 1,
    requiresCutout: true,
    requiresBackgroundGeneration: true,
    requiresComposition: true,
};

const textureRequirements: MomentRequirements = {
    minimumSourceImages: 1,
    requiresCutout: false,
    requiresBackgroundGeneration: false,
    requiresComposition: false,
};

const createMoments = (
    benefitsIntent: string,
    lifestyleIntent: string,
): MomentTemplate[] => [
    {
        kind: "HERO",
        enabled: true,
        order: 1,
        mode: "deterministic",
        stages: ["normalize", "cutout", "compose"],
        requirements: deterministicCompositeRequirements,
        background: { mode: "solid", color: "#FFFFFF" },
        placementRegion: PRODUCT_CENTER,
    },
    {
        kind: "BENEFITS",
        enabled: true,
        order: 2,
        mode: "generative_composite",
        stages: ["normalize", "cutout", "background", "compose"],
        requirements: generativeCompositeRequirements,
        background: {
            mode: "generated",
            intent: benefitsIntent,
            reservedRegion: PRODUCT_RIGHT,
        },
        placementRegion: PRODUCT_RIGHT,
    },
    {
        kind: "LIFESTYLE",
        enabled: true,
        order: 3,
        mode: "generative_composite",
        stages: ["normalize", "cutout", "background", "compose"],
        requirements: generativeCompositeRequirements,
        background: {
            mode: "generated",
            intent: lifestyleIntent,
            reservedRegion: PRODUCT_LIFESTYLE,
        },
        placementRegion: PRODUCT_LIFESTYLE,
    },
    {
        kind: "TEXTURE",
        enabled: true,
        order: 4,
        mode: "deterministic",
        stages: ["normalize", "crop"],
        requirements: textureRequirements,
        cropStrategy: "auto_detail",
    },
    {
        kind: "PACK",
        enabled: true,
        order: 5,
        mode: "deterministic",
        stages: ["normalize", "cutout", "compose"],
        requirements: deterministicCompositeRequirements,
        background: { mode: "solid", color: "#FFFFFF" },
        placementRegion: PRODUCT_CENTER,
    },
];

export const IMAGE_PIPELINE_TEMPLATES: Record<PipelineCategoryKey, PipelineCategoryTemplate> = {
    personal_care: {
        id: "personal_care_image_pipeline_v1",
        category: "personal_care",
        moments: createMoments(
            "Brand-relevant clean studio background inspired by the packaging palette",
            "Realistic personal-care usage environment with a natural product placement area",
        ),
    },
    food_and_beverage: {
        id: "food_and_beverage_image_pipeline_v1",
        category: "food_and_beverage",
        moments: createMoments(
            "Appetizing background informed by the product category and packaging palette",
            "Realistic consumption setting with a natural product placement area",
        ),
    },
    home_textile: {
        id: "home_textile_image_pipeline_v1",
        category: "home_textile",
        moments: createMoments(
            "Material-focused interior background informed by the packaging and product palette",
            "Realistic home environment with a natural product placement area",
        ),
    },
    general: {
        id: "general_image_pipeline_v1",
        category: "general",
        moments: createMoments(
            "Clean category-relevant background informed by the packaging palette",
            "Realistic everyday environment with a natural product placement area",
        ),
    },
};

export function resolvePipelineCategory(values: Array<string | null | undefined>): PipelineCategoryKey {
    const searchable = values.filter(Boolean).join(" ").toLowerCase();

    if (/personal_care|beauty|belleza|cuidado personal|cosm[eé]tic/.test(searchable)) {
        return "personal_care";
    }
    if (/food_and_beverage|food|beverage|alimento|bebida|comida/.test(searchable)) {
        return "food_and_beverage";
    }
    if (/home_textile|textile|textil|moda|accesorio|hogar|limpieza/.test(searchable)) {
        return "home_textile";
    }
    return "general";
}
