"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { AppRole } from "@/lib/auth";
import { apiGet } from "@/lib/api-client";

export type AppSessionUser = {
  authId: string;
  id: string;
  email: string;
  name: string;
  role: AppRole;
};

type AuthContextValue = {
  supabaseUser: User | null;
  user: AppSessionUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchAppUser() {
  try {
    return await apiGet<AppSessionUser | null>("/api/auth/me");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getBrowserSupabaseClient();
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AppSessionUser | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    const refreshUser = async () => {
      const { data } = await supabase.auth.getUser();
      const appUser = await fetchAppUser();

      if (!active) {
        return;
      }

      setSupabaseUser(data.user ?? null);
      setUser(appUser);
      setLoading(false);
    };

    void refreshUser();

    const { data } = supabase.auth.onAuthStateChange(() => {
      void refreshUser();
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = {
    supabaseUser,
    user,
    loading,
    refreshUser: async () => {
      if (!supabase) {
        return;
      }

      const { data } = await supabase.auth.getUser();
      setSupabaseUser(data.user ?? null);
      setUser(await fetchAppUser());
    },
    signOut: async () => {
      if (!supabase) {
        return;
      }

      await supabase.auth.signOut();
      setSupabaseUser(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}