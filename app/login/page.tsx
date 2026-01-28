"use client";

import { useState, useEffect } from "react";
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
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || cooldown > 0) return;
        setLoading(true);
        try {
            await signIn(email);
            setCooldown(60); // Inicia cooldown de 60 segundos
        } catch (error) {
            console.error("Login attempt failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-purple-50/30 via-white to-[#7F41DE]/10 dark:from-purple-950/30 dark:via-gray-950 dark:to-purple-900/10 p-4 sm:p-6 lg:p-8">
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-3xl"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#7F41DE]/10 blur-3xl"></div>
            </div>

            <Card className="w-full max-w-sm sm:max-w-md relative z-10 border-none shadow-xl bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
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
                    <CardTitle className="text-2xl font-bold tracking-tight">Accede a SKU Optimizer</CardTitle>
                    <CardDescription className="max-w-sm mx-auto">
                        Ingresa tu correo y te enviaremos un enlace seguro para entrar.
                        <br />
                        No necesitas contraseña.
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
                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 transition-colors"
                            disabled={loading || cooldown > 0}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {loading
                                ? "Enviando..."
                                : cooldown > 0
                                    ? `Reintentar en ${cooldown}s`
                                    : "Enviar enlace de acceso"}
                        </Button>
                        {cooldown > 0 && (
                            <p className="text-[11px] text-center text-orange-600 dark:text-orange-400 font-medium animate-pulse">
                                ⏳ Espera antes de pedir otro enlace para evitar bloqueos
                            </p>
                        )}
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
