"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";

export default function LoginPage() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        await signIn(email);
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-purple-50/30 via-white to-[#7F41DE]/10 dark:from-purple-950/30 dark:via-gray-950 dark:to-purple-900/10 p-4">
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-3xl"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#7F41DE]/10 blur-3xl"></div>
            </div>

            <Card className="w-full max-w-md relative z-10 border-none shadow-xl bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="relative w-32 h-8">
                            <Image
                                src="/uhura-logo-v2.png"
                                alt="Uhura Group"
                                fill
                                className="object-contain"
                                sizes="128px"
                                priority
                            />
                        </div>
                    </div>
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-[#7F41DE]/10 rounded-xl flex items-center justify-center text-[#7F41DE]">
                            <Sparkles className="w-6 h-6" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Bienvenido a SKU Optimizer</CardTitle>
                    <CardDescription className="max-w-sm mx-auto">
                        Genera fichas de producto optimizadas para SEO, buscadores con IA y asistentes como ChatGPT, Gemini y otros motores de descubrimiento.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="hola@tuempresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-white/50 dark:bg-gray-900/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña (Demo: cualquiera)</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="bg-white/50 dark:bg-gray-900/50"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 transition-colors" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                    <div>
                        ¿No tienes cuenta? <span
                            className="text-primary hover:underline cursor-pointer"
                            onClick={() => {
                                document.getElementById('email')?.focus();
                            }}
                        >Regístrate gratis</span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
