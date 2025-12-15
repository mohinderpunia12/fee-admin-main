"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getStaffDashboard } from "@/lib/api/dashboard";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageLoader } from "@/components/ui/loading-spinner";
import { SubscriptionExpiredModal } from "@/components/ui/subscription-expired-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, CalendarCheck, TrendingUp } from "lucide-react";

export default function StaffDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["staff-dashboard"],
    queryFn: getStaffDashboard,
    enabled: !authLoading && !!user && user.role === "staff",
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== "staff") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoading || !dashboard) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  const isSubscriptionExpired = !dashboard.school?.subscription_active;

  return (
    <DashboardLayout>
      {/* Show blocking modal if subscription expired */}
      {isSubscriptionExpired && (
        <SubscriptionExpiredModal
          schoolName={dashboard.school?.name}
          subscriptionEnd={dashboard.school?.subscription_end}
        />
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          {dashboard.staff?.name && (
            <p className="text-muted-foreground mt-2">Welcome, {dashboard.staff.name}</p>
          )}
        </div>

        {/* Salary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Salary
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{parseFloat(dashboard.staff?.monthly_salary || "0").toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Base salary</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unpaid Salary
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.unpaid_salary_records}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Records pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Paid Salary
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.paid_salary_records}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Total Records</span>
                <span className="text-2xl font-bold mt-1">
                  {dashboard.total_attendance_records}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Salary Records</span>
                <span className="text-2xl font-bold mt-1">
                  {dashboard.total_salary_records}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
