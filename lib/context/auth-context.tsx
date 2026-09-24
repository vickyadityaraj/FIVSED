'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '@/types/fivsed';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email?: string, password?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isDemoMode = !isSupabaseConfigured;

  useEffect(() => {
    // 1. Immediately restore saved terminal session from localStorage
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('fivsed_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
        } catch (e) {
          console.error('Failed to parse saved user', e);
        }
      }
    }

    const client = supabase;
    if (isSupabaseConfigured && client) {
      // 2. Check active Supabase JWT session if available
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          client
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data) {
                const supaUser: UserProfile = {
                  id: data.id,
                  email: data.email,
                  full_name: data.full_name,
                  role: data.role as UserRole,
                  created_at: data.created_at,
                };
                setUser(supaUser);
                localStorage.setItem('fivsed_user', JSON.stringify(supaUser));
              }
            });
        }
        setIsLoading(false);
      }).catch((err) => {
        console.error('Session retrieval error:', err);
        setIsLoading(false);
      });

      // 3. Only sign out user if an explicit SIGNED_OUT event is triggered
      const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('fivsed_user');
        } else if (session?.user) {
          client
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data) {
                const supaUser: UserProfile = {
                  id: data.id,
                  email: data.email,
                  full_name: data.full_name,
                  role: data.role as UserRole,
                  created_at: data.created_at,
                };
                setUser(supaUser);
                localStorage.setItem('fivsed_user', JSON.stringify(supaUser));
              }
            });
        }
      });

      return () => {
        authListener?.subscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  const login = async (email?: string, password?: string, role?: UserRole) => {
    const trimmedEmail = email?.trim().toLowerCase();

    // 1. Authoritative Console Administrator Credentials
    if (
      (trimmedEmail === 'admin@fivsed.com' || trimmedEmail === 'admin@fivsed.local') &&
      password === 'Admin@12345'
    ) {
      const adminUser: UserProfile = {
        id: 'usr-admin-primary',
        email: 'admin@fivsed.com',
        full_name: 'Aditya Raj (Administrator)',
        role: 'admin',
        created_at: new Date().toISOString()
      };
      setUser(adminUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fivsed_user', JSON.stringify(adminUser));
      }
      return { success: true };
    }

    // 2. Authoritative SOC Operator Credentials
    if (
      (trimmedEmail === 'operator@fivsed.com' || trimmedEmail === 'operator@fivsed.local') &&
      password === 'Operator@12345'
    ) {
      const opUser: UserProfile = {
        id: 'usr-operator-primary',
        email: 'operator@fivsed.com',
        full_name: 'Security Operations Officer',
        role: 'security_operator',
        created_at: new Date().toISOString()
      };
      setUser(opUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fivsed_user', JSON.stringify(opUser));
      }
      return { success: true };
    }

    // 3. Supabase Auth for other registered users
    if (isSupabaseConfigured && supabase) {
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Authentication failed' };
      }
    }

    // Dynamic console fallback
    const targetRole = role || 'security_operator';
    const dynamicUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: email || 'operator@fivsed.com',
      full_name: email ? email.split('@')[0].toUpperCase() : 'Security Operator',
      role: targetRole,
      created_at: new Date().toISOString()
    };
    setUser(dynamicUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fivsed_user', JSON.stringify(dynamicUser));
    }
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fivsed_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
