"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface UserProfile {
    id: string;
    email: string;
    name: string;
    company_name?: string;
    plan: "free" | "emprendedor" | "lite" | "pro" | "enterprise";
    credits: number;
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signIn: (email: string, metadata?: { full_name?: string, company_name?: string }) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: false,
    signIn: async () => { },
    signOut: async () => { },
    refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    const fetchProfile = async (sessionUser: SupabaseUser) => {
        try {
            console.log("Fetching profile for user:", sessionUser.id, sessionUser.email);
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .maybeSingle();

            if (error) {
                console.error("AuthProvider: Error in fetchProfile query detected.");
                console.error("AuthProvider: Raw error object:", error);
                console.error("AuthProvider: Error message:", error.message);
                console.error("AuthProvider: Error code:", error.code);
                try {
                    console.error("AuthProvider: Error JSON:", JSON.stringify(error));
                } catch (e) {
                    console.error("AuthProvider: Error could not be stringified");
                }
                return null;
            }

            if (profile) {
                return {
                    id: sessionUser.id,
                    email: sessionUser.email!,
                    name: profile.full_name || sessionUser.email!,
                    company_name: profile.company_name,
                    plan: profile.plan || 'free',
                    credits: profile.credits ?? 0
                } as UserProfile;
            } else {
                console.log("No profile found for user:", sessionUser.id);
            }
        } catch (err) {
            console.error("Unexpected error in fetchProfile catch block:", err);
        }
        return null;
    };

    const refreshProfile = async () => {
        const { data: { user: sessionUser } } = await supabase.auth.getUser();
        if (sessionUser) {
            const profile = await fetchProfile(sessionUser);
            if (profile) {
                setUser(profile);
            }
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                console.log("AuthProvider: Initializing...");
                console.log("AuthProvider: URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
                console.log("AuthProvider: Key Prefix:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 15));

                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error("AuthProvider: Error getting session:", sessionError);
                }

                if (session?.user) {
                    console.log("AuthProvider: Session found for:", session.user.email);
                    const profile = await fetchProfile(session.user);
                    if (profile) {
                        setUser(profile);
                    } else {
                        console.warn("AuthProvider: No profile found, using fallback session data");
                        const isTeam = session.user.email?.endsWith("@uhuragroup.com");
                        setUser({
                            id: session.user.id,
                            email: session.user.email!,
                            name: session.user.user_metadata?.full_name || session.user.email!,
                            plan: isTeam ? 'enterprise' : 'free',
                            credits: isTeam ? 9999 : 5
                        });
                    }
                } else {
                    console.log("AuthProvider: No active session found during initialization");
                }
            } catch (err) {
                console.error("AuthProvider: Unexpected initialization error:", err);
            } finally {
                setLoading(false);
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                console.log("AuthProvider: Auth state changed:", event, session?.user?.email);
                if (session?.user) {
                    const profile = await fetchProfile(session.user);
                    if (profile) {
                        setUser(profile);
                    } else {
                        const isTeam = session.user.email?.endsWith("@uhuragroup.com");
                        setUser({
                            id: session.user.id,
                            email: session.user.email!,
                            name: session.user.user_metadata?.full_name || session.user.email!,
                            plan: isTeam ? 'enterprise' : 'free',
                            credits: isTeam ? 9999 : 5
                        });
                    }
                } else {
                    setUser(null);
                }
                setLoading(false);
            });

            return () => subscription.unsubscribe();
        };

        initializeAuth();
    }, []);

    const signIn = async (email: string, metadata?: { full_name?: string, company_name?: string }) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: metadata ? {
                    full_name: metadata.full_name,
                    company_name: metadata.company_name
                } : undefined
            },
        });

        if (error) {
            console.error("Error signing in:", error);
            alert("Error login: " + error.message);
        } else {
            alert("📩 Revisa tu correo\nTe enviamos un enlace seguro para ingresar a tu cuenta.\nSi no lo ves, revisa spam o promociones.");
        }
        setLoading(false);
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

