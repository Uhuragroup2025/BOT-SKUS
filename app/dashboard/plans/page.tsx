"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PlansPage() {
    return (
        <div className="space-y-8 pb-10">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Elige el plan perfecto para ti</h1>
                <p className="text-muted-foreground text-lg">Optimiza tus fichas de producto con IA. Todos los planes incluyen 8 días de prueba.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 pt-4">
                {/* LITE PLAN */}
                <Card className="flex flex-col border-2 hover:border-primary/20 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-muted-foreground" />
                            Lite
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
                        <Button variant="outline" className="w-full">Seleccionar Lite</Button>
                    </CardFooter>
                </Card>

                {/* PRO PLAN (Highlighted) */}
                <Card className="flex flex-col border-2 border-primary relative shadow-2xl scale-105 bg-white dark:bg-gray-900">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-3 py-1">Más popular</Badge>
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Zap className="h-5 w-5 fill-primary" />
                            Pro
                        </CardTitle>
                        <CardDescription>Para crecimiento acelerado</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="text-4xl font-bold">$49 <span className="text-sm font-normal text-muted-foreground">/mes</span></div>
                        <div className="text-sm font-medium">150 fichas/mes</div>
                        <ul className="space-y-2 text-sm text-muted-foreground pt-4">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Hasta 3 usuarios</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Descarga CSV y PDF</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Validaciones SEO/IA Avanzadas</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Análisis de competencia</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Soporte prioritario</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" disabled>Plan Actual</Button>
                    </CardFooter>
                </Card>

                {/* ENTERPRISE PLAN */}
                <Card className="flex flex-col border-2 hover:border-primary/20 transition-colors">
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
                        <Button variant="outline" className="w-full">Contactar Ventas</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
