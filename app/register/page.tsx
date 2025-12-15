'use client';

import { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { registerSchoolAction, type RegisterSchoolActionState } from './actions';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, formAction, isPending] = useActionState<RegisterSchoolActionState | null, FormData>(
    registerSchoolAction,
    null
  );

  // Debug: Log errors to browser console (but ignore redirects)
  useEffect(() => {
    if (state?.error && state.error !== 'NEXT_REDIRECT') {
      console.error('Registration Error:', {
        error: state.error,
        timestamp: new Date().toISOString(),
        state: state
      });
    }
  }, [state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F7FA] via-white to-[#E8F5F2] p-4 py-8">
      <Card className="w-full max-w-md shadow-xl border-[#18C3A8]/20">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="FeedAdmin Logo" 
              className="h-12 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#223E97] to-[#18C3A8] bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription className="text-[#1A1F36]/60">
            Sign up to get started
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                name="mobile"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                disabled={isPending}
                maxLength={10}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  disabled={isPending}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isPending}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  disabled={isPending}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isPending}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#223E97] to-[#223E97]/90 hover:shadow-lg transition-all text-white"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="text-center text-sm text-[#1A1F36]/60">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-[#223E97] hover:text-[#18C3A8] font-semibold transition-colors"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
