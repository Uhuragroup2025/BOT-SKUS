"use client";

import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/sidebar";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, History, CreditCard, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, signOut } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            redirect("/login");
        }
    }, [user, loading]);

    if (loading) {
        return <div className="h-screen w-full flex items-center justify-center">Cargando...</div>;
    }

    const navItems = [
        { label: "Generar", href: "/dashboard/generator", icon: Sparkles },
        { label: "Historial", href: "/dashboard/history", icon: History },
        { label: "Planes", href: "/dashboard/plans", icon: CreditCard },
        { label: "Cerrar", href: "#logout", icon: LogOut, action: true },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 border-none">
            <Sidebar />
            <main className="lg:pl-64 min-h-screen transition-all duration-300">
                <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
                    {children}
                </div>
                {/* Mobile spacing for bottom nav */}
                <div className="h-20 lg:hidden" />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-t lg:hidden z-50">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        if (item.action) {
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => signOut()}
                                    className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors text-muted-foreground hover:text-red-500"
                                >
                                    <Icon size={20} />
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </button>
                            );
                        }
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                                    }`}
                            >
                                <Icon size={20} className={isActive ? "fill-primary/10" : ""} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
                {/* Safe area for home indicator on iOS */}
                <div className="h-safe-bottom bg-transparent" />
            </nav>
        </div>
    );
}
