'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginRequest } from '@/types';
import * as authApi from '@/lib/api/auth';
import { createClient } from '@/lib/supabase/client';
import { debugLog } from '@/lib/debug-log';

// #region agent log HYPOTHESES: H9 auth context not hydrating, H10 session missing in client
const DEBUG_SESSION = 'debug-session';
// #endregion

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

  // Check if user is logged in on mount and listen for auth changes
  useEffect(() => {
    const initAuth = async () => {
      const supabase = createClient();
      try {
        if (initialUser) {
          setUser(initialUser);
          setLoading(false);

          debugLog({
            sessionId: DEBUG_SESSION,
            runId: 'auth-init',
            hypothesisId: 'H9-H10',
            location: 'contexts/AuthContext.tsx:38',
            message: 'using initialUser',
            data: { hasInitialUser: true, role: initialUser.role },
            timestamp: Date.now(),
          });
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();

        // #region agent log
        debugLog({
          sessionId: DEBUG_SESSION,
          runId: 'auth-init',
          hypothesisId: 'H9-H10',
          location: 'contexts/AuthContext.tsx:38',
          message: 'getSession result',
          data: { hasSession: !!session, userId: session?.user?.id },
          timestamp: Date.now(),
        });
        // #endregion
        
        if (session) {
          try {
            const userData = await authApi.getUserProfile();
            setUser(userData);

            // #region agent log
            debugLog({
              sessionId: DEBUG_SESSION,
              runId: 'auth-init-profile',
              hypothesisId: 'H9-H10',
              location: 'contexts/AuthContext.tsx:52',
              message: 'profile loaded',
              data: { hasUser: !!userData, role: userData.role },
              timestamp: Date.now(),
            });
            // #endregion
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            setUser(null);

            // #region agent log
            debugLog({
              sessionId: DEBUG_SESSION,
              runId: 'auth-init-profile',
              hypothesisId: 'H9-H10',
              location: 'contexts/AuthContext.tsx:60',
              message: 'profile load failed',
              data: { error: error instanceof Error ? error.message : 'unknown' },
              timestamp: Date.now(),
            });
            // #endregion
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
        // #region agent log
        debugLog({
          sessionId: DEBUG_SESSION,
          runId: 'auth-change',
          hypothesisId: 'H9-H10',
          location: 'contexts/AuthContext.tsx:78',
          message: 'auth change',
          data: { event, hasSession: !!session, userId: session?.user?.id },
          timestamp: Date.now(),
        });
        // #endregion

        if (session) {
          try {
            const userData = await authApi.getUserProfile();
            setUser(userData);

            // #region agent log
            debugLog({
              sessionId: DEBUG_SESSION,
              runId: 'auth-change-profile',
              hypothesisId: 'H9-H10',
              location: 'contexts/AuthContext.tsx:88',
              message: 'profile loaded on change',
              data: { hasUser: !!userData, role: userData.role },
              timestamp: Date.now(),
            });
            // #endregion
          } catch (error) {
            console.error('Failed to fetch user profile on auth change:', error);
            setUser(null);

            // #region agent log
            debugLog({
              sessionId: DEBUG_SESSION,
              runId: 'auth-change-profile',
              hypothesisId: 'H9-H10',
              location: 'contexts/AuthContext.tsx:96',
              message: 'profile load failed on change',
              data: { error: error instanceof Error ? error.message : 'unknown' },
              timestamp: Date.now(),
            });
            // #endregion
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
