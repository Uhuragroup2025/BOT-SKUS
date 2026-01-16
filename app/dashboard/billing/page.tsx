"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Download } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function BillingPage() {
    const { user } = useAuth();
    const getDisplayPlanName = (plan?: string) => {
        if (!plan) return 'Free';
        if (plan === 'lite' || plan === 'emprendedor') return 'Emprendedor';
        return plan.charAt(0).toUpperCase() + plan.slice(1);
    };

    const planName = getDisplayPlanName(user?.plan);

    const getPlanPrice = (plan?: string) => {
        if (plan === 'enterprise') return '$149.00';
        if (plan === 'pro') return '$49.00';
        if (plan === 'lite' || plan === 'emprendedor') return '$19.00';
        return '$0.00';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
                <p className="text-muted-foreground">Gestiona tus métodos de pago y descarga tus facturas.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Método de pago principal</CardTitle>
                        <CardDescription>Se utiliza para la renovación mensual</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 border p-4 rounded-lg">
                            <CreditCard className="h-8 w-8 text-primary" />
                            <div>
                                <p className="font-semibold">Visa terminada en 4242</p>
                                <p className="text-xs text-muted-foreground">Expira en 12/2028</p>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full">Cambiar tarjeta</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Próxima factura</CardTitle>
                        <CardDescription>Suscripción Plan {planName}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span>Total a pagar:</span>
                            <span className="font-bold text-lg">{getPlanPrice(user?.plan)} USD</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>Fecha de cobro:</span>
                            <span>15 Feb 2026</span>
                        </div>
                        <div className="pt-4">
                            <Button variant="secondary" className="w-full">Cancelar suscripción</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de facturas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="text-center py-4 text-muted-foreground">
                            No hay facturas disponibles.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

