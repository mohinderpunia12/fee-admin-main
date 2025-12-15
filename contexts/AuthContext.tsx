'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginRequest } from '@/types';
import * as authApi from '@/lib/api/auth';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean; // Alias for loading
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperuser: boolean;
  isSchoolAdmin: boolean;
  isStaff: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
  initialUser?: User | null;
};

export const AuthProvider = ({ children, initialUser = null }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const router = useRouter();

  // Ensure user is set from initialUser immediately and sync if initialUser changes
  useEffect(() => {
    if (initialUser) {
      if (!user || user.id !== initialUser.id) {
        setUser(initialUser);
        setLoading(false);
      }
    }
  }, [initialUser]);

  // Check if user is logged in on mount and listen for auth changes
  useEffect(() => {
    const initAuth = async () => {
      const supabase = createClient();
      try {
        if (initialUser) {
          setUser(initialUser);
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          try {
            const userData = await authApi.getUserProfile();
            setUser(userData);
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          try {
            const userData = await authApi.getUserProfile();
            setUser(userData);
          } catch (error) {
            console.error('Failed to fetch user profile on auth change:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authApi.login(credentials);
      
      // Validate response structure
      if (!response) {
        throw new Error('No response received from server');
      }
      
      if (!response.user) {
        console.error('Missing user in response:', response);
        throw new Error('Invalid response format: user object is missing');
      }

      setUser(response.user);

      // Wait for session to be properly set in cookies before redirecting
      // This is critical - middleware needs to see the session
      let sessionSet = false;
      const supabaseClient = createClient();
      for (let i = 0; i < 20; i++) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.access_token) {
          sessionSet = true;
          console.log('Session confirmed, ready to redirect');
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      if (!sessionSet) {
        console.warn('Session not confirmed after login, but proceeding with redirect');
      }

      // Redirect based on role
      const userRole = response.user?.role;
      if (!userRole) {
        console.error('User role is missing:', response.user);
        throw new Error('User role is missing from response');
      }
      
      let redirectPath = '/dashboard';
      switch (userRole) {
        case 'superuser':
          redirectPath = '/dashboard/superuser';
          break;
        case 'school_admin':
          redirectPath = '/dashboard/school-admin';
          break;
        case 'staff':
          redirectPath = '/dashboard/staff';
          break;
        case 'student':
          redirectPath = '/dashboard/student';
          break;
        default:
          redirectPath = '/dashboard';
      }
      
      // Use window.location.replace to avoid adding to history and ensure redirect
      console.log('Redirecting to:', redirectPath);
      // Use replace instead of href to avoid back button issues
      window.location.replace(redirectPath);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state and redirect even if logout fails
      setUser(null);
      router.push('/login');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isLoading: loading, // Alias
    login,
    logout,
    isAuthenticated: !!user,
    isSuperuser: user?.role === 'superuser',
    isSchoolAdmin: user?.role === 'school_admin',
    isStaff: user?.role === 'staff',
    isStudent: user?.role === 'student',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
