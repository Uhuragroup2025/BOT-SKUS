"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, AlertCircle, Copy, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
}

export default function GeneratorPage() {
    const { user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<GeneratedContent | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form States
    const [productName, setProductName] = useState("");
    const [features, setFeatures] = useState("");
    const [category, setCategory] = useState("");
    const [channel, setChannel] = useState("ecommerce");
    const [tone, setTone] = useState("comercial");

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
            await refreshProfile(); // Update credits in UI
        } catch (error) {
            console.error(error);
            setError("Hubo un error al generar la ficha. Por favor intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
            {/* LEFT COLUMN: FORM */}
            <Card className="h-full overflow-y-auto border-none shadow-md">
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Datos del producto</h2>
                        <p className="text-sm text-muted-foreground">Completa los detalles para que la IA haga su magia.</p>
                    </div>

                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del producto *</Label>
                            <Input
                                id="name"
                                placeholder="Ej: Zapatillas Running Pro X1"
                                required
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="features">Características principales *</Label>
                            <Textarea
                                id="features"
                                placeholder="Material transpirable, suela de gel, talla 40, color negro..."
                                className="h-32 resize-none"
                                required
                                value={features}
                                onChange={(e) => setFeatures(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground text-right">Separa cada característica con comas</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría del producto (Tags) *</Label>
                            <Input
                                id="category"
                                placeholder="Ej: Deportes, Calzado, Hogar (separados por coma)"
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="channel">Canal de publicación *</Label>
                            <Select value={channel} onValueChange={setChannel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un canal" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ecommerce">Ecommerce Propio (SEO/Storytelling)</SelectItem>
                                    <SelectItem value="marketplace">Marketplace (Amazon/MercadoLibre)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tone">Tono de redacción *</Label>
                            <Select value={tone} onValueChange={setTone}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un tono" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="comercial">Comercial (Ventas)</SelectItem>
                                    <SelectItem value="tecnico">Técnico (Especificaciones)</SelectItem>
                                    <SelectItem value="cercano">Cercano (Amigable)</SelectItem>
                                    <SelectItem value="profesional">Profesional (Corporativo)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Atención</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" className="w-full gap-2 py-6 text-lg" disabled={loading || credits <= 0}>
                            <Sparkles className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
                            {loading ? "Generando..." : "Generar ficha optimizada"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* RIGHT COLUMN: RESULT */}
            <div className="h-full overflow-y-auto space-y-4">
                {!result ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl bg-gray-50/50 dark:bg-gray-900/50 text-muted-foreground">
                        <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">Esperando datos...</h3>
                        <p className="max-w-xs">Completa el formulario a la izquierda para ver el resultado aquí.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fadeIn pb-10">
                        {/* SCORE CARD */}
                        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-100 dark:border-blue-900">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">9. Score de validación SEO/IA</h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">Optimización alta</p>
                                </div>
                                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{result.score}/100</div>
                            </CardContent>
                        </Card>

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

                        <ResultBlock label="5. Snippet AEO (Pregunta + Respuesta)" content={result.aeoSnippet} />
                        <ResultBlock label="6. Meta descripción SEO" content={result.metaDescription} limit={155} />

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

                        <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-200">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>8. Recomendación IA</AlertTitle>
                            <AlertDescription>{result.aiRecommendation}</AlertDescription>
                        </Alert>

                        <Card>
                            <CardContent className="p-4 space-y-2">
                                <Label className="font-bold text-base">10. Frases sugeridas para atributos ALT de imágenes</Label>
                                <div className="flex flex-wrap gap-2">
                                    {(result.imageAlt || []).map((alt, i) => (
                                        <span key={i} className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs border">
                                            {alt}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
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
    )
}
