"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
    id: string;
    email: string;
    name: string;
    plan: "lite" | "pro" | "enterprise";
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: false,
    signIn: async () => { },
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check local storage for session
        const storedUser = localStorage.getItem("sku_mock_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const signIn = async (email: string) => {
        setLoading(true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockUser: User = {
            id: "mock-user-123",
            email: email,
            name: "Usuario Demo",
            plan: "pro", // Default to Pro for demo
        };

        setUser(mockUser);
        localStorage.setItem("sku_mock_user", JSON.stringify(mockUser));
        setLoading(false);
        router.push("/dashboard");
    };

    const signOut = async () => {
        setUser(null);
        localStorage.removeItem("sku_mock_user");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
