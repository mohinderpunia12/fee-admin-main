"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { FormModal, FormField } from "@/components/form-modal";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Phone,
  Calendar,
  DollarSign,
  Users,
  GraduationCap,
  Receipt,
  Wallet,
  ClipboardList,
  Pencil,
  Play,
  StopCircle,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import * as schoolsApi from "@/lib/api/schools";
import { School } from "@/types";

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const schoolId = parseInt(params.id as string);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Fetch school details
  const { data: school, isLoading, error } = useQuery({
    queryKey: ["school", schoolId],
    queryFn: () => schoolsApi.getSchool(schoolId),
    enabled: !!schoolId,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { name: string; mobile: string }) =>
      schoolsApi.updateSchool(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School updated successfully!");
      setIsEditModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update school");
    },
  });

  // Start subscription mutation
  const startSubscriptionMutation = useMutation({
    mutationFn: (data: { duration_months: number; payment_amount?: string }) =>
      schoolsApi.startSubscription(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("Subscription started successfully!");
      setIsSubscriptionModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to start subscription");
    },
  });

  // End subscription mutation
  const endSubscriptionMutation = useMutation({
    mutationFn: () => schoolsApi.endSubscription(schoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("Subscription ended successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to end subscription");
    },
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: (data: { payment_amount: string; last_payment_date: string }) =>
      schoolsApi.patchSchool(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("Payment recorded successfully!");
      setIsPaymentModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to record payment");
    },
  });

  const handleEdit = (data: any) => {
    updateMutation.mutate(data);
  };

  const handleStartSubscription = (data: any) => {
    startSubscriptionMutation.mutate({
      duration_months: parseInt(data.duration_months),
      payment_amount: data.payment_amount,
    });
  };

  const handleEndSubscription = () => {
    if (confirm("Are you sure you want to end this school's subscription?")) {
      endSubscriptionMutation.mutate();
    }
  };

  const handleRecordPayment = (data: any) => {
    recordPaymentMutation.mutate(data);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Form fields
  const editFormFields: FormField[] = [
    {
      name: "name",
      label: "School Name",
      type: "text",
      required: true,
      placeholder: "Enter school name",
    },
    {
      name: "mobile",
      label: "Mobile Number",
      type: "text",
      required: true,
      placeholder: "Enter mobile number",
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      required: false,
      placeholder: "Enter email address",
    },
    {
      name: "address",
      label: "Address",
      type: "textarea",
      required: false,
      placeholder: "Enter school address",
    },
    {
      name: "logo",
      label: "School Logo",
      type: "file",
      required: false,
      accept: "image/*",
    },
  ];

  const subscriptionFormFields: FormField[] = [
    {
      name: "duration_months",
      label: "Duration (Months)",
      type: "number",
      required: true,
      placeholder: "e.g., 12",
    },
    {
      name: "payment_amount",
      label: "Payment Amount",
      type: "number",
      required: false,
      placeholder: "e.g., 50000",
    },
  ];

  const paymentFormFields: FormField[] = [
    {
      name: "payment_amount",
      label: "Payment Amount",
      type: "number",
      required: true,
      placeholder: "e.g., 50000",
    },
    {
      name: "last_payment_date",
      label: "Payment Date",
      type: "date",
      required: true,
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  if (error || !school) {
    return (
      <DashboardLayout>
        <EmptyState
          title="School not found"
          description="The school you're looking for doesn't exist."
        />
      </DashboardLayout>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(school.subscription_end);
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/superuser/schools")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Schools
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{school.name}</h1>
              <p className="text-muted-foreground">School ID: #{school.id}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsEditModalOpen(true)} variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Edit Details
            </Button>
            {school.active ? (
              <Button
                onClick={handleEndSubscription}
                variant="destructive"
                disabled={endSubscriptionMutation.isPending}
              >
                <StopCircle className="mr-2 h-4 w-4" />
                End Subscription
              </Button>
            ) : (
              <Button
                onClick={() => setIsSubscriptionModalOpen(true)}
                style={{ background: "linear-gradient(to right, #223E97, #18C3A8)" }}
                className="text-white"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Subscription
              </Button>
            )}
            <Button onClick={() => setIsPaymentModalOpen(true)} variant="outline">
              <DollarSign className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Status Alert */}
        {isExpired && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Subscription Expired</p>
                <p className="text-sm text-red-700">
                  This school's subscription expired {Math.abs(daysUntilExpiry)} days ago.
                </p>
              </div>
            </div>
          </div>
        )}

        {isExpiringSoon && !isExpired && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-900">Subscription Expiring Soon</p>
                <p className="text-sm text-yellow-700">
                  This school's subscription will expire in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* School Status Card */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {school.logo_url ? (
                <img
                  src={school.logo_url}
                  alt={`${school.name} logo`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ background: "linear-gradient(to bottom right, #223E97, #18C3A8)" }}
                >
                  <Building2 className="w-8 h-8" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{school.name}</h2>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {school.mobile}
                </p>
                {school.email && (
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    {school.email}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                status={school.active ? "active" : "inactive"}
                type="enrollment"
              />
              {school.is_subscription_active && (
                <StatusBadge status="active" type="payment" />
              )}
            </div>
          </div>
        </div>

        {/* School Contact Information */}
        {(school.email || school.address) && (
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {school.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base font-medium">{school.email}</p>
                </div>
              )}
              {school.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-base font-medium">{school.address}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subscription Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" style={{ color: "#223E97" }} />
              Subscription Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div className="mt-1">
                  <StatusBadge
                    status={school.active ? "active" : "inactive"}
                    type="enrollment"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Start Date
                </label>
                <p className="text-base font-medium">
                  {formatDate(school.subscription_start)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  End Date
                </label>
                <p className="text-base font-medium">
                  {formatDate(school.subscription_end)}
                </p>
              </div>
              {daysUntilExpiry !== null && daysUntilExpiry >= 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Days Remaining
                  </label>
                  <p className="text-base font-medium" style={{ color: isExpiringSoon ? "#ef4444" : "#3EB489" }}>
                    {daysUntilExpiry} days
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" style={{ color: "#18C3A8" }} />
              Payment Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Last Payment Amount
                </label>
                <p className="text-base font-medium">
                  {school.payment_amount
                    ? `₹${parseFloat(school.payment_amount).toLocaleString("en-IN")}`
                    : "No payment recorded"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Last Payment Date
                </label>
                <p className="text-base font-medium">
                  {formatDate(school.last_payment_date)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div>
          <h3 className="text-lg font-semibold mb-4">School Management</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Students */}
            <Link href={`/dashboard/superuser/schools/${schoolId}/students`}>
              <div className="rounded-lg border bg-card p-6 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(34, 62, 151, 0.1)" }}
                  >
                    <Users className="w-6 h-6" style={{ color: "#223E97" }} />
                  </div>
                  <div>
                    <h4 className="font-semibold">Students</h4>
                    <p className="text-sm text-muted-foreground">Manage students</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Staff */}
            <Link href={`/dashboard/superuser/schools/${schoolId}/staff`}>
              <div className="rounded-lg border bg-card p-6 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(24, 195, 168, 0.1)" }}
                  >
                    <UserCog className="w-6 h-6" style={{ color: "#18C3A8" }} />
                  </div>
                  <div>
                    <h4 className="font-semibold">Staff</h4>
                    <p className="text-sm text-muted-foreground">Manage staff</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Classes */}
            <Link href={`/dashboard/superuser/schools/${schoolId}/classes`}>
              <div className="rounded-lg border bg-card p-6 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(62, 180, 137, 0.1)" }}
                  >
                    <GraduationCap className="w-6 h-6" style={{ color: "#3EB489" }} />
                  </div>
                  <div>
                    <h4 className="font-semibold">Classes</h4>
                    <p className="text-sm text-muted-foreground">Manage classes</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Fee Records */}
            <Link href={`/dashboard/superuser/schools/${schoolId}/fees`}>
              <div className="rounded-lg border bg-card p-6 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(34, 62, 151, 0.1)" }}
                  >
                    <Receipt className="w-6 h-6" style={{ color: "#223E97" }} />
                  </div>
                  <div>
                    <h4 className="font-semibold">Fee Records</h4>
                    <p className="text-sm text-muted-foreground">View fee records</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Salary Records */}
            <Link href={`/dashboard/superuser/schools/${schoolId}/salary`}>
              <div className="rounded-lg border bg-card p-6 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(24, 195, 168, 0.1)" }}
                  >
                    <Wallet className="w-6 h-6" style={{ color: "#18C3A8" }} />
                  </div>
                  <div>
                    <h4 className="font-semibold">Salary Records</h4>
                    <p className="text-sm text-muted-foreground">View salary records</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Attendance */}
            <Link href={`/dashboard/superuser/schools/${schoolId}/attendance`}>
              <div className="rounded-lg border bg-card p-6 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(62, 180, 137, 0.1)" }}
                  >
                    <ClipboardList className="w-6 h-6" style={{ color: "#3EB489" }} />
                  </div>
                  <div>
                    <h4 className="font-semibold">Attendance</h4>
                    <p className="text-sm text-muted-foreground">View attendance</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Activity Log */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: "#3EB489" }} />
            Activity Log
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm font-medium">{formatDate(school.created_at)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm font-medium">{school.updated_at ? formatDate(school.updated_at) : formatDate(school.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEdit}
        title="Edit School"
        description="Update school information"
        fields={editFormFields}
        initialData={school}
      />

      {/* Start Subscription Modal */}
      <FormModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSubmit={handleStartSubscription}
        title="Start Subscription"
        description="Start or renew school subscription"
        fields={subscriptionFormFields}
      />

      {/* Record Payment Modal */}
      <FormModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handleRecordPayment}
        title="Record Payment"
        description="Record a new payment for this school"
        fields={paymentFormFields}
      />
    </DashboardLayout>
  );
}
