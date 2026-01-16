"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface UserProfile {
    id: string;
    email: string;
    name: string;
    plan: "lite" | "pro" | "enterprise";
    credits: number;
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signIn: (email: string) => Promise<void>;
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
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .single();

            if (error) {
                console.error("Error fetching profile:", error);
                return null;
            }

            if (profile) {
                return {
                    id: sessionUser.id,
                    email: sessionUser.email!,
                    name: profile.full_name || sessionUser.email!,
                    plan: profile.plan || 'lite',
                    credits: profile.credits || 0
                } as UserProfile;
            }
        } catch (err) {
            console.error("Unexpected error fetching profile:", err);
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
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const profile = await fetchProfile(session.user);
                if (profile) {
                    setUser(profile);
                } else {
                    // Fallback if profile doesn't exist yet (should be handled by trigger, but just in case)
                    setUser({
                        id: session.user.id,
                        email: session.user.email!,
                        name: session.user.user_metadata?.full_name || session.user.email!,
                        plan: 'lite',
                        credits: 10
                    });
                }
            }
            setLoading(false);

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                if (session?.user) {
                    const profile = await fetchProfile(session.user);
                    if (profile) setUser(profile);
                } else {
                    setUser(null);
                }
                setLoading(false);
            });

            return () => subscription.unsubscribe();
        };

        initializeAuth();
    }, []);

    const signIn = async (email: string) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error("Error signing in:", error);
            alert("Error login: " + error.message);
        } else {
            alert("Check your email for the login link!");
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

