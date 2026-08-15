import { z } from "zod";
import type {
    BackgroundSpec,
    CanvasSpec,
    CropSpec,
    MomentRequirements,
    NormalizedRegion,
    SourceImageRef,
    VisualMoment,
    VisualPipelinePlan,
} from "@/lib/image-pipeline/types";

export const visualMomentKindSchema = z.enum([
    "HERO",
    "BENEFITS",
    "LIFESTYLE",
    "TEXTURE",
    "PACK",
]);

export const momentModeSchema = z.enum([
    "deterministic",
    "generative_composite",
]);

export const pipelineStageSchema = z.enum([
    "normalize",
    "cutout",
    "background",
    "crop",
    "compose",
]);

export const sourceImageRefSchema = z.object({
    id: z.string().min(1),
    index: z.number().int().nonnegative(),
    mimeType: z.string().min(1).optional(),
}) satisfies z.ZodType<SourceImageRef>;

export const normalizedRegionSchema = z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1),
}).refine(
    ({ x, width }) => x + width <= 1,
    { message: "Region must fit horizontally within normalized bounds" },
).refine(
    ({ y, height }) => y + height <= 1,
    { message: "Region must fit vertically within normalized bounds" },
) satisfies z.ZodType<NormalizedRegion>;

export const canvasSpecSchema = z.object({
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    aspectRatio: z.string().min(1).optional(),
    format: z.enum(["png", "jpeg", "webp"]).optional(),
}) satisfies z.ZodType<CanvasSpec>;

export const backgroundSpecSchema = z.discriminatedUnion("mode", [
    z.object({
        mode: z.literal("none"),
        reservedRegion: normalizedRegionSchema.optional(),
    }),
    z.object({
        mode: z.literal("solid"),
        color: z.string().min(1),
        reservedRegion: normalizedRegionSchema.optional(),
    }),
    z.object({
        mode: z.literal("generated"),
        intent: z.string().min(1),
        reservedRegion: normalizedRegionSchema.optional(),
    }),
]) satisfies z.ZodType<BackgroundSpec>;

export const cropSpecSchema = z.discriminatedUnion("strategy", [
    z.object({
        sourceImageId: z.string().min(1),
        strategy: z.enum(["auto_detail", "center"]),
    }),
    z.object({
        sourceImageId: z.string().min(1),
        strategy: z.literal("manual"),
        region: normalizedRegionSchema,
    }),
]) satisfies z.ZodType<CropSpec>;

export const momentRequirementsSchema = z.object({
    minimumSourceImages: z.number().int().positive(),
    requiresCutout: z.boolean(),
    requiresBackgroundGeneration: z.boolean(),
    requiresComposition: z.boolean(),
}) satisfies z.ZodType<MomentRequirements>;

export const visualMomentSchema = z.object({
    id: z.string().min(1),
    kind: visualMomentKindSchema,
    order: z.number().int().nonnegative(),
    mode: momentModeSchema,
    stages: z.array(pipelineStageSchema),
    sourceImageIds: z.array(z.string().min(1)),
    requirements: momentRequirementsSchema,
    background: backgroundSpecSchema.optional(),
    crop: cropSpecSchema.optional(),
    placementRegion: normalizedRegionSchema.optional(),
}) satisfies z.ZodType<VisualMoment>;

export const pipelineCategoryKeySchema = z.enum([
    "personal_care",
    "food_and_beverage",
    "home_textile",
    "general",
]);

export const visualPipelinePlanSchema = z.object({
    version: z.literal("1"),
    skuId: z.string(),
    templateId: z.string().min(1),
    category: pipelineCategoryKeySchema,
    sourceImages: z.array(sourceImageRefSchema).min(
        1,
        "Visual pipeline plan requires at least one source image",
    ),
    canvas: canvasSpecSchema.optional(),
    moments: z.array(visualMomentSchema),
}) satisfies z.ZodType<VisualPipelinePlan>;
