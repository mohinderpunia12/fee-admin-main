"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  School,
  Users,
  User as UserIcon,
  UserCheck,
  Receipt,
  Wallet,
  CalendarCheck,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Settings,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { User } from "@/types";
import { debugLog } from "@/lib/debug-log";

// #region agent log HYPOTHESES: H7 auth context delay, H8 nav render timing
const DEBUG_SESSION = 'debug-session';
// #endregion
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Array<"superuser" | "school_admin" | "staff" | "student" | "guard">;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["superuser", "school_admin", "staff", "student"],
  },
  // Superuser only
  {
    label: "Schools",
    href: "/dashboard/superuser/schools",
    icon: School,
    roles: ["superuser"],
  },
  {
    label: "Settings",
    href: "/dashboard/superuser/settings",
    icon: Settings,
    roles: ["superuser"],
  },
  // School Admin only
  {
    label: "ClassRooms",
    href: "/dashboard/school-admin/classrooms",
    icon: School,
    roles: ["school_admin"],
  },
  {
    label: "Students",
    href: "/dashboard/school-admin/students",
    icon: Users,
    roles: ["school_admin"],
  },
  {
    label: "Staff",
    href: "/dashboard/school-admin/staff",
    icon: UserCheck,
    roles: ["school_admin"],
  },
  {
    label: "Fee Records",
    href: "/dashboard/school-admin/fees",
    icon: Receipt,
    roles: ["school_admin"],
  },
  {
    label: "Salary Records",
    href: "/dashboard/school-admin/salary",
    icon: Wallet,
    roles: ["school_admin"],
  },
  {
    label: "Attendance",
    href: "/dashboard/school-admin/attendance",
    icon: CalendarCheck,
    roles: ["school_admin"],
  },
  {
    label: "Guards",
    href: "/dashboard/school-admin/guards",
    icon: UserCheck,
    roles: ["school_admin"],
  },
  {
    label: "ID Cards",
    href: "/dashboard/school-admin/id-cards",
    icon: CreditCard,
    roles: ["school_admin"],
  },
  {
    label: "Visitors",
    href: "/dashboard/visitors",
    icon: Users,
    roles: ["school_admin", "guard"],
  },
  // Staff only
  {
    label: "My Profile",
    href: "/dashboard/my-profile",
    icon: UserIcon,
    roles: ["staff"],
  },
  {
    label: "My Salary",
    href: "/dashboard/staff/my-salary",
    icon: Wallet,
    roles: ["staff"],
  },
  {
    label: "My Attendance",
    href: "/dashboard/staff/my-attendance",
    icon: CalendarCheck,
    roles: ["staff"],
  },
  // Student only
  {
    label: "My Profile",
    href: "/dashboard/my-profile",
    icon: UserIcon,
    roles: ["student"],
  },
  {
    label: "My Fees",
    href: "/dashboard/student/my-fees",
    icon: Receipt,
    roles: ["student"],
  },
];

type SidebarProps = {
  initialUser?: User | null;
};

export function Sidebar({ initialUser }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const effectiveUser = useMemo(() => {
    return user ?? initialUser ?? (typeof window !== 'undefined' ? (window as any).__fa_hydrated_user : null);
  }, [user, initialUser]);

  const filteredNavItems = useMemo(() => {
    if (!effectiveUser) return [];
    return navItems.filter((item) => item.roles.includes(effectiveUser.role));
  }, [effectiveUser]);

  // Lightweight localStorage hydration to avoid empty sidebar before useAuth settles
  useEffect(() => {
    if (!user && !loading) {
      try {
        const raw = localStorage.getItem('fa_user');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.role) {
            (window as any).__fa_hydrated_user = parsed;
          }
        }
      } catch {
        // ignore
      }
    }
  }, [user, loading]);

  const handleLogout = async () => {
    await logout();
  };

  // #region agent log
  useEffect(() => {
    debugLog({
      sessionId: DEBUG_SESSION,
      runId: 'sidebar-render',
      hypothesisId: 'H7-H8',
      location: 'components/layout/sidebar.tsx',
      message: 'sidebar state',
      data: {
        hasUser: !!effectiveUser,
        loading,
        navCount: filteredNavItems.length,
        pathname,
      },
      timestamp: Date.now(),
    });
  }, [user, loading, filteredNavItems.length, pathname]);
  // #endregion

  if (loading || !effectiveUser) return null;

  const NavContent = () => (
    <>
      {/* School Info Card - Only for users with school */}
      {effectiveUser?.school_name && (
        <div className="px-4 py-6 border-b" style={{ borderColor: 'rgba(226, 232, 240, 0.5)' }}>
          <div 
            className="relative overflow-hidden rounded-xl p-4 shadow-md"
            style={{ 
              background: 'linear-gradient(135deg, rgba(34, 62, 151, 0.08), rgba(24, 195, 168, 0.08))',
              border: '1px solid rgba(62, 180, 137, 0.2)'
            }}
          >
            {/* School Logo and Name */}
            <div className="flex items-start gap-3 mb-3">
              {effectiveUser.school_logo_url ? (
                <div className="flex-shrink-0">
                  <img
                    src={effectiveUser.school_logo_url}
                    alt={`${effectiveUser.school_name} Logo`}
                    className="h-16 w-16 rounded-lg object-cover shadow-md ring-2 ring-white"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div 
                    className="h-16 w-16 rounded-lg flex items-center justify-center shadow-md ring-2 ring-white hidden"
                    style={{ 
                      background: 'linear-gradient(135deg, #223E97, #18C3A8)',
                    }}
                  >
                    <span className="text-white font-bold text-2xl">
                      {effectiveUser?.school_name
                        ? effectiveUser.school_name.charAt(0).toUpperCase()
                        : ""}
                    </span>
                  </div>
                </div>
              ) : (
                <div 
                  className="flex-shrink-0 h-16 w-16 rounded-lg flex items-center justify-center shadow-md ring-2 ring-white"
                  style={{ 
                    background: 'linear-gradient(135deg, #223E97, #18C3A8)',
                  }}
                >
                  <span className="text-white font-bold text-2xl">
                    {effectiveUser?.school_name
                      ? effectiveUser.school_name.charAt(0).toUpperCase()
                      : ""}
                  </span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>
                  School
                </p>
                <p className="text-sm font-bold truncate leading-tight mb-1" style={{ color: '#1A1F36' }}>
                  {effectiveUser.school_name}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-3" />

            {/* User Info - Inside School Card */}
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-md text-sm"
                style={{ background: 'linear-gradient(135deg, #223E97, #18C3A8)' }}
              >
                {effectiveUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#1A1F36' }}>
                  {effectiveUser.username}
                </p>
                <p className="text-xs font-medium capitalize px-2 py-0.5 rounded-full inline-block mt-1" 
                   style={{ 
                     background: 'linear-gradient(to right, rgba(34, 62, 151, 0.15), rgba(24, 195, 168, 0.15))',
                     color: '#223E97'
                   }}>
                  {effectiveUser.role.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Info - Only for superuser (no school) */}
      {!effectiveUser?.school_name && (
        <div className="px-4 py-6 border-b" style={{ borderColor: 'rgba(226, 232, 240, 0.5)' }}>
          <div className="flex items-center gap-3">
            <div 
              className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg text-lg"
              style={{ background: 'linear-gradient(135deg, #223E97, #18C3A8)' }}
            >
              {effectiveUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#1A1F36' }}>
                {effectiveUser.username}
              </p>
              <p className="text-xs font-medium capitalize px-2 py-0.5 rounded-full inline-block mt-1" 
                 style={{ 
                   background: 'linear-gradient(to right, rgba(34, 62, 151, 0.1), rgba(24, 195, 168, 0.1))',
                   color: '#223E97'
                 }}>
                {effectiveUser.role.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={isActive ? {
                background: 'linear-gradient(to right, #223E97, rgba(34, 62, 151, 0.9))',
                color: '#ffffff',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              } : {
                color: '#1A1F36'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(62, 180, 137, 0.1)';
                  e.currentTarget.style.color = '#3EB489';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#1A1F36';
                }
              }}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="px-3 py-4 border-t border-border/50">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div 
        className="lg:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between shadow-sm"
        style={{ 
          backgroundColor: '#ffffff', 
          borderBottom: '1px solid rgba(226, 232, 240, 0.5)' 
        }}
      >
        <div className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="FeedAdmin Logo" 
            className="h-8 w-auto"
            width={32}
            height={32}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="hover:bg-accent/10"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <aside
            className="fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-border/50 flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-border/50">
              <img 
                src="/logo.png" 
                alt="FeedAdmin Logo" 
                className="h-7 w-auto"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:bg-accent/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside 
        className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 flex-col shadow-sm"
        style={{ 
          backgroundColor: '#ffffff', 
          borderRight: '1px solid rgba(226, 232, 240, 0.5)' 
        }}
      >
        <div 
          className="h-16 flex items-center px-6"
          style={{ 
            borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
            background: 'linear-gradient(to right, rgba(34, 62, 151, 0.05), rgba(24, 195, 168, 0.05))'
          }}
        >
          <img 
            src="/logo.png" 
            alt="FeedAdmin Logo" 
            className="h-9 w-auto"
          />
        </div>
        <NavContent />
      </aside>
    </>
  );
}
