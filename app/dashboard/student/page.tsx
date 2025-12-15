"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getStudentDashboard } from "@/lib/api/dashboard";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageLoader } from "@/components/ui/loading-spinner";
import { SubscriptionExpiredModal } from "@/components/ui/subscription-expired-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, TrendingUp, AlertCircle } from "lucide-react";

export default function StudentDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getStudentDashboard,
    enabled: !!user && user.role === "student",
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== "student") {
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
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          {dashboard.student?.first_name && (
            <p className="text-muted-foreground mt-2">
              Welcome, {dashboard.student.first_name} {dashboard.student.last_name}
            </p>
          )}
        </div>

        {/* Student Info */}
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Admission Number</p>
              <p className="text-lg font-medium">{dashboard.student?.admission_no}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Class</p>
              <p className="text-lg font-medium">
                {dashboard.student?.classroom_name || "Not assigned"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fee Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Fees
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.total_fee_records}</div>
              <p className="text-xs text-muted-foreground mt-1">Fee records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unpaid Fees
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {dashboard.unpaid_fee_records}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ₹{parseFloat(dashboard.total_unpaid_amount || "0").toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Paid Fees
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboard.paid_fee_records}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
