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
    const { signIn, checkUser } = useAuth();
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [mode, setMode] = useState<"login" | "signup">("login");

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || cooldown > 0 || loading) return;

        setLoading(true);
        try {
            // First, check if user exists
            const { exists } = await checkUser(email);

            if (!exists && mode === "login") {
                // User doesn't exist, switch to signup but don't submit yet
                setMode("signup");
                alert("✨ Parece que eres nuevo\nPor favor completa tus datos para crear tu cuenta.");
                setLoading(false);
                return;
            }

            if (exists && mode === "signup") {
                // User exists but is in signup mode, switch to login
                setMode("login");
                alert("👋 Ya tienes cuenta\nTe enviaremos un enlace de acceso directo.");
                // Continue with sign in as it's just a login now
            }

            // Simplified flow: try to sign in/up directly
            const metadata = mode === "signup" ? {
                full_name: fullName,
                company_name: companyName
            } : undefined;

            await signIn(email, metadata);

            setCooldown(60);
            alert("📩 Revisa tu correo\nTe enviamos un enlace seguro.");
        } catch (error: any) {
            console.error("Login page: Submit failed:", error);
            let message = error.message || "Error desconocido";

            // Handle some common errors specifically
            if (message.includes("rate limit")) {
                message = "Demasiados intentos. Espera unos minutos.";
            } else if (JSON.stringify(error) === "{}") {
                message = "Error de conexión con el servidor. Por favor, intenta de nuevo o revisa tu internet.";
            }

            alert("Error: " + message);
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
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {mode === "login" ? "Accede a SKU Optimizer" : "Crea tu cuenta gratis"}
                    </CardTitle>
                    <CardDescription className="max-w-sm mx-auto">
                        {mode === "login"
                            ? "Ingresa tu correo y te enviaremos un enlace seguro para entrar. No necesitas contraseña."
                            : "Regístrate con tus datos para empezar a optimizar tus productos hoy mismo."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
                        {mode === "signup" && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Nombre completo</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="Tu nombre"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        className="bg-white/50 dark:bg-gray-900/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Nombre de la empresa</Label>
                                    <Input
                                        id="companyName"
                                        placeholder="Tu empresa"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        required
                                        className="bg-white/50 dark:bg-gray-900/50"
                                    />
                                </div>
                            </>
                        )}
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
                                ? (mode === "login" ? "Enviando..." : "Registrando...")
                                : cooldown > 0
                                    ? `Reintentar en ${cooldown}s`
                                    : (mode === "login" ? "Enviar enlace de acceso" : "Registrarse ahora")}
                        </Button>
                        {cooldown > 0 && (
                            <p className="text-[11px] text-center text-orange-600 dark:text-orange-400 font-medium animate-pulse">
                                ⏳ Espera antes de pedir otro enlace para evitar bloqueos
                            </p>
                        )}
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                    {mode === "login" ? (
                        <div>
                            ¿No tienes cuenta? <span
                                className="text-primary hover:underline cursor-pointer font-semibold"
                                onClick={() => setMode("signup")}
                            >Regístrate gratis</span>
                        </div>
                    ) : (
                        <div>
                            ¿Ya tienes cuenta? <span
                                className="text-primary hover:underline cursor-pointer font-semibold"
                                onClick={() => setMode("login")}
                            >Inicia sesión</span>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
