"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getSchoolAdminDashboard } from "@/lib/api/dashboard";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner";
import { SubscriptionExpiredModal } from "@/components/ui/subscription-expired-modal";
import { PaymentModal } from "@/components/payment-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, UserCheck, Receipt, Wallet, School, CalendarCheck, AlertTriangle } from "lucide-react";

export default function SchoolAdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: dashboard, isLoading, error: dashboardError } = useQuery({
    queryKey: ["school-admin-dashboard"],
    queryFn: getSchoolAdminDashboard,
    enabled: !authLoading && !!user && user.role === "school_admin",
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== "school_admin") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  // Check subscription status and show payment modal
  useEffect(() => {
    if (dashboard?.school && user?.subscription_status) {
      const { days_remaining, needs_payment, active } = user.subscription_status;
      
      // Show payment modal if subscription needs payment (7 days or less)
      if (needs_payment && active && days_remaining >= 0) {
        setShowPaymentModal(true);
      }
    }
  }, [dashboard, user]);

  if (authLoading || isLoading || !dashboard) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  const stats = dashboard.statistics;
  const isSubscriptionExpired = !dashboard.school?.subscription_active;
  const daysRemaining = user?.subscription_status?.days_remaining || 0;

  return (
    <DashboardLayout>
      {/* Show blocking modal if subscription expired */}
      {isSubscriptionExpired && (
        <SubscriptionExpiredModal
          schoolName={dashboard.school?.name}
          subscriptionEnd={dashboard.school?.subscription_end}
        />
      )}

      {/* Show payment reminder modal for expiring subscriptions */}
      {!isSubscriptionExpired && showPaymentModal && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          daysRemaining={daysRemaining}
          isTrial={false}
        />
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">School Dashboard</h1>
          {dashboard.school?.name && (
            <p className="text-muted-foreground mt-2">{dashboard.school.name}</p>
          )}
        </div>

        {/* Subscription Warning Alert */}
        {!isSubscriptionExpired && user?.subscription_status?.needs_payment && daysRemaining >= 0 && (
          <Alert variant={daysRemaining <= 3 ? "destructive" : "default"} className="border-2">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">
              {daysRemaining <= 3 ? "Urgent: Subscription Expiring Soon!" : "Subscription Payment Reminder"}
            </AlertTitle>
            <AlertDescription className="mt-2">
              Your subscription will expire in <span className="font-bold">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span>.
              Please make a payment of <span className="font-bold">₹299</span> to continue using our services without interruption.
              <div className="mt-3">
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="text-sm font-semibold underline hover:no-underline"
                >
                  Click here to make payment
                </button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ClassRooms</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.classrooms.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total classrooms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.students.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.students.active} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.staff.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.staff.active} active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Fees</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.fees_current_month.unpaid_count || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ₹{stats.fees_current_month.pending.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Fees</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.fees_current_month.paid_count || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ₹{stats.fees_current_month.paid.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Salaries</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.salary_current_month.pending_count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Salaries</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.salary_current_month.paid_count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-medium">Attendance Today</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.attendance_today.present} / {stats.attendance_today.total_staff} staff present
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
