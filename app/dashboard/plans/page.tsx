"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

export default function PlansPage() {
    const { user } = useAuth();
    const plan = user?.plan || 'free';
    const currentPlan = plan === 'lite' ? 'emprendedor' : plan;

    return (
        <div className="space-y-8 pb-10">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Elige el plan perfecto para ti</h1>
                <p className="text-muted-foreground text-lg">“Empieza gratis. Solo pagas cuando lo necesitas.”</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                {/* FREE PLAN */}
                <Card className={`flex flex-col border-2 transition-colors ${currentPlan === 'free' ? 'border-primary shadow-lg' : 'hover:border-primary/20'}`}>
                    {currentPlan === 'free' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                            <Badge className="bg-primary text-primary-foreground px-3 py-1">Plan Actual</Badge>
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-muted-foreground" />
                            Free
                        </CardTitle>
                        <CardDescription>Para probar la magia</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="text-4xl font-bold">$0 <span className="text-sm font-normal text-muted-foreground">/siempre</span></div>
                        <div className="text-sm font-medium">5 fichas totales</div>
                        <ul className="space-y-2 text-sm text-muted-foreground pt-4">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 1 usuario</li>
                            <li className="flex items-center gap-2 font-medium text-destructive/80"><X className="h-4 w-4" /> Sin descarga PDF/CSV</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Soporte básico</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant={currentPlan === 'free' ? "secondary" : "outline"} className="w-full" disabled={currentPlan === 'free'}>
                            {currentPlan === 'free' ? 'Plan Actual' : 'Seleccionar'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* EMPRENDEDOR PLAN */}
                <Card className={`flex flex-col border-2 transition-colors ${currentPlan === 'emprendedor' ? 'border-primary shadow-lg' : 'hover:border-primary/20'}`}>
                    {currentPlan === 'emprendedor' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                            <Badge className="bg-primary text-primary-foreground px-3 py-1">Tu Plan Actual</Badge>
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-muted-foreground" />
                            Emprendedor
                        </CardTitle>
                        <CardDescription>Para pequeños comercios</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="text-4xl font-bold">$19 <span className="text-sm font-normal text-muted-foreground">/mes</span></div>
                        <div className="text-sm font-medium">20 fichas/mes</div>
                        <ul className="space-y-2 text-sm text-muted-foreground pt-4">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 1 usuario</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Validación básica SEO</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Soporte por email</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant={currentPlan === 'emprendedor' ? "secondary" : "outline"} className="w-full" disabled={currentPlan === 'emprendedor'}>
                            {currentPlan === 'emprendedor' ? 'Plan Actual' : 'Seleccionar'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* PRO PLAN */}
                <Card className={`flex flex-col border-2 relative transition-all ${currentPlan === 'pro' ? 'border-primary shadow-xl scale-105 z-10' : 'hover:border-primary/20 bg-white dark:bg-gray-900'}`}>
                    {currentPlan === 'pro' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                            <Badge className="bg-primary text-primary-foreground px-3 py-1">Tu Plan Actual</Badge>
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${currentPlan === 'pro' ? 'text-primary' : ''}`}>
                            <Zap className={`h-5 w-5 ${currentPlan === 'pro' ? 'fill-primary' : 'text-muted-foreground'}`} />
                            Pro
                        </CardTitle>
                        <CardDescription>Para crecimiento acelerado</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="text-4xl font-bold">$49 <span className="text-sm font-normal text-muted-foreground">/mes</span></div>
                        <div className="text-sm font-medium">150 fichas/mes</div>
                        <ul className="space-y-2 text-sm text-muted-foreground pt-4">
                            <li className="flex items-center gap-2"><Check className={`h-4 w-4 ${currentPlan === 'pro' ? 'text-primary' : 'text-green-500'}`} /> Hasta 3 usuarios</li>
                            <li className="flex items-center gap-2"><Check className={`h-4 w-4 ${currentPlan === 'pro' ? 'text-primary' : 'text-green-500'}`} /> Descarga CSV y PDF</li>
                            <li className="flex items-center gap-2"><Check className={`h-4 w-4 ${currentPlan === 'pro' ? 'text-primary' : 'text-green-500'}`} /> Validaciones SEO/IA Avanzadas</li>
                            <li className="flex items-center gap-2"><Check className={`h-4 w-4 ${currentPlan === 'pro' ? 'text-primary' : 'text-green-500'}`} /> Análisis de competencia</li>
                            <li className="flex items-center gap-2"><Check className={`h-4 w-4 ${currentPlan === 'pro' ? 'text-primary' : 'text-green-500'}`} /> Soporte prioritario</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant={currentPlan === 'pro' ? "secondary" : "default"} disabled={currentPlan === 'pro'}>
                            {currentPlan === 'pro' ? 'Plan Actual' : 'Seleccionar Pro'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* ENTERPRISE PLAN */}
                <Card className={`flex flex-col border-2 transition-colors ${currentPlan === 'enterprise' ? 'border-primary shadow-lg' : 'hover:border-primary/20'}`}>
                    {currentPlan === 'enterprise' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                            <Badge className="bg-primary text-primary-foreground px-3 py-1">Tu Plan Actual</Badge>
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-muted-foreground" />
                            Enterprise
                        </CardTitle>
                        <CardDescription>Para grandes volúmenes</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="text-4xl font-bold">$149 <span className="text-sm font-normal text-muted-foreground">/mes</span></div>
                        <div className="text-sm font-medium">Fichas ilimitadas</div>
                        <ul className="space-y-2 text-sm text-muted-foreground pt-4">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 10+ usuarios</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Todas las funcionalidades</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> API Access</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Integración con CMS</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Onboarding personalizado</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant={currentPlan === 'enterprise' ? "secondary" : "outline"} className="w-full" disabled={currentPlan === 'enterprise'}>
                            {currentPlan === 'enterprise' ? 'Plan Actual' : 'Contactar Ventas'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

