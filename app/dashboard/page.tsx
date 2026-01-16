"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
    const { user } = useAuth();
    const [generationsCount, setGenerationsCount] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;

            // Get first day of current month
            const date = new Date();
            const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();

            const { count, error } = await supabase
                .from('generations')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', firstDay);

            if (!error && count !== null) {
                setGenerationsCount(count);
            }
        };

        fetchStats();
    }, [user, supabase]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Inicio</h1>
                <Link href="/dashboard/generator">
                    <Button className="gap-2 shadow-lg hover:shadow-primary/20 transition-all">
                        <Sparkles className="w-4 h-4" />
                        Nueva Ficha
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Generaciones este mes</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{generationsCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Fichas generadas
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Créditos restantes</CardTitle>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user?.credits ?? 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Plan {user?.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : '...'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                    <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-semibold">Genera tu primera ficha optimizada</h2>
                <p className="text-muted-foreground max-w-md">
                    Completa el formulario y obtén títulos, descripciones y snippets perfectos para SEO y AEO en segundos.
                </p>
                <Link href="/dashboard/generator">
                    <Button size="lg" className="mt-4 gap-2">
                        Comenzar ahora
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}

