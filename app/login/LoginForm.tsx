'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { login, type LoginActionState } from './actions';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState<LoginActionState | null, FormData>(
    login,
    null
  );

  // Preserve form values on error - use defaultValue for uncontrolled inputs
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F7FA] via-white to-[#E8F5F2] p-4">
      <Card className="w-full max-w-md shadow-xl border-[#18C3A8]/20">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="FeedAdmin Logo" 
              className="h-14 w-auto"
            />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#223E97] to-[#18C3A8] bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-[#1A1F36]/60 text-base">
            Sign in to your account
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                defaultValue={formData.email}
                onChange={handleChange}
                disabled={isPending}
                className={state?.fieldErrors?.email ? 'border-red-500' : ''}
                required
              />
              {state?.fieldErrors?.email && (
                <p className="text-sm text-red-500">{state.fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  defaultValue={formData.password}
                  onChange={handleChange}
                  disabled={isPending}
                  className={state?.fieldErrors?.password ? 'border-red-500' : ''}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isPending}
                  tabIndex={0}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {state?.fieldErrors?.password && (
                <p className="text-sm text-red-500">{state.fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="rounded border-gray-300 text-[#223E97] focus:ring-[#223E97]"
                  disabled={isPending}
                />
                <Label htmlFor="remember" className="font-normal cursor-pointer text-[#1A1F36]/70">
                  Remember me
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-[#18C3A8] hover:text-[#3EB489] font-medium transition-colors"
              >
                Forgot password?
              </Link>
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="text-center text-sm text-[#1A1F36]/60">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-[#223E97] hover:text-[#18C3A8] font-semibold transition-colors"
              >
                Register your school
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

