"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, AlertCircle, Copy, Check, FileText } from "lucide-react";
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
    visualPack?: {
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
    const [extractionData, setExtractionData] = useState<any>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Form States
    const [productName, setProductName] = useState("");
    const [features, setFeatures] = useState("");
    const [category, setCategory] = useState("");
    const [channel, setChannel] = useState("ecommerce");
    const [tone, setTone] = useState("comercial");

    // New Structured Fields
    const [productType, setProductType] = useState("Belleza & Cuidado Personal");
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [presentation, setPresentation] = useState("");
    const [material, setMaterial] = useState("");
    const [mainUse, setMainUse] = useState("");
    const [certification, setCertification] = useState("");

    const credits = user?.credits ?? 0;

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (credits <= 0) {
            setError("No tienes créditos suficientes. Por favor, adquiere un plan.");
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
                    productName,
                    features,
                    category,
                    channel,
                    tone,
                    type: productType,
                    brand,
                    model,
                    presentation,
                    material,
                    mainUse,
                    certification,
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
            setLoading(false); // Reset loading immediately after getting result

            // Refresh credits in background
            refreshProfile().catch(err => console.error("Error refreshing profile:", err));
        } catch (error) {
            console.error(error);
            setError("Hubo un error al generar la ficha. Por favor intenta de nuevo.");
            setLoading(false);
        }
    };

    const handleExtract = async (text?: string, image?: string) => {
        setExtracting(true);
        setError(null);
        try {
            const response = await fetch("/api/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, image }),
            });
            if (!response.ok) throw new Error("Extraction failed");
            const data = await response.json();

            setExtractionData(data);
            setShowReviewModal(true);
        } catch (err) {
            console.error(err);
            setError("Error al extraer datos. Intenta ingresarlos manualmente.");
        } finally {
            setExtracting(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar que sea imagen
        if (!file.type.startsWith('image/')) {
            setError("Por favor selecciona un archivo de imagen.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            await handleExtract(undefined, base64);
        };
        reader.readAsDataURL(file);
    };

    const handleConfirmExtraction = () => {
        if (extractionData) {
            if (extractionData.brand) setBrand(extractionData.brand);
            if (extractionData.model) setModel(extractionData.model);
            if (extractionData.presentation) setPresentation(extractionData.presentation);
            if (extractionData.material) setMaterial(extractionData.material);
            if (extractionData.mainUse) setMainUse(extractionData.mainUse);
            if (extractionData.certification) setCertification(extractionData.certification);
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
                        <div className="space-y-4 my-4 max-h-[40vh] overflow-y-auto pr-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold opacity-50">Marca</Label>
                                    <Input
                                        value={extractionData.brand || ""}
                                        onChange={(e) => setExtractionData({ ...extractionData, brand: e.target.value })}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold opacity-50">Modelo</Label>
                                    <Input
                                        value={extractionData.model || ""}
                                        onChange={(e) => setExtractionData({ ...extractionData, model: e.target.value })}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold opacity-50">Presentación</Label>
                                <Input
                                    value={extractionData.presentation || ""}
                                    onChange={(e) => setExtractionData({ ...extractionData, presentation: e.target.value })}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold opacity-50">Material / Ingredientes</Label>
                                <Input
                                    value={extractionData.material || ""}
                                    onChange={(e) => setExtractionData({ ...extractionData, material: e.target.value })}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold opacity-50">Uso Principal</Label>
                                <Input
                                    value={extractionData.mainUse || ""}
                                    onChange={(e) => setExtractionData({ ...extractionData, mainUse: e.target.value })}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold opacity-50">Certificación / Prueba</Label>
                                <Input
                                    value={extractionData.certification || ""}
                                    onChange={(e) => setExtractionData({ ...extractionData, certification: e.target.value })}
                                    className="h-8 text-sm"
                                />
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
                                <Label className="text-[10px] uppercase font-bold text-primary block mb-1">Tu Créditos</Label>
                                <div className="text-lg font-bold text-center">{credits}</div>
                            </div>
                        </div>

                        {/* SMART EXTRACTION */}
                        <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30 space-y-3">
                            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-semibold">Smart Extraction (BETA)</span>
                            </div>
                            <Textarea
                                placeholder="Pega aquí un PDF extraído, descripción larga o texto del producto para auto-rellenar..."
                                className="bg-white/50 dark:bg-gray-900/50 text-xs h-20"
                                id="smart-extract-text"
                            />
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-none gap-2"
                                    onClick={() => {
                                        const text = (document.getElementById('smart-extract-text') as HTMLTextAreaElement).value;
                                        if (text) handleExtract(text);
                                    }}
                                    disabled={extracting}
                                >
                                    {extracting ? (
                                        <Sparkles className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <FileText className="w-4 h-4" />
                                    )}
                                    {extracting ? "Analizando..." : "Extraer de texto"}
                                </Button>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={extracting}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 gap-2"
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                        disabled={extracting}
                                        type="button"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Subir imagen
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo de producto *</Label>
                                <Select value={productType} onValueChange={setProductType}>
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
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre base del producto *</Label>
                            <Input
                                id="name"
                                placeholder="Ej: Jabón de manos antibacterial"
                                required
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="brand">Marca</Label>
                                <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej: Protex" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="model">Modelo / Línea</Label>
                                <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ej: Aloe Vera" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="presentation">Presentación</Label>
                                <Input id="presentation" value={presentation} onChange={(e) => setPresentation(e.target.value)} placeholder="Ej: 500ml, Pack x3" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="material">Material / Ingredientes</Label>
                                <Input id="material" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Ej: Nitrilo, Acero..." />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="mainUse">Uso Principal</Label>
                                <Input id="mainUse" value={mainUse} onChange={(e) => setMainUse(e.target.value)} placeholder="Ej: Rostro, Industrial..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="certification">Certificación / Garantía</Label>
                                <Input id="certification" value={certification} onChange={(e) => setCertification(e.target.value)} placeholder="Ej: Cruelty Free, ISO..." />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="features">Otras especificaciones / texto libre *</Label>
                            <Textarea
                                id="features"
                                placeholder="Cualquier otro detalle relevante aquí..."
                                className="h-24 resize-none"
                                required
                                value={features}
                                onChange={(e) => setFeatures(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="channel">Canal *</Label>
                                <Select value={channel} onValueChange={setChannel}>
                                    <SelectTrigger id="channel">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ecommerce">Tienda online VTEX/Shopify</SelectItem>
                                        <SelectItem value="marketplace">Marketplace Mercadolibre/Amazon</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tone">Tono *</Label>
                                <Select value={tone} onValueChange={setTone}>
                                    <SelectTrigger id="tone">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="comercial">Comercial</SelectItem>
                                        <SelectItem value="tecnico">Técnico</SelectItem>
                                        <SelectItem value="cercano">Cercano</SelectItem>
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

                        <Button type="submit" className="w-full gap-2 py-6 text-lg bg-primary hover:bg-primary/90" disabled={loading || credits <= 0}>
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

                        {/* VISUAL PACK */}
                        {result.visualPack && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    Visual Pack (5 imágenes sugeridas)
                                </h3>
                                <div className="space-y-4">
                                    {result.visualPack.map((img) => (
                                        <Card key={img.id} className="overflow-hidden border-primary/10">
                                            <div className="bg-primary/5 px-4 py-2 border-b border-primary/10 flex justify-between items-center">
                                                <span className="font-bold text-sm">Imagen {img.id}: {img.title}</span>
                                            </div>
                                            <CardContent className="p-4 space-y-3">
                                                <div>
                                                    <Label className="text-[10px] uppercase font-bold opacity-50">Instrucción Visual</Label>
                                                    <p className="text-sm italic">{img.visual}</p>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-lg border">
                                                    <Label className="text-[10px] uppercase font-bold opacity-50 block mb-2">Copy Sugerido</Label>
                                                    {img.copy.headline && <p className="font-bold text-primary">{img.copy.headline}</p>}
                                                    {img.copy.subheadline && <p className="text-sm font-medium">{img.copy.subheadline}</p>}
                                                    {img.copy.text && <p className="text-sm">{img.copy.text}</p>}
                                                    {img.copy.bullets && (
                                                        <ul className="list-disc pl-4 text-xs mt-2 space-y-1">
                                                            {img.copy.bullets.map((b, idx) => <li key={idx}>{b}</li>)}
                                                        </ul>
                                                    )}
                                                    {img.copy.seals && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {img.copy.seals.map((s, idx) => (
                                                                <span key={idx} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border-t pt-8 mt-8 space-y-6 disabled">
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
