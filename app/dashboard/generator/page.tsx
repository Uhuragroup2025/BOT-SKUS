"use client";



import { useState } from "react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, AlertCircle, Copy, Check, FileText, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { MasterSKU } from "@/lib/types";
import { CATEGORY_TEMPLATES, CategoryKey } from "@/lib/templates";
import { VisualAssetRenderer } from "@/components/VisualAssetRenderer";

// Helper to map UI product type to template key
const getTemplateKey = (productType: string): CategoryKey => {
    if (productType === "Belleza & Cuidado Personal") return 'personal_care';
    if (productType === "Alimentos & Bebidas") return 'food_and_beverage';
    if (productType === "Moda & Accesorios" || productType === "Hogar & Limpieza") return 'home_textile';
    return 'general';
};

// Helper for default state
const initialSKUMaster: Partial<MasterSKU> = {
    sku_id: "",
    source: {
        input_image_url: "",
        input_language: "es",
        marketplace: "mercado_libre",
        country: "CO"
    },
    extraction: {
        status: 'pending',
        confidence_score: 0,
        raw_text_detected: [],
        normalized_text: "",
        detected_brand: "",
        detected_product_name: "",
        detected_category: "",
        detected_subcategory: "",
        detected_variant: "",
        detected_presentations: [],
        detected_claims: [],
        detected_certifications: [],
        detected_dimensions: [],
        detected_nutrition_facts: [],
        detected_ingredients: [],
        detected_materials: [],
        detected_usage_context: [],
        missing_fields: []
    },
    product_identity: {
        brand: "",
        product_name: "",
        line: "",
        category: "",
        subcategory: "",
        product_type: "Belleza & Cuidado Personal",
        variant: "",
        presentation: "",
        sku_code: null
    },
    physical_attributes: {
        material: "",
        format: "",
        shape: "",
        texture: "",
        color_palette: [],
        packaging_type: "",
        dimensions: {
            height_cm: null,
            width_cm: null,
            depth_cm: null,
            diameter_cm: null,
            weight_g: null,
            volume_ml: null
        }
    },
    functional_attributes: {
        main_use: [],
        secondary_use: [],
        main_benefits: [],
        differentiators: [],
        target_audience: [],
        usage_scenarios: []
    },
    compliance_attributes: {
        certifications: [],
        seals: [],
        ingredients: [],
        nutrition_facts: {
            serving_size: "",
            calories: "",
            protein: "",
            fat: "",
            carbohydrates: "",
            sugar: "",
            sodium: "",
            other: []
        },
        warnings: [],
        legal_required_elements: []
    },
    brand_style: {
        tone: "comercial",
        style_keywords: [],
        visual_palette: [],
        do_not_modify: ["logo", "packaging_text", "brand_colors", "packaging_shape"]
    },
    seo_geo: {
        primary_keywords: [],
        secondary_keywords: [],
        entities: [],
        search_intents: [],
        faq_candidates: []
    },
    category_template: {
        template_id: "",
        template_name: "",
        template_family: "",
        required_inputs: [],
        visual_moments: []
    },
    ai_constraints: {
        product_lock: true,
        allow_background_generation: true,
        allow_packaging_redesign: false,
        allow_logo_changes: false,
        allow_text_regeneration: false,
        allow_scene_context: true
    }
};

interface GeneratedContent {
    seoTitle: string;
    shortDescription: string;
    longDescription: string;
    bullets: string[];
    aeoSnippet: string;
    metaDescription: string;
    faq: { q: string; a: string }[];
    aiRecommendation: string;
    score: number;
    imageAlt: string[];
    visualAssets?: {
        moment_id?: string;
        moment_label?: string;
        api_model?: string;
        api_params?: any;
        reference_image_url?: string;
        prompt?: string;
        negative_prompt?: string;
        overlay_text_instructions?: any;
        composition_notes?: string;

        // Old compat
        id?: number;
        type?: 'benefit_infographic' | 'recipe' | 'lifestyle_banner' | 'single_image';
        title?: string;
        image_prompt?: string;
        overlay_data?: any;
    }[];
    visualPack?: { // Mantener compatibilidad si es necesario, pero idealmente deprecado
        id: number;
        title: string;
        visual: string;
        copy: {
            text?: string;
            headline?: string;
            subheadline?: string;
            bullets?: string[];
            seals?: string[];
        }
    }[];
    inputRecommendations?: string[];
}

export default function GeneratorPage() {
    const { user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [result, setResult] = useState<GeneratedContent | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [skuMaster, setSkuMaster] = useState<Partial<MasterSKU>>(initialSKUMaster);
    const [features, setFeatures] = useState("");
    const [extractionData, setExtractionData] = useState<Partial<MasterSKU> | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Key: prompt id. Value: base64 string or 'loading' or 'error'.
    const [imageStates, setImageStates] = useState<Record<string, { status: 'idle' | 'loading' | 'success' | 'error', url?: string, error?: string }>>({});

    const credits = user?.credits ?? 0;

    const generateOneImage = async (asset: any, refImage: string | null, assetIndex: number, retries = 2) => {
        const id = asset.moment_id || asset.id || `asset-${assetIndex}`;
        setImageStates(prev => ({ ...prev, [id]: { status: 'loading', error: undefined } }));

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                if (!refImage) throw new Error("Reference image required.");

                const imageDataUri = refImage.startsWith('data:') ? refImage : `data:image/jpeg;base64,${refImage}`;

                let apiModel = asset.api_model || asset.api_endpoint || (asset.steps && asset.steps[0] && asset.steps[0].api_endpoint) || (asset.steps && asset.steps[0] && asset.steps[0].tool) || "fal-ai/recraft-v3";
                if (typeof apiModel === 'string' && apiModel.startsWith("https://fal.run/")) {
                    apiModel = apiModel.replace("https://fal.run/", "");
                }

                if (typeof apiModel === 'string' && (apiModel.toLowerCase().includes("sharp") || apiModel.toLowerCase().includes("canvas"))) {
                    // Skip AI generation for compose steps we don't support client-side yet
                    setImageStates(prev => ({ ...prev, [id]: { status: 'success', url: imageDataUri } }));
                    return;
                }

                let recursivePrompt = asset.prompt || asset.image_prompt || asset.api_params?.prompt;
                if (!recursivePrompt && asset.steps) {
                    for (const s of asset.steps) {
                        if (s.api_params?.prompt) { recursivePrompt = s.api_params.prompt; break; }
                        if (s.prompt) { recursivePrompt = s.prompt; break; }
                    }
                }
                const promptToUse = recursivePrompt;
                if (!promptToUse) throw new Error("Prompt is missing");

                let response = await fetch("/api/create-image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: promptToUse,
                        referenceImage: imageDataUri
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || "Failed to initiate image generation.");
                }

                const initData = await response.json();
                
                if (initData.image) {
                    setImageStates(prev => ({ ...prev, [id]: { status: 'success', url: initData.image } }));
                    return;
                }

                if (!initData.taskId) {
                    throw new Error("No taskId returned from initial request.");
                }

                const taskId = initData.taskId;
                console.log(`Freepik Task Initiated on client: ${taskId}`);

                // Poll every 3 seconds for up to 90 seconds
                let finalImageUrl = null;
                for (let polls = 0; polls < 30; polls++) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    const pollResponse = await fetch("/api/create-image", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ taskId })
                    });
                    
                    if (!pollResponse.ok) {
                        throw new Error("Failed to poll image status");
                    }
                    
                    const pollData = await pollResponse.json();
                    
                    if (pollData.status === "completed") {
                        finalImageUrl = pollData.image;
                        break;
                    } else if (pollData.status === "failed") {
                        throw new Error(pollData.error || "Freepik generation failed.");
                    }
                }

                if (!finalImageUrl) throw new Error("Generación agotó el tiempo de espera. Reintenta.");

                setImageStates(prev => ({ ...prev, [id]: { status: 'success', url: finalImageUrl } }));
                return; // Success, exit the retry loop

            } catch (err: any) {
                const isAbortError = err.name === 'AbortError' || err.message?.includes('aborted');
                console.error(`Error generating image ${id} (Attempt ${attempt + 1}/${retries + 1}):`, err);

                if (attempt < retries) {
                    console.log(`Retrying image ${id} in 2 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    setImageStates(prev => ({
                        ...prev,
                        [id]: {
                            status: 'error',
                            error: isAbortError ? "La conexión se interrumpió por tiempo de espera. Por favor, reintenta." : err.message
                        }
                    }));
                }
            }
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResult(null);
        setImageStates({}); // Reset images

        if (credits <= 0) {
            setError("No tienes créditos suficientes. Por favor, adquiere un plan.");
            return;
        }

        if (referenceImages.length < 3) {
            setError("Es obligatorio subir al menos 3 imágenes (empaque y producto) para asegurar buen material a la IA.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productName: skuMaster.product_identity?.product_name,
                    features,
                    category: skuMaster.product_identity?.category,
                    marketplace: skuMaster.source?.marketplace,
                    country: skuMaster.source?.country,
                    tone: skuMaster.brand_style?.tone,
                    type: skuMaster.product_identity?.product_type,
                    brand: skuMaster.product_identity?.brand,
                    line: skuMaster.product_identity?.line,
                    presentation: skuMaster.product_identity?.presentation,
                    material: skuMaster.physical_attributes?.material,
                    mainUse: skuMaster.functional_attributes?.main_use?.join(", "),
                    benefits: skuMaster.functional_attributes?.main_benefits?.join(", "),
                    certifications: skuMaster.compliance_attributes?.certifications?.join(", "),
                    images: referenceImages,
                    skuMaster // Send the full master JSON as well
                }),
            });

            if (response.status === 403) {
                const data = await response.json();
                setError(data.error || "No tienes créditos suficientes.");
                setLoading(false);
                return;
            }

            if (!response.ok) throw new Error("Error generating content");

            const data = await response.json();
            setResult(data);
            setLoading(false);

            // Trigger Image Generation sequentially to avoid AbortError timeouts or rate limits
            if (data.visualAssets && Array.isArray(data.visualAssets)) {
                // Run in background but sequentially
                (async () => {
                    for (let i = 0; i < data.visualAssets.length; i++) {
                        await generateOneImage(data.visualAssets[i], referenceImages[0], i);
                    }
                })();
            }

            // Refresh credits in background
            refreshProfile().catch(err => console.error("Error refreshing profile:", err));
        } catch (error) {
            console.error(error);
            setError("Hubo un error al generar la ficha. Por favor intenta de nuevo.");
            setLoading(false);
        }
    };

    const handleExtract = async (text?: string, images?: string[]) => {
        if (extracting) return;
        setExtracting(true);
        setError(null);
        try {
            const response = await fetch("/api/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, images }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 429) {
                    throw new Error("🚀 Hemos alcanzado el límite de velocidad de la IA. Por favor, espera unos segundos o completa los datos manualmente si tienes prisa.");
                }
                throw new Error(errorData.error || "Error al extraer los datos.");
            }

            const data = await response.json();
            setExtractionData(data);
            setShowReviewModal(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al extraer datos. Intenta ingresarlos manualmente.");
        } finally {
            setExtracting(false);
        }
    };


    // State for the reference images (Base64 array)
    const [referenceImages, setReferenceImages] = useState<string[]>([]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).slice(0, 5); // Max 5 images
        if (files.length === 0) return;

        let newImages: string[] = [];
        let hasError = false;

        for (const file of files) {
            if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                setError("Por favor selecciona archivos de imagen o PDF.");
                hasError = true;
                continue;
            }

            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const originalResult = reader.result as string;

                    if (file.type.startsWith('image/')) {
                        try {
                            const img = new (window.Image || (globalThis as any).Image)();
                            img.src = originalResult;
                            await new Promise((res) => { img.onload = res; });

                            const MAX_SIZE = 1024;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                                if (width > MAX_SIZE) {
                                    height *= MAX_SIZE / width;
                                    width = MAX_SIZE;
                                }
                            } else {
                                if (height > MAX_SIZE) {
                                    width *= MAX_SIZE / height;
                                    height = MAX_SIZE;
                                }
                            }

                            const canvas = document.createElement('canvas');
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0, width, height);
                            // Always convert to JPEG 0.7 to drastically reduce payload size
                            resolve(canvas.toDataURL('image/jpeg', 0.7));
                        } catch (conversionErr) {
                            console.error("Error resizing image:", conversionErr);
                            resolve(originalResult);
                        }
                    } else {
                        // For non-image files like PDF, keep original base64
                        resolve(originalResult);
                    }
                };
                reader.readAsDataURL(file);
            });
            newImages.push(base64);
        }

        if (newImages.length > 0) {
            const isFirstUpload = referenceImages.length === 0;
            setReferenceImages(prev => {
                const updated = [...prev, ...newImages].slice(0, 5);
                // Trigger extraction only on the first upload batch
                if (isFirstUpload) {
                    handleExtract(undefined, updated).catch(console.error);
                }
                return updated;
            });
        }
    };

    const removeImage = (index: number) => {
        setReferenceImages(prev => prev.filter((_, i) => i !== index));
    };


    const handleConfirmExtraction = () => {
        if (extractionData) {
            setSkuMaster(prev => ({
                ...prev,
                ...extractionData,
                product_identity: { ...(prev as any).product_identity, ...extractionData.product_identity },
                physical_attributes: { ...(prev as any).physical_attributes, ...extractionData.physical_attributes },
                functional_attributes: { ...(prev as any).functional_attributes, ...extractionData.functional_attributes },
                compliance_attributes: { ...(prev as any).compliance_attributes, ...extractionData.compliance_attributes },
                brand_style: { ...(prev as any).brand_style, ...extractionData.brand_style },
                seo_geo: { ...(prev as any).seo_geo, ...extractionData.seo_geo },
                source: { ...(prev as any).source, ...extractionData.source },
                ai_constraints: { ...(prev as any).ai_constraints, ...extractionData.ai_constraints },
            } as MasterSKU));

            // Populate the technical sheet text area as well
            if (extractionData.extraction?.normalized_text) {
                setFeatures(extractionData.extraction.normalized_text);
            }
        }
        setShowReviewModal(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[calc(100vh-8rem)]">
            {/* Modal de Revisión de Extracción */}
            <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            Revisar Datos Extraídos
                        </DialogTitle>
                        <DialogDescription>
                            Hemos analizado tu texto. Verifica que los datos sean correctos antes de aplicarlos al formulario.
                        </DialogDescription>
                    </DialogHeader>

                    {extractionData && (
                        <div className="space-y-4 my-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest border-b pb-1">Identidad de Producto</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-medium opacity-60">Marca</Label>
                                        <Input
                                            value={extractionData.product_identity?.brand || ""}
                                            onChange={(e) => setExtractionData({
                                                ...extractionData,
                                                product_identity: { ...extractionData.product_identity!, brand: e.target.value }
                                            })}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-medium opacity-60">Nombre</Label>
                                        <Input
                                            value={extractionData.product_identity?.product_name || ""}
                                            onChange={(e) => setExtractionData({
                                                ...extractionData,
                                                product_identity: { ...extractionData.product_identity!, product_name: e.target.value }
                                            })}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                </div>

                                <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest border-b pb-1 pt-2">Extracción Detectada</h4>
                                <div className="bg-gray-50 dark:bg-gray-900 border rounded p-3 space-y-2 text-xs">
                                    <div className="flex justify-between border-b pb-1">
                                        <span className="opacity-60 uppercase font-bold text-[9px]">Categoría</span>
                                        <span className="font-semibold text-purple-600">{extractionData.extraction?.detected_category || "No detectada"}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="opacity-60 uppercase font-bold text-[9px]">Principales Beneficios</span>
                                        <p className="italic">{extractionData.extraction?.detected_claims?.slice(0, 3).join(", ") || "No detectados"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="opacity-60 uppercase font-bold text-[9px]">Materiales/Ingredientes</span>
                                        <p className="italic">{extractionData.extraction?.detected_ingredients?.length ? extractionData.extraction.detected_ingredients.join(", ") : (extractionData.extraction?.detected_materials?.join(", ") || "No detectados")}</p>
                                    </div>
                                </div>

                                <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest border-b pb-1 pt-2">Restricciones</h4>
                                <div className="bg-gray-50 dark:bg-gray-900 border rounded p-2 text-[10px] space-y-1">
                                    <div className="flex justify-between">
                                        <span>Product Lock</span>
                                        <span className="text-green-600 font-bold">Activo</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Scene Context</span>
                                        <span className="text-green-600 font-bold">Permitido</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReviewModal(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmExtraction} className="bg-purple-600 hover:bg-purple-700">Confirmar y Rellenar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* LEFT COLUMN: FORM */}
            <Card className="h-full lg:overflow-y-auto border-none shadow-md">
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-semibold">Datos del producto</h2>
                                <p className="text-sm text-muted-foreground">Completa los detalles o usa la extracción inteligente.</p>
                            </div>
                            <div className="bg-primary/5 p-2 rounded-lg border border-primary/10">
                                <Label className="text-[10px] uppercase font-bold text-primary block mb-1">Tus créditos</Label>
                                <div className="text-lg font-bold text-center">{credits}</div>
                            </div>
                        </div>

                        {/* UPLOAD & SMART EXTRACTION */}
                        <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30 space-y-4">

                            {/* PASO 1: IMAGEN (OBLIGATORIA) */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-sm font-semibold">1. Sube tus imágenes (Mín. 3 fotos)</span>
                                </div>
                                <div className="flex gap-2 w-full items-center">
                                    <div className="relative w-full">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            accept="image/jpeg,image/png,image/avif,image/webp,image/heic,application/pdf"
                                            multiple
                                            onChange={handleFileChange}
                                            disabled={extracting}
                                        />
                                        <Button
                                            variant="outline"
                                            size="default"
                                            className="w-full bg-white dark:bg-gray-900 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 gap-2 h-12 shadow-sm"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                            disabled={extracting}
                                            type="button"
                                        >
                                            {extracting ? (
                                                <Sparkles className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <FileText className="w-5 h-5" />
                                            )}
                                            <span className="font-semibold text-sm">
                                                {extracting ? "Analizando producto..." : (referenceImages.length > 0 ? `Añadir más imágenes (${referenceImages.length}/5)` : "Sube mín. 3 imágenes (Empaque y producto)")}
                                            </span>
                                        </Button>
                                    </div>

                                    {/* IMAGE PREVIEW MODULE */}
                                    {referenceImages.length > 0 && (
                                        <div className="flex gap-2 shrink-0 overflow-x-auto max-w-[200px] pb-2 custom-scrollbar">
                                            {referenceImages.map((img, i) => (
                                                <div key={i} className="relative group shrink-0 w-14 h-14 rounded-md border border-purple-300 dark:border-purple-600 overflow-hidden shadow-sm">
                                                    <NextImage src={img} alt={`Preview ${i}`} fill className="object-cover" />
                                                    {i === 0 && <div className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 shadow-sm z-10" title="Imagen base principal"></div>}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(i)}
                                                        className="absolute top-0.5 right-0.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                                        title="Eliminar imagen"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30 gap-3 items-start mt-2">
                                    <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                    <div className="text-xs text-blue-700 dark:text-blue-300">
                                        <p className="font-semibold mb-1">💡 Sube fotos claras de tu producto o sus detalles (ej: empaque original y textura por dentro).</p>
                                        <p>La primera imagen (#1) será usada como <b>base visual obligatoria</b>. Necesitamos al menos 3 imágenes (empaque, producto) para que la IA tenga buen material de referencia.</p>
                                    </div>
                                </div>
                            </div>

                            {/* PASO 2: TEXTO EXTRA (OPCIONAL) */}
                            <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-800/50">
                                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300 block">2. Ficha técnica (Opcional)</span>
                                <Textarea
                                    placeholder="Pega aquí la descripción o ficha técnica del producto para auto-rellenar los campos inferiores..."
                                    className="bg-white/50 dark:bg-gray-900/50 text-xs h-16"
                                    id="smart-extract-text"
                                    value={features}
                                    onChange={(e) => setFeatures(e.target.value)}
                                    onBlur={(e) => {
                                        if (e.target.value) handleExtract(e.target.value);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo de producto *</Label>
                                <Select
                                    value={skuMaster.product_identity?.product_type || "Belleza & Cuidado Personal"}
                                    onValueChange={(val) => setSkuMaster(prev => ({
                                        ...prev,
                                        product_identity: { ...prev.product_identity!, product_type: val }
                                    }))}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Categoría macro" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Belleza & Cuidado Personal">Belleza & Cuidado Personal</SelectItem>
                                        <SelectItem value="Salud / Institucional">Salud / Institucional</SelectItem>
                                        <SelectItem value="Alimentos & Bebidas">Alimentos & Bebidas</SelectItem>
                                        <SelectItem value="Hogar & Limpieza">Hogar & Limpieza</SelectItem>
                                        <SelectItem value="Mascotas">Mascotas</SelectItem>
                                        <SelectItem value="Tecnología">Tecnología</SelectItem>
                                        <SelectItem value="Moda & Accesorios">Moda & Accesorios</SelectItem>
                                        <SelectItem value="Bebés">Bebés</SelectItem>
                                        <SelectItem value="Ferretería / Industrial">Ferretería / Industrial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Subcategoría / tipo *</Label>
                                <Input
                                    id="category"
                                    placeholder="Ej: Labial, Detergente..."
                                    required
                                    value={skuMaster.product_identity?.category || ""}
                                    onChange={(e) => setSkuMaster(prev => ({
                                        ...prev,
                                        product_identity: { ...prev.product_identity!, category: e.target.value }
                                    }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre base del producto *</Label>
                            <Input
                                id="name"
                                placeholder="Ej: Jabón de manos antibacterial"
                                required
                                value={skuMaster.product_identity?.product_name || ""}
                                onChange={(e) => setSkuMaster(prev => ({
                                    ...prev,
                                    product_identity: { ...prev.product_identity!, product_name: e.target.value }
                                }))}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="brand">Marca</Label>
                                <Input
                                    id="brand"
                                    value={skuMaster.product_identity?.brand || ""}
                                    onChange={(e) => setSkuMaster(prev => ({
                                        ...prev,
                                        product_identity: { ...prev.product_identity!, brand: e.target.value }
                                    }))}
                                    placeholder="Ej: Higietex"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="model">Línea / Variante</Label>
                                <Input
                                    id="model"
                                    value={skuMaster.product_identity?.line || ""}
                                    onChange={(e) => setSkuMaster(prev => ({
                                        ...prev,
                                        product_identity: { ...prev.product_identity!, line: e.target.value }
                                    }))}
                                    placeholder="Ej: Ecológicos"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-dashed">
                            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Framework Visual: {CATEGORY_TEMPLATES[getTemplateKey(skuMaster.product_identity?.product_type || "")].template_name}
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {getTemplateKey(skuMaster.product_identity?.product_type || "") === 'personal_care' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Principales Beneficios (separados por coma)</Label>
                                            <Textarea
                                                placeholder="Ej: Hidratación profunda, Anti-edad..."
                                                value={skuMaster.functional_attributes?.main_benefits?.join(", ") || ""}
                                                onChange={(e) => setSkuMaster(prev => ({ ...prev, functional_attributes: { ...prev.functional_attributes!, main_benefits: e.target.value.split(",").map(v => v.trim()) } }))}
                                                className="h-20 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Target / Público</Label>
                                            <Input
                                                placeholder="Ej: Mujeres 30-40 años..."
                                                value={skuMaster.functional_attributes?.target_audience?.join(", ") || ""}
                                                onChange={(e) => setSkuMaster(prev => ({ ...prev, functional_attributes: { ...prev.functional_attributes!, target_audience: e.target.value.split(",").map(v => v.trim()) } }))}
                                            />
                                        </div>
                                    </div>
                                )}
                                {getTemplateKey(skuMaster.product_identity?.product_type || "") === 'food_and_beverage' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Ingredientes</Label>
                                            <Textarea
                                                placeholder="Ej: Trigo, Azúcar, Vitaminas..."
                                                value={skuMaster.compliance_attributes?.ingredients?.join(", ") || ""}
                                                onChange={(e) => setSkuMaster(prev => ({ ...prev, compliance_attributes: { ...prev.compliance_attributes!, ingredients: e.target.value.split(",").map(v => v.trim()) } }))}
                                                className="h-20 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Información Nutricional (Resumen)</Label>
                                            <Input
                                                placeholder="Ej: 150 kcal, 0g grasas..."
                                                value={skuMaster.compliance_attributes?.nutrition_facts?.calories || ""}
                                                onChange={(e) => setSkuMaster(prev => ({ ...prev, compliance_attributes: { ...prev.compliance_attributes!, nutrition_facts: { ...prev.compliance_attributes!.nutrition_facts, calories: e.target.value } } }))}
                                            />
                                        </div>
                                    </div>
                                )}
                                {getTemplateKey(skuMaster.product_identity?.product_type || "") === 'home_textile' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Composición / Material</Label>
                                            <Input
                                                placeholder="Ej: 100% Lino..."
                                                value={skuMaster.physical_attributes?.material || ""}
                                                onChange={(e) => setSkuMaster(prev => ({ ...prev, physical_attributes: { ...prev.physical_attributes!, material: e.target.value } }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Medidas (Alto x Ancho cm)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Alto"
                                                    type="number"
                                                    value={skuMaster.physical_attributes?.dimensions?.height_cm || ""}
                                                    onChange={(e) => setSkuMaster(prev => ({ ...prev, physical_attributes: { ...prev.physical_attributes!, dimensions: { ...prev.physical_attributes!.dimensions, height_cm: parseInt(e.target.value) || null } } }))}
                                                />
                                                <Input
                                                    placeholder="Ancho"
                                                    type="number"
                                                    value={skuMaster.physical_attributes?.dimensions?.width_cm || ""}
                                                    onChange={(e) => setSkuMaster(prev => ({ ...prev, physical_attributes: { ...prev.physical_attributes!, dimensions: { ...prev.physical_attributes!.dimensions, width_cm: parseInt(e.target.value) || null } } }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-dashed">
                            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Momentos Visuales ({CATEGORY_TEMPLATES[getTemplateKey(skuMaster.product_identity?.product_type || "")].visual_moments.length})
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORY_TEMPLATES[getTemplateKey(skuMaster.product_identity?.product_type || "")].visual_moments.map((momentId) => (
                                    <div key={momentId} className="bg-primary/5 border border-primary/20 px-3 py-1 rounded-full text-[10px] uppercase font-bold text-primary">
                                        {momentId.replace(/_/g, ' ')}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="channel">Marketplace *</Label>
                                <Select
                                    value={skuMaster.source?.marketplace || "mercado_libre"}
                                    onValueChange={(val) => setSkuMaster(prev => ({
                                        ...prev,
                                        source: { ...prev.source!, marketplace: val }
                                    }))}
                                >
                                    <SelectTrigger id="channel">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mercado_libre">Mercado Libre</SelectItem>
                                        <SelectItem value="amazon">Amazon</SelectItem>
                                        <SelectItem value="shopify">Shopify / VTEX</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tone">Tono *</Label>
                                <Select
                                    value={skuMaster.brand_style?.tone || "comercial"}
                                    onValueChange={(val) => setSkuMaster(prev => ({
                                        ...prev,
                                        brand_style: { ...prev.brand_style!, tone: val }
                                    }))}
                                >
                                    <SelectTrigger id="tone">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="comercial">Comercial</SelectItem>
                                        <SelectItem value="tecnico">Técnico</SelectItem>
                                        <SelectItem value="lujo">Luxury / Premium</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Atención</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" className="w-full gap-2 py-6 text-lg bg-primary hover:bg-primary/90" disabled={loading || (!user?.email?.endsWith("@uhuragroup.com") && credits <= 0)}>
                            <Sparkles className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
                            {loading ? "Generando visuales y ficha..." : "Generar ficha optimizada"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* RIGHT COLUMN: RESULT */}
            <div className="lg:h-full lg:overflow-y-auto space-y-4">
                {!result ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl bg-gray-50/50 dark:bg-gray-900/50 text-muted-foreground">
                        <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">Esperando datos...</h3>
                        <p className="max-w-xs">Completa el formulario a la izquierda para ver el resultado aquí.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fadeIn pb-10">
                        {/* INPUT READINESS SCORE */}
                        <Card className={`border-none shadow-sm ${result.score > 70 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-yellow-50 dark:bg-yellow-950/20'}`}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg">Input Readiness Score</h3>
                                        <p className="text-sm opacity-80">Calidad de la información proporcionada</p>
                                    </div>
                                    <div className="text-4xl font-black">{result.score}/100</div>
                                </div>
                                {result.inputRecommendations && result.inputRecommendations.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-wider opacity-60">Recomendaciones para mejorar:</p>
                                        <ul className="text-sm space-y-1">
                                            {result.inputRecommendations.map((rec, i) => (
                                                <li key={i} className="flex gap-2 items-start">
                                                    <AlertCircle className="w-3 h-3 mt-1 shrink-0" />
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* VISUAL PACK / GENERATED IMAGES */}
                        {result.visualAssets && result.visualAssets.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    Generación de Imágenes Híbrida
                                </h3>
                                <div className="space-y-8">
                                    {result.visualAssets.map((asset: any, assetIndex: number) => {
                                        const id = asset.moment_id || asset.id || `asset-${assetIndex}`;
                                        const title = asset.moment_label || asset.title || id;
                                        const type = asset.api_model || (asset.api_endpoint && asset.api_endpoint.split('/').pop()) || (asset.steps && asset.steps[0] && asset.steps[0].api_endpoint && asset.steps[0].api_endpoint.split('/').pop()) || asset.type || 'Custom';

                                        let recursivePrompt = asset.prompt || asset.image_prompt || asset.api_params?.prompt;
                                        if (!recursivePrompt && asset.steps) {
                                            for (const s of asset.steps) {
                                                if (s.api_params?.prompt) { recursivePrompt = s.api_params.prompt; break; }
                                                if (s.prompt) { recursivePrompt = s.prompt; break; }
                                            }
                                        }
                                        const prompt = recursivePrompt;

                                        const overlay = asset.overlay_text_instructions || asset.overlay_data;

                                        const state = imageStates[id] || { status: 'idle' };

                                        // Fallback for placeholder variables
                                        const finalAsset = { ...asset };
                                        if (finalAsset.image_prompt) {
                                            finalAsset.image_prompt = finalAsset.image_prompt.replace(/\{\{product_mask_url\}\}/g, referenceImages[0] || '');
                                        }
                                        if (finalAsset.prompt) {
                                            finalAsset.prompt = finalAsset.prompt.replace(/\{\{product_mask_url\}\}/g, referenceImages[0] || '');
                                        }
                                        if (finalAsset.api_params?.prompt) {
                                            finalAsset.api_params.prompt = finalAsset.api_params.prompt.replace(/\{\{product_mask_url\}\}/g, referenceImages[0] || '');
                                        }

                                        return (
                                            <Card key={id} className="overflow-hidden border-primary/10">
                                                <div className="bg-primary/5 px-4 py-2 border-b border-primary/10 flex justify-between items-center">
                                                    <span className="font-bold text-sm">Escena {title}</span>
                                                    <span className="text-[10px] uppercase opacity-70 border px-1 rounded bg-white dark:bg-black">
                                                        {state.status === 'success' ? 'Generada' : state.status === 'loading' ? 'Generando...' : 'Pendiente'}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2">
                                                    {/* PROMPT COLUMN */}
                                                    <div className="p-4 border-r border-primary/10 bg-gray-50/50 dark:bg-black/20">
                                                        <Label className="text-[10px] uppercase font-bold opacity-50 mb-2 block">Modelo AI</Label>
                                                        <p className="text-xs font-mono mb-4 text-purple-600 dark:text-purple-400">{type}</p>

                                                        <Label className="text-[10px] uppercase font-bold opacity-50 mb-2 block">Prompt Generado</Label>
                                                        <p className="text-xs italic text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">{prompt}</p>

                                                        {overlay && (
                                                            <div className="mt-4 pt-4 border-t border-dashed">
                                                                <Label className="text-[10px] uppercase font-bold opacity-50 mb-2 block">Datos del Overlay</Label>
                                                                <pre className="text-[10px] bg-white dark:bg-black p-2 rounded border overflow-x-auto max-h-32 custom-scrollbar">{JSON.stringify(overlay, null, 2)}</pre>
                                                            </div>
                                                        )}

                                                        <Button variant="ghost" size="sm" className="mt-2 h-6 text-xs gap-1" onClick={() => navigator.clipboard.writeText(prompt)}>
                                                            <Copy className="w-3 h-3" /> Copiar Prompt
                                                        </Button>
                                                    </div>

                                                    {/* IMAGE RESULT COLUMN */}
                                                    <div className="p-4 flex items-center justify-center min-h-[400px] bg-white dark:bg-black relative">
                                                        {state.status === 'success' && state.url ? (
                                                            <div className="relative group w-full h-full flex items-center justify-center">
                                                                <VisualAssetRenderer asset={{ ...asset, id, title, type, image_prompt: prompt, overlay_data: overlay }} imageUrl={state.url} />
                                                            </div>
                                                        ) : state.status === 'loading' ? (
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                                                                <span className="text-xs text-muted-foreground animate-pulse">Generando composición...</span>
                                                            </div>
                                                        ) : state.status === 'error' ? (
                                                            <div className="text-center p-2">
                                                                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                                                <span className="text-xs text-red-500 block font-bold">Error al generar pantalla</span>
                                                                {state.error && (
                                                                    <p className="text-[10px] text-red-400 mt-1 max-w-[200px] break-words leading-tight whitespace-pre-wrap">{state.error}</p>
                                                                )}
                                                                <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => generateOneImage(asset, referenceImages[0], assetIndex)}>
                                                                    Reintentar
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center text-muted-foreground opacity-50">
                                                                <Sparkles className="w-8 h-8 mx-auto mb-2" />
                                                                <span className="text-xs">Esperando turno...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="border-t pt-8 mt-8 space-y-6">
                            <h3 className="text-lg font-bold">Ficha de Producto Estructurada</h3>
                            <ResultBlock label="1. Título SEO" content={result.seoTitle} limit={60} />
                            <ResultBlock label="2. Descripción corta" content={result.shortDescription} limit={150} />
                            <ResultBlock label="3. Descripción larga" content={result.longDescription} limit={800} isLong />

                            <Card>
                                <CardContent className="p-4 space-y-2">
                                    <Label className="font-bold text-base">4. Bullets destacados</Label>
                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                        {(result.bullets || []).map((b, i) => <li key={i}>{b}</li>)}
                                    </ul>
                                </CardContent>
                            </Card>

                            <ResultBlock label="5. Snippet AEO" content={result.aeoSnippet} />
                            <ResultBlock label="6. Meta descripción" content={result.metaDescription} limit={155} />

                            <Card>
                                <CardContent className="p-4 space-y-3">
                                    <Label className="font-bold text-base">7. Preguntas frecuentes (FAQ)</Label>
                                    {(result.faq || []).map((item, i) => (
                                        <div key={i} className="text-sm border-l-2 pl-3 border-primary/20">
                                            <p className="font-semibold text-primary">{item.q}</p>
                                            <p className="text-muted-foreground">{item.a}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {result.aiRecommendation && (
                                <Alert className="bg-primary/5 border-primary/20">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    <AlertTitle className="text-primary font-bold">Recomendación Estratégica</AlertTitle>
                                    <AlertDescription className="text-sm italic">
                                        {result.aiRecommendation}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ResultBlock({ label, content, limit, isLong }: { label: string, content: string, limit?: number, isLong?: boolean }) {
    return (
        <Card className="group relative hover:border-primary/50 transition-colors">
            <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                    <Label className="font-bold text-base">{label}</Label>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" title="Copiar">
                        <Copy className="w-3 h-3" />
                    </Button>
                </div>
                <div className={`text-sm ${isLong ? 'whitespace-pre-wrap' : ''}`}>{content}</div>
                {limit && (
                    <div className="text-xs text-muted-foreground text-right border-t pt-1 mt-2">
                        {content.length}/{limit} caracteres
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
