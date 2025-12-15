"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable, Column } from "@/components/data-table";
import { FormModal } from "@/components/form-modal";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  Download,
  School as SchoolIcon,
  Calendar,
  DollarSign,
  AlertTriangle,
  Eye,
} from "lucide-react";
import * as schoolsApi from "@/lib/api/schools";
import { School } from "@/types";

export default function SchoolsManagementPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "expiring" | "expired">("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Check authorization - use useEffect to avoid setState during render
  useEffect(() => {
    if (!authLoading && user && user.role !== "superuser") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  // Fetch schools based on filter (must call all hooks before any early returns)
  const { data: schoolsData, isLoading, error: schoolsError } = useQuery({
    queryKey: ["schools", filterStatus, searchTerm, page, pageSize],
    queryFn: async () => {
      const params: any = {
        page,
        page_size: pageSize,
        search: searchTerm || undefined,
      };

      switch (filterStatus) {
        case "active":
          return schoolsApi.listSchools({ ...params, active: true });
        case "inactive":
          return schoolsApi.listInactiveSchools(params);
        case "expiring":
          return schoolsApi.listExpiringSoonSchools(params);
        case "expired":
          return schoolsApi.listExpiredSchools(params);
        default:
          return schoolsApi.listSchools(params);
      }
    },
    enabled: !authLoading && !!user && user.role === "superuser",
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: schoolsApi.createSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School created successfully!");
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to create school");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      schoolsApi.updateSchool(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School updated successfully!");
      setIsEditModalOpen(false);
      setSelectedSchool(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update school");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: schoolsApi.deleteSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedSchool(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete school");
    },
  });

  const startSubscriptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      schoolsApi.startSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("Subscription activated successfully!");
      setIsSubscriptionModalOpen(false);
      setSelectedSchool(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to activate subscription");
    },
  });

  const endSubscriptionMutation = useMutation({
    mutationFn: schoolsApi.endSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("Subscription ended successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to end subscription");
    },
  });

  // Show loader while checking auth or fetching data
  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  // Don't render if not authorized
  if (user?.role !== "superuser") {
    return null;
  }

  // Table columns
  const columns: Column<School>[] = [
    {
      key: "name",
      label: "School Name",
      render: (school) => (
        <div className="flex items-center gap-3">
          {school.logo_url ? (
            <img
              src={school.logo_url}
              alt={`${school.name} logo`}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "linear-gradient(to bottom right, #223E97, #18C3A8)" }}
            >
              {(school.name || school.email || 'S').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <span className="font-medium">{school.name || 'Unnamed School'}</span>
            {school.email && (
              <p className="text-xs text-muted-foreground">{school.email}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "mobile",
      label: "Contact",
      render: (school) => school.mobile,
    },
    {
      key: "active",
      label: "Status",
      render: (school) => (
        <StatusBadge
          status={school.active ? "active" : "inactive"}
          type="subscription"
        />
      ),
    },
    {
      key: "subscription_end",
      label: "Subscription End",
      render: (school) => {
        if (!school.subscription_end) return <span className="text-muted-foreground">Not set</span>;
        const endDate = new Date(school.subscription_end);
        const today = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{endDate.toLocaleDateString()}</span>
            {daysLeft > 0 && daysLeft <= 7 && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{daysLeft}d left</span>
            )}
            {daysLeft < 0 && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Expired</span>
            )}
          </div>
        );
      },
    },
    {
      key: "payment_amount",
      label: "Last Payment",
      render: (school) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>₹{school.payment_amount ? school.payment_amount.toLocaleString() : "0"}</span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (school) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/dashboard/superuser/schools/${school.id}`)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      ),
    },
  ];

  const handleCreate = (data: any) => {
    createMutation.mutate(data);
  };

  const handleEdit = (data: any) => {
    if (selectedSchool) {
      updateMutation.mutate({ id: selectedSchool.id, data });
    }
  };

  const handleDelete = () => {
    if (selectedSchool) {
      deleteMutation.mutate(selectedSchool.id);
    }
  };

  const handleStartSubscription = (data: any) => {
    if (selectedSchool) {
      startSubscriptionMutation.mutate({ id: selectedSchool.id, data });
    }
  };

  const handleEndSubscription = (school: School) => {
    if (confirm(`Are you sure you want to end subscription for ${school.name}?`)) {
      endSubscriptionMutation.mutate(school.id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Schools Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage schools and their subscriptions
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add School
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Schools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolsData?.count || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {schoolsData?.results.filter((s: School) => s.active).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {schoolsData?.results.filter((s: School) => {
                  if (!s.subscription_end) return false;
                  const daysLeft = Math.ceil((new Date(s.subscription_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return daysLeft > 0 && daysLeft <= 7;
                }).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {schoolsData?.results.filter((s: School) => {
                  if (!s.subscription_end) return false;
                  return new Date(s.subscription_end) < new Date();
                }).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={schoolsData?.results || []}
          isLoading={isLoading}
          pagination={{
            currentPage: page,
            totalPages: Math.ceil((schoolsData?.count || 0) / pageSize),
            pageSize,
            totalItems: schoolsData?.count || 0,
            onPageChange: setPage,
          }}
          actions={(school: School) => (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSchool(school);
                  setIsSubscriptionModalOpen(true);
                }}
              >
                Subscription
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSchool(school);
                  setIsEditModalOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSchool(school);
                  setIsDeleteDialogOpen(true);
                }}
              >
                Delete
              </Button>
              {school.active && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleEndSubscription(school)}
                >
                  End
                </Button>
              )}
            </div>
          )}
        />

        {/* Create Modal */}
        <FormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreate}
          title="Add New School"
          fields={[
            {
              name: "name",
              label: "School Name",
              type: "text",
              required: true,
              placeholder: "Enter school name",
            },
            {
              name: "mobile",
              label: "Contact Number",
              type: "tel",
              required: true,
              placeholder: "10-digit mobile number",
            },
          ]}
        />

        {/* Edit Modal */}
        {selectedSchool && (
          <FormModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedSchool(null);
            }}
            onSubmit={handleEdit}
            title="Edit School"
            initialData={{
              name: selectedSchool.name,
              mobile: selectedSchool.mobile,
            }}
            fields={[
              {
                name: "name",
                label: "School Name",
                type: "text",
                required: true,
              },
              {
                name: "mobile",
                label: "Contact Number",
                type: "tel",
                required: true,
              },
            ]}
          />
        )}

        {/* Subscription Management Modal */}
        {selectedSchool && (
          <FormModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => {
              setIsSubscriptionModalOpen(false);
              setSelectedSchool(null);
            }}
            onSubmit={handleStartSubscription}
            title={`Manage Subscription - ${selectedSchool.name}`}
            fields={[
              {
                name: "subscription_start",
                label: "Start Date",
                type: "date",
                required: true,
              },
              {
                name: "subscription_end",
                label: "End Date",
                type: "date",
                required: true,
              },
              {
                name: "payment_amount",
                label: "Payment Amount (₹)",
                type: "number",
                required: true,
                placeholder: "Enter amount",
              },
            ]}
          />
        )}

        {/* Delete Dialog */}
        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedSchool(null);
          }}
          onConfirm={handleDelete}
          title="Delete School"
          description={`Are you sure you want to delete "${selectedSchool?.name}"? This action cannot be undone and will remove all associated data.`}
        />
      </div>
    </DashboardLayout>
  );
}
