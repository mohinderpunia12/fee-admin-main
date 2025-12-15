"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { SubscriptionAlert } from "@/components/ui/subscription-alert";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F7FA' }}>
      <Sidebar />
      
      {/* Main Content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 flex-1">
        <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8 pb-20">
          <SubscriptionAlert />
          {children}
        </div>
      </main>
    </div>
  );
}
