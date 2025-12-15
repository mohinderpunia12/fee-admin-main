import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import QueryProvider from "@/contexts/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/ui/footer";
import { createClient } from "@/lib/supabase/server";
import { User } from "@/types";
//redeploy
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Multi-School Management System",
  description: "Comprehensive school management system with role-based access control",
};

async function getInitialUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        username,
        role,
        school_id,
        linked_staff_id,
        linked_student_id,
        linked_guard_id,
        created_at,
        schools:school_id (
          id,
          name,
          email,
          mobile,
          logo,
          active,
          subscription_start,
          subscription_end,
          payment_amount
        )
      `
      )
      .eq("id", authUser.id)
      .single();

    if (error || !data) return null;

    const school = data.schools as any;
    const schoolLogo = school?.logo
      ? supabase.storage.from("school-logos").getPublicUrl(school.logo).data
          .publicUrl
      : undefined;

    const initialUser: User = {
      id: data.id,
      username: data.username,
      school: school?.id ?? null,
      school_name: school?.name ?? undefined,
      school_email: school?.email ?? undefined,
      school_mobile: school?.mobile ?? undefined,
      school_logo_url: schoolLogo,
      role: data.role,
      linked_staff: data.linked_staff_id,
      linked_student: data.linked_student_id,
      linked_guard: data.linked_guard_id,
      created_at: data.created_at,
      subscription_status: school
        ? {
            active:
              !!school.active &&
              (!!school.subscription_end
                ? new Date(school.subscription_end) > new Date()
                : false),
            subscription_start: school.subscription_start ?? null,
            subscription_end: school.subscription_end ?? null,
            days_remaining: school.subscription_end
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(school.subscription_end).getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : 0,
            needs_payment:
              !school.active ||
              (school.subscription_end
                ? new Date(school.subscription_end) <= new Date()
                : false),
            subscription_amount: school.payment_amount
              ? parseFloat(school.payment_amount)
              : 0,
          }
        : undefined,
    };

    return initialUser;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getInitialUser();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <QueryProvider>
          <AuthProvider initialUser={initialUser}>
            <div className="flex-1">
              {children}
            </div>
            <Footer />
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
