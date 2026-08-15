import type { MasterSKU } from "@/lib/types";

export type VisualMomentKind =
    | "HERO"
    | "BENEFITS"
    | "LIFESTYLE"
    | "TEXTURE"
    | "PACK";

export type MomentMode = "deterministic" | "generative_composite";

export type PipelineStage =
    | "normalize"
    | "cutout"
    | "background"
    | "crop"
    | "compose";

export interface SourceImageRef {
    id: string;
    index: number;
    mimeType?: string;
}

export interface NormalizedRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CanvasSpec {
    width?: number;
    height?: number;
    aspectRatio?: string;
    format?: "png" | "jpeg" | "webp";
}

export type BackgroundSpec =
    | {
        mode: "none";
        reservedRegion?: NormalizedRegion;
    }
    | {
        mode: "solid";
        color: string;
        reservedRegion?: NormalizedRegion;
    }
    | {
        mode: "generated";
        intent: string;
        reservedRegion?: NormalizedRegion;
    };

export type CropSpec =
    | {
        sourceImageId: string;
        strategy: "auto_detail" | "center";
    }
    | {
        sourceImageId: string;
        strategy: "manual";
        region: NormalizedRegion;
    };

export interface MomentRequirements {
    minimumSourceImages: number;
    requiresCutout: boolean;
    requiresBackgroundGeneration: boolean;
    requiresComposition: boolean;
}

export interface VisualMoment {
    id: string;
    kind: VisualMomentKind;
    order: number;
    mode: MomentMode;
    stages: PipelineStage[];
    sourceImageIds: string[];
    requirements: MomentRequirements;
    background?: BackgroundSpec;
    crop?: CropSpec;
    placementRegion?: NormalizedRegion;
}

export type PipelineCategoryKey =
    | "personal_care"
    | "food_and_beverage"
    | "home_textile"
    | "general";

export interface VisualPipelinePlan {
    version: "1";
    skuId: string;
    templateId: string;
    category: PipelineCategoryKey;
    sourceImages: SourceImageRef[];
    canvas?: CanvasSpec;
    moments: VisualMoment[];
}

export interface CreateVisualPipelinePlanInput {
    sku: MasterSKU;
    sourceImages: SourceImageRef[];
    canvas?: CanvasSpec;
}
