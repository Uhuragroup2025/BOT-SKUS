"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, MoreHorizontal, Download, Eye, Copy, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { jsPDF } from "jspdf";

interface Generation {
    id: number;
    product_name: string;
    created_at: string;
    settings: {
        category: string;
        channel?: string;
        tone?: string;
    };
    content: any;
    score_ia: number | null;
}

const DISPLAY_ORDER = [
    { key: "seoTitle", label: "Título SEO" },
    { key: "shortDescription", label: "Descripción Corta" },
    { key: "longDescription", label: "Descripción Larga" },
    { key: "bullets", label: "Bullet Points" },
    { key: "faq", label: "Preguntas Frecuentes (FAQ)" },
    { key: "imageAlt", label: "Alt Text de Imágenes" },
    { key: "metaDescription", label: "Meta Descripción" },
    { key: "aeoSnippet", label: "Snippet AEO / GEO" },
    { key: "aiRecommendation", label: "Recomendación de IA" },
    { key: "score", label: "Score" }
];

const KEY_MAP: Record<string, string> = {
    "seo_title": "seoTitle",
    "short_description": "shortDescription",
    "long_description": "longDescription",
    "bullet_points": "bullets",
    "image_alt": "imageAlt",
    "meta_description": "metaDescription",
    "aeo_snippet": "aeoSnippet",
    "ai_recommendation": "aiRecommendation",
    "score_ia": "score"
};

export default function HistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchGenerations = async () => {
            if (authLoading) return;

            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('generations')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching generations:", error);
            } else {
                setGenerations(data || []);
            }
            setLoading(false);
        };

        fetchGenerations();
    }, [user, authLoading, supabase]);

    const handleView = (item: Generation) => {
        setSelectedGeneration(item);
        setDialogOpen(true);
    };

    const getScoreColor = (score: number | null) => {
        if (score === null) return "text-muted-foreground";
        if (score >= 90) return "text-green-600";
        if (score >= 75) return "text-yellow-600";
        return "text-red-600";
    };

    const getBadgeVariant = (score: number | null) => {
        if (score === null) return "bg-gray-100 text-gray-800";
        if (score >= 90) return "bg-green-100 text-green-800 hover:bg-green-200";
        if (score >= 75) return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
        return "bg-red-100 text-red-800 hover:bg-red-200";
    };

    const getNormalizedContent = (content: any) => {
        if (!content) return {};
        const normalized: any = { ...content };
        Object.entries(KEY_MAP).forEach(([snake, camel]) => {
            if (content[snake] && !content[camel]) {
                normalized[camel] = content[snake];
            }
        });
        return normalized;
    };

    const handleDownloadPDF = (item: Generation) => {
        const doc = new jsPDF();
        const content = getNormalizedContent(item.content);

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(`Ficha de Producto: ${item.product_name}`, 10, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Categoría: ${item.settings?.category || 'General'} | Canal: ${item.settings?.channel || 'Ecommerce'}`, 10, 28);
        doc.text(`Fecha: ${new Date(item.created_at).toLocaleDateString()}`, 10, 34);

        const displayedScore = item.score_ia !== null ? item.score_ia : (content.score || null);
        if (displayedScore !== null) {
            doc.setFont("helvetica", "bold");
            doc.text(`Score de Optimización: ${displayedScore}/100`, 10, 42);
        }

        let yPos = 52;
        doc.setTextColor(0);

        DISPLAY_ORDER.forEach(({ key, label }) => {
            const value = content[key];
            if (!value || key === 'score') return;

            // Start new page if needed before title
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }

            // Draw Section Title
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text(label.toUpperCase(), 10, yPos);
            yPos += 7;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);

            if (key === 'faq' && Array.isArray(value)) {
                value.forEach((f: any) => {
                    const question = `P: ${f.q || f.question || ''}`;
                    const answer = `R: ${f.a || f.answer || ''}`;

                    const qLines = doc.splitTextToSize(question, 180);
                    const aLines = doc.splitTextToSize(answer, 180);

                    if (yPos + (qLines.length + aLines.length) * 5 > 280) {
                        doc.addPage();
                        yPos = 20;
                    }

                    doc.setFont("helvetica", "bold");
                    doc.text(qLines, 10, yPos);
                    yPos += qLines.length * 5;

                    doc.setFont("helvetica", "normal");
                    doc.text(aLines, 10, yPos);
                    yPos += (aLines.length * 5) + 3;
                });
            } else if (Array.isArray(value)) {
                const cleanValue = value.map(v => `• ${String(v)}`).join("\n");
                const lines = doc.splitTextToSize(cleanValue, 180);
                doc.text(lines, 10, yPos);
                yPos += lines.length * 5;
            } else {
                const lines = doc.splitTextToSize(String(value), 180);
                doc.text(lines, 10, yPos);
                yPos += lines.length * 5;
            }

            yPos += 8; // Extra margin between sections
        });

        doc.save(`${item.product_name.replace(/\s+/g, '_')}_ficha.pdf`);
    };

    const handleExportCSV = () => {
        if (generations.length === 0) return;

        const headers = [
            "ID",
            "Producto",
            "Categoría",
            "Canal",
            "Tono",
            "Score IA",
            "Fecha",
            ...DISPLAY_ORDER.map(d => d.label)
        ];

        const rows = generations.map(g => {
            const date = new Date(g.created_at).toISOString();
            const content = getNormalizedContent(g.content);
            const row: any[] = [
                g.id,
                g.product_name,
                g.settings?.category || '',
                g.settings?.channel || '',
                g.settings?.tone || '',
                g.score_ia !== null ? g.score_ia : (content.score || ''),
                date
            ];

            DISPLAY_ORDER.forEach(({ key }) => {
                let val = content[key] || '';
                if (key === 'faq' && Array.isArray(val)) {
                    val = val.map((f: any) => `${f.q || f.question}: ${f.a || f.answer}`).join(" | ");
                } else if (Array.isArray(val)) {
                    val = val.join(" | ");
                } else if (typeof val === 'object') {
                    val = JSON.stringify(val);
                }
                row.push(String(val).replace(/"/g, '""')); // Escape quotes
            });

            return row;
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "historial_fichas_profesional.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderContentValue = (key: string, value: any) => {
        if (!value) return null;

        if (key === 'faq' && Array.isArray(value)) {
            return (
                <div className="space-y-4">
                    {value.map((f, i) => (
                        <div key={i} className="bg-background border rounded-lg p-3">
                            <p className="font-bold text-sm mb-1">P: {f.q || f.question}</p>
                            <p className="text-sm text-muted-foreground">R: {f.a || f.answer}</p>
                        </div>
                    ))}
                </div>
            );
        }

        if (Array.isArray(value)) {
            return (
                <ul className="list-disc pl-5 space-y-1">
                    {value.map((v, i) => (
                        <li key={i} className="text-sm">{String(v)}</li>
                    ))}
                </ul>
            );
        }

        return (
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {String(value)}
            </div>
        );
    };

    if (loading || authLoading) {
        return <div className="p-8 text-center text-muted-foreground">Cargando historial...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Historial de Fichas</h1>
                    <p className="text-muted-foreground">Gestiona y descarga tus contenidos generados previamente.</p>
                </div>
                <Button variant="outline" onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Producto</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Score IA</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {generations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <p className="text-lg font-medium">Aún no has generado fichas</p>
                                            <p className="text-sm">Crea tu primera ficha para verla aquí.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                generations.map((item) => {
                                    const content = getNormalizedContent(item.content);
                                    const displayedScore = item.score_ia !== null ? item.score_ia : (content.score || null);

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-primary/10 rounded-md text-primary">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    {item.product_name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{item.settings?.category || 'General'}</TableCell>
                                            <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center font-bold text-sm">
                                                    <span className={getScoreColor(displayedScore)}>
                                                        {displayedScore || '--'}
                                                    </span>
                                                    <span className="text-muted-foreground font-normal">/100</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="default" className={getBadgeVariant(displayedScore)}>
                                                    {displayedScore && displayedScore >= 75 ? 'Optimizado' : 'Revisar'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleView(item)}>
                                                            <Eye className="mr-2 h-4 w-4" /> Ver ficha completa
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownloadPDF(item)}>
                                                            <Download className="mr-2 h-4 w-4" /> Descargar PDF
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Ficha Profesional: {selectedGeneration?.product_name}</DialogTitle>
                        <DialogDescription>
                            Generado el {selectedGeneration && new Date(selectedGeneration.created_at).toLocaleDateString()} |
                            Categoría: {selectedGeneration?.settings?.category || 'General'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-6 mt-6">
                        {selectedGeneration && (() => {
                            const content = getNormalizedContent(selectedGeneration.content);
                            return DISPLAY_ORDER.map(({ key, label }) => {
                                const val = content[key];
                                if (!val || key === 'score') return null;
                                return (
                                    <div key={key} className="space-y-3 bg-muted/30 p-5 rounded-xl border border-border/50">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-primary/70">{label}</h3>
                                        <div className="bg-background/50 rounded-lg p-1">
                                            {renderContentValue(key, val)}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                        <Button variant="outline" onClick={() => selectedGeneration && handleDownloadPDF(selectedGeneration)}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar PDF
                        </Button>
                        <Button onClick={() => setDialogOpen(false)} className="px-8 bg-primary hover:bg-primary/90 text-white">
                            Cerrar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}


