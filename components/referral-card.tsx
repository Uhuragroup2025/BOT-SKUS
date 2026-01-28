"use client";

import { useState } from "react";
import {
    MessageCircle,
    Linkedin,
    Twitter,
    Copy,
    Check,
    Share2,
    Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


export function ReferralCard() {
    const [copied, setCopied] = useState(false);

    const APP_URL = "https://skuoptimizer.ai"; // URL base de la app
    const SHARE_MESSAGE = `Si vendes online, esto te puede interesar.\n\nEstoy usando una herramienta que genera automáticamente fichas de producto optimizadas para Google, para aparecer en IA como GPT y para marketplaces como Mercado Libre.\n\nMe ha ahorrado horas de trabajo.\n\n👉 ${APP_URL}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(SHARE_MESSAGE);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(SHARE_MESSAGE)}`;
        window.open(url, "_blank");
    };

    const shareLinkedIn = () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(APP_URL)}`;
        window.open(url, "_blank");
    };

    const shareX = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_MESSAGE)}`;
        window.open(url, "_blank");
    };

    return (
        <Card className="border-none shadow-md bg-gradient-to-br from-[#7F41DE]/5 to-purple-50 dark:from-[#7F41DE]/10 dark:to-gray-900/50 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Users size={80} className="text-[#7F41DE] -mr-8 -mt-8 rotate-12" />
            </div>

            <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#7F41DE]">
                    <Share2 size={16} />
                    ¿Conoces a alguien con ecommerce?
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Compartir **SKU Optimizer** puede ahorrarle horas de trabajo creando fichas de producto… y ayudarle a posicionarse mejor en Google y marketplaces.
                </p>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={shareWhatsApp}
                        className="h-8 w-8 bg-white/50 hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30 border-dashed"
                        title="Compartir por WhatsApp"
                    >
                        <MessageCircle size={14} />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={shareLinkedIn}
                        className="h-8 w-8 bg-white/50 hover:bg-[#0077B5]/10 hover:text-[#0077B5] hover:border-[#0077B5]/30 border-dashed"
                        title="Compartir en LinkedIn"
                    >
                        <Linkedin size={14} />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={shareX}
                        className="h-8 w-8 bg-white/50 hover:bg-black/10 hover:text-black dark:hover:text-white dark:hover:bg-white/10 border-dashed"
                        title="Compartir en X"
                    >
                        <Twitter size={14} />
                    </Button>

                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={handleCopy}
                        className="h-8 w-8 ml-auto"
                        title="Copiar mensaje"
                    >
                        {copied ? (
                            <Check size={14} className="text-green-500" />
                        ) : (
                            <Copy size={14} />
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
