"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getSuperuserDashboard } from "@/lib/api/dashboard";
import { getSystemSettings } from "@/lib/api/settings";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, Users, UserCheck, TrendingUp, Settings, DollarSign } from "lucide-react";
import Link from "next/link";

// #region agent log HYPOTHESES: H4 data fetch stuck, H5 settings fetch stuck
const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/1a03ea7a-b0aa-4121-ba33-1e913d00c400';
const DEBUG_SESSION = 'debug-session';
// #endregion

export default function SuperuserDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["superuser-dashboard"],
    queryFn: getSuperuserDashboard,
    enabled: true,
  });

  // Fetch system settings
  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: getSystemSettings,
    enabled: true,
  });

  if (authLoading || isLoading || !dashboard) {
    // #region agent log
    fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION,
        runId: 'superuser-loading',
        hypothesisId: 'H4-H5',
        location: 'app/dashboard/superuser/page.tsx:46',
        message: 'loading state',
        data: {
          authLoading,
          dashboardLoading: isLoading,
          hasDashboard: !!dashboard,
          settingsLoading: settings === undefined,
          hasSettings: !!settings,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  const stats = dashboard.statistics;

  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION,
      runId: 'superuser-data',
      hypothesisId: 'H4-H5',
      location: 'app/dashboard/superuser/page.tsx:72',
      message: 'dashboard data ready',
      data: {
        hasDashboard: !!dashboard,
        hasSettings: !!settings,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Superuser Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            System-wide overview and statistics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Schools
              </CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_schools}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.active_schools} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Schools
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_schools}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.inactive_schools} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.total_revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From all schools
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Subscription Expired
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expired_schools}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Past expiration date
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status Details */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Manually Deactivated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.inactive_schools}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Schools marked inactive by superuser
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.expiring_soon}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Subscriptions ending within 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Subscription Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.expired_schools}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Subscriptions past end date (need renewal)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Current Subscription Amount</p>
                <p className="text-2xl font-bold">
                  ₹{settings ? Number(settings.monthly_subscription_amount).toFixed(2) : '299.00'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Trial Period</p>
                <p className="text-2xl font-bold">
                  {settings ? settings.trial_period_days : 7} days
                </p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Manage subscription pricing, payment QR codes, tutorial videos, and contact information from the settings page.
              </p>
              <Link href="/dashboard/superuser/settings">
                <Button className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage System Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
