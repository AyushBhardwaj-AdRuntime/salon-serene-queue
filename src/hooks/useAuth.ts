import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load admin flag whenever user changes
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setIsAdmin(false);
      setRolesLoaded(true);
      return;
    }
    setRolesLoaded(false);
    supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (cancelled) return;
        setIsAdmin(Array.isArray(data) && data.some((r: any) => r.role === "admin"));
        setRolesLoaded(true);
      });
    return () => { cancelled = true; };
  }, [user]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast({ title: "Account created", description: "You can now sign in." });
      return { success: true };
    } catch (error: any) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return { success: false, error: error.message };
    }
  }, [toast]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Welcome back!", description: "Signed in successfully." });
      return { success: true };
    } catch (error: any) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return { success: false, error: error.message };
    }
  }, [toast]);

  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectTo ?? window.location.origin + "/dashboard",
      });
      if (result.error) throw result.error;
      return { success: true };
    } catch (error: any) {
      toast({ title: "Google sign-in failed", description: error.message ?? String(error), variant: "destructive" });
      return { success: false };
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({ title: "Signed out" });
    } catch (error: any) {
      toast({ title: "Sign out failed", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    rolesLoaded,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };
}
