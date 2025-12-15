"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, UserPlus, Eye, UserX, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { FormModal, FormField } from "@/components/form-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import {
  listStaff,
  createStaff,
  updateStaff,
  patchStaff,
  listActiveStaff,
  listResignedStaff,
  createStaffUser,
} from "@/lib/api/staff";
import { deleteStaff } from "@/lib/api/staff";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { Staff } from "@/types";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type FilterType = "all" | "active" | "resigned";

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("active");
  const [designationFilter, setDesignationFilter] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Fetch staff based on filter
  const { data, isLoading, error } = useQuery({
    queryKey: ["staff", currentPage, search, filter, designationFilter],
    queryFn: async () => {
      const params: any = { page: currentPage, page_size: 20, search };
      
      if (designationFilter) params.designation = designationFilter;

      if (filter === "active") {
        return await listActiveStaff(params);
      } else if (filter === "resigned") {
        return await listResignedStaff(params);
      } else {
        return await listStaff(params);
      }
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member created successfully!");
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create staff member");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member updated successfully!");
      setIsEditModalOpen(false);
      setSelectedStaff(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update staff member");
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      createStaffUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("User account created successfully!");
      setIsCreateUserModalOpen(false);
      setSelectedStaff(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create user account");
    },
  });

  // Mark resigned mutation
  const markResignedMutation = useMutation({
    mutationFn: ({ id }: { id: number }) =>
      patchStaff(id, { employment_status: "resigned" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff marked as resigned!");
      setSelectedStaff(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to mark staff as resigned");
    },
  });

  const handleMarkResigned = (staff: Staff) => {
    if (confirm(`Are you sure you want to mark "${staff.name}" as resigned?`)) {
      markResignedMutation.mutate({ id: staff.id });
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedStaff(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete staff");
    },
  });

  const columns = [
    {
      key: "name",
      label: "Name",
    },
    {
      key: "designation",
      label: "Designation",
    },
    {
      key: "qualifications",
      label: "Qualifications",
    },
    {
      key: "mobile",
      label: "Mobile",
    },
    {
      key: "monthly_salary",
      label: "Monthly Salary",
      render: (staff: Staff) => `₹${staff.monthly_salary?.toLocaleString() || 0}`,
    },
    {
      key: "employment_status",
      label: "Status",
      render: (staff: Staff) => (
        <StatusBadge
          status={staff.employment_status}
          type="employment"
        />
      ),
    },
    {
      key: "has_user_account",
      label: "Account",
      render: (staff: Staff) => (
        <StatusBadge
          status={staff.has_user_account ? "active" : "inactive"}
          type="enrollment"
        />
      ),
    },
  ];

  const handleCreate = (data: any) => {
    // Client-side file size check for profile picture
    if (data.profile_picture instanceof File) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (data.profile_picture.size > maxSize) {
        toast.error('Profile picture must be 5MB or smaller.');
        return;
      }
    }

    createMutation.mutate(data);
  };

  const handleEdit = (data: any) => {
    // Client-side file size check for profile picture
    if (data.profile_picture instanceof File) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (data.profile_picture.size > maxSize) {
        toast.error('Profile picture must be 5MB or smaller.');
        return;
      }
    }

    if (selectedStaff) {
      updateMutation.mutate({ id: selectedStaff.id, data });
    }
  };

  const handleCreateUser = (data: any) => {
    if (selectedStaff) {
      createUserMutation.mutate({ id: selectedStaff.id, data });
    }
  };

  const formFields: FormField[] = [
    {
      name: "name",
      label: "Full Name",
      type: "text",
      required: true,
      placeholder: "Enter full name",
    },
    {
      name: "designation",
      label: "Designation",
      type: "text",
      required: true,
      placeholder: "e.g., Teacher, Principal, Clerk",
    },
    {
      name: "qualifications",
      label: "Qualifications",
      type: "text",
      required: false,
      placeholder: "e.g., B.Ed, M.A.",
    },
    {
      name: "mobile",
      label: "Mobile Number",
      type: "text",
      required: true,
      placeholder: "Enter mobile number",
    },
    {
      name: "joining_date",
      label: "Joining Date",
      type: "date",
      required: true,
    },
    {
      name: "monthly_salary",
      label: "Monthly Salary",
      type: "number",
      required: true,
      placeholder: "Enter monthly salary",
    },
    {
      name: "total_amount",
      label: "Annual Salary (Optional)",
      type: "number",
      required: false,
      placeholder: "e.g., 600000",
      description: "Total yearly salary for this staff member. This amount will be used to pre-fill salary records.",
    },
    {
      name: "profile_picture",
      label: "Profile Picture",
      type: "file",
      required: false,
      accept: "image/*",
      description: "Optional. JPEG/PNG image up to 5MB."
    },
    {
      name: "bank_account_no",
      label: "Bank Account Number",
      type: "text",
      required: false,
      placeholder: "Enter bank account number",
    },
    {
      name: "bank_name",
      label: "Bank Name",
      type: "text",
      required: false,
      placeholder: "Enter bank name",
    },
    {
      name: "ifsc_code",
      label: "IFSC Code",
      type: "text",
      required: false,
      placeholder: "Enter IFSC code",
    },
    {
      name: "employment_status",
      label: "Employment Status",
      type: "select",
      required: true,
      options: [
        { value: "active", label: "Active" },
        { value: "resigned", label: "Resigned" },
      ],
    },
  ];

  const createUserFields: FormField[] = [
    {
      name: "username",
      label: "Username",
      type: "text",
      required: true,
      placeholder: "e.g., staff_john",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      required: true,
      placeholder: "Enter password",
    },
  ];

  if (isLoading) return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  if (error) return <EmptyState title="Failed to load staff" description="Please try again later" />;

  const staff = data?.results || [];
  const totalCount = data?.count || 0;

  // Get unique designations for filter
  const uniqueDesignations = Array.from(
    new Set(staff.map((s: Staff) => s.designation))
  );

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff</h1>
          <p className="text-muted-foreground">
            Manage your school's staff members
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{totalCount}</div>
          <p className="text-sm text-muted-foreground">Total Staff</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">
            {staff.filter((s: Staff) => s.employment_status === "active").length}
          </div>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">
            {staff.filter((s: Staff) => s.employment_status === "resigned").length}
          </div>
          <p className="text-sm text-muted-foreground">Resigned</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">
            {staff.filter((s: Staff) => s.has_user_account).length}
          </div>
          <p className="text-sm text-muted-foreground">With Accounts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Search staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border px-4 py-2 md:w-64"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            onClick={() => setFilter("active")}
            size="sm"
          >
            Active
          </Button>
          <Button
            variant={filter === "resigned" ? "default" : "outline"}
            onClick={() => setFilter("resigned")}
            size="sm"
          >
            Resigned
          </Button>
          <select
            value={designationFilter}
            onChange={(e) => setDesignationFilter(e.target.value)}
            className="rounded-md border px-3 py-1 text-sm"
          >
            <option value="">All Designations</option>
            {uniqueDesignations.map((designation) => (
              <option key={designation} value={designation}>
                {designation}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={staff}
        pagination={{
          currentPage,
          totalPages: Math.ceil(totalCount / 20),
          pageSize: 20,
          totalItems: totalCount,
          onPageChange: setCurrentPage,
        }}
        actions={(staffMember: Staff) => (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/staff/${staffMember.id}`}>
              <Button
                variant="ghost"
                size="sm"
                title="View Details"
              >
                <Eye className="h-4 w-4 text-blue-500" />
              </Button>
            </Link>
            {!staffMember.has_user_account && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedStaff(staffMember);
                  setIsCreateUserModalOpen(true);
                }}
                title="Create User Account"
              >
                <UserPlus className="h-4 w-4 text-green-500" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedStaff(staffMember);
                setIsEditModalOpen(true);
              }}
              title="Edit Staff"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {staffMember.employment_status === "active" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMarkResigned(staffMember)}
                title="Mark as Resigned"
              >
                <UserX className="h-4 w-4 text-orange-500" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedStaff(staffMember);
                setIsDeleteDialogOpen(true);
              }}
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )}
      />

      {/* Create Modal */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        title="Add New Staff Member"
        description="Create a new staff member record"
        fields={formFields}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStaff(null);
        }}
        onSubmit={handleEdit}
        title="Edit Staff Member"
        description="Update staff member information"
        fields={formFields}
        initialData={selectedStaff || undefined}
      />

      {/* Create User Modal */}
      <FormModal
        isOpen={isCreateUserModalOpen}
        onClose={() => {
          setIsCreateUserModalOpen(false);
          setSelectedStaff(null);
        }}
        onSubmit={handleCreateUser}
        title="Create User Account"
        description={`Create login account for ${selectedStaff?.name}`}
        fields={createUserFields}
      />
      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={(open) => setIsDeleteDialogOpen(open)}
        onConfirm={() => {
          if (selectedStaff) deleteMutation.mutate(selectedStaff.id);
        }}
        title="Delete Staff"
        description="Deleting a staff member will also remove their salary records and attendance. This action cannot be undone."
        isLoading={deleteMutation.status === 'pending'}
      />
    </div>
    </DashboardLayout>
  );
}
