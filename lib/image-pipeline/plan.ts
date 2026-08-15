import { visualPipelinePlanSchema } from "@/lib/image-pipeline/schemas";
import {
    IMAGE_PIPELINE_TEMPLATES,
    resolvePipelineCategory,
} from "@/lib/image-pipeline/templates";
import type {
    CreateVisualPipelinePlanInput,
    VisualMoment,
    VisualPipelinePlan,
} from "@/lib/image-pipeline/types";

export function createVisualPipelinePlan({
    sku,
    sourceImages,
    canvas,
}: CreateVisualPipelinePlanInput): VisualPipelinePlan {
    const category = resolvePipelineCategory([
        sku.category_template?.template_id,
        sku.category_template?.template_family,
        sku.extraction?.detected_category,
        sku.product_identity?.category,
        sku.product_identity?.product_type,
    ]);
    const template = IMAGE_PIPELINE_TEMPLATES[category];
    const sourceImageIds = sourceImages.map(({ id }) => id);
    const primarySourceImageId = sourceImages[0]?.id;
    const skuId = sku.sku_id || "pending-sku";

    const moments: VisualMoment[] = template.moments
        .filter(({ enabled }) => enabled)
        .sort((left, right) => left.order - right.order)
        .map((moment) => ({
            id: `${skuId}:${moment.kind.toLowerCase()}`,
            kind: moment.kind,
            order: moment.order,
            mode: moment.mode,
            stages: [...moment.stages],
            sourceImageIds: [...sourceImageIds],
            requirements: { ...moment.requirements },
            ...(moment.background
                ? {
                    background: {
                        ...moment.background,
                        ...(moment.background.reservedRegion
                            ? { reservedRegion: { ...moment.background.reservedRegion } }
                            : {}),
                    },
                }
                : {}),
            ...(moment.cropStrategy && primarySourceImageId
                ? {
                    crop: {
                        sourceImageId: primarySourceImageId,
                        strategy: moment.cropStrategy,
                    },
                }
                : {}),
            ...(moment.placementRegion
                ? { placementRegion: { ...moment.placementRegion } }
                : {}),
        }));

    return visualPipelinePlanSchema.parse({
        version: "1",
        skuId,
        templateId: template.id,
        category,
        sourceImages: sourceImages.map((sourceImage) => ({ ...sourceImage })),
        ...(canvas ? { canvas: { ...canvas } } : {}),
        moments,
    });
}
