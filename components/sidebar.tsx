"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Sparkles,
    History,
    CreditCard,
    Receipt,
    Settings,
    LogOut,
    LayoutDashboard
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ReferralCard } from "@/components/referral-card";

const items = [
    {
        title: "Generar Ficha",
        url: "/dashboard/generator",
        icon: Sparkles,
    },
    {
        title: "Historial",
        url: "/dashboard/history",
        icon: History,
    },
    {
        title: "Planes",
        url: "/dashboard/plans",
        icon: CreditCard,
    },
    {
        title: "Facturación",
        url: "/dashboard/billing",
        icon: Receipt,
    },
    {
        title: "Configuración",
        url: "/dashboard/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    return (
        <div className="hidden lg:flex w-64 border-r bg-white dark:bg-gray-950 flex-col h-screen fixed left-0 top-0 overflow-y-auto">
            <div className="p-6">
                <div className="mb-6 pl-1">
                    <Link href="/dashboard" className="cursor-pointer">
                        <div className="relative w-40 h-12 opacity-90 transition-opacity hover:opacity-100">
                            <Image
                                src="/uhura-logo-v2.png"
                                alt="Uhura Group"
                                fill
                                className="object-contain object-left"
                                sizes="160px"
                                priority
                            />
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-[#7F41DE] text-white p-2 rounded-lg shadow-sm">
                        <Sparkles size={20} />
                    </div>
                    <span className="font-bold text-lg tracking-tight">SKU Optimizer</span>
                </div>
            </div>

            <div className="flex-1 px-4 space-y-2 py-4 flex flex-col">
                <div className="space-y-2 flex-1">
                    {items.map((item) => (
                        <Link
                            key={item.url}
                            href={item.url}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                pathname === item.url
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon size={18} />
                            {item.title}
                        </Link>
                    ))}
                </div>

                <div className="pt-4 pb-2">
                    <ReferralCard />
                </div>
            </div>

            <div className="p-4 border-t bg-gray-50/50 dark:bg-gray-900/50 space-y-4 pb-10">
                {user?.email?.endsWith("@uhuragroup.com") ? (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            <span>Acceso Equipo</span>
                            <span className="text-primary">Ilimitado</span>
                        </div>
                        <Progress value={100} className="h-2 bg-primary/20" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Créditos {user?.plan === 'free' ? 'totales' : 'mes'}</span>
                            <span>{user?.credits || 0}/{
                                user?.plan === 'pro' ? '150' :
                                    user?.plan === 'lite' || user?.plan === 'emprendedor' ? '20' :
                                        user?.plan === 'enterprise' ? '∞' : '5'
                            }</span>
                        </div>
                        <Progress
                            value={
                                user?.plan === 'enterprise' ? 100 :
                                    ((user?.credits || 0) / (
                                        user?.plan === 'pro' ? 150 :
                                            user?.plan === 'lite' || user?.plan === 'emprendedor' ? 20 : 5
                                    )) * 100
                            }
                            className="h-2"
                        />
                    </div>
                )}

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {user?.name?.substring(0, 2).toUpperCase() || "US"}
                        </div>
                        <div className="flex flex-col truncate">
                            <span className="text-sm font-medium truncate">{user?.name}</span>
                            <span className="text-xs text-muted-foreground capitalize">
                                Plan {user?.email?.endsWith("@uhuragroup.com") ? "Equipo" : (user?.plan || "Free")}
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={signOut}
                        className="h-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                        <LogOut size={16} className="mr-2" />
                        <span className="text-xs font-semibold">Salir</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
