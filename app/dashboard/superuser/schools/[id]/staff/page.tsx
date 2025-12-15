"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable, Column } from "@/components/data-table";
import { PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, Search, UserCog, Eye } from "lucide-react";
import * as staffApi from "@/lib/api/staff";
import * as schoolsApi from "@/lib/api/schools";
import { Staff } from "@/types";
import Link from "next/link";

export default function SchoolStaffPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = parseInt(params.id as string);

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Fetch school details
  const { data: school } = useQuery({
    queryKey: ["school", schoolId],
    queryFn: () => schoolsApi.getSchool(schoolId),
    enabled: !!schoolId,
  });

  // Fetch staff for this school
  const { data: staffData, isLoading } = useQuery({
    queryKey: ["school-staff", schoolId, searchTerm, page, pageSize],
    queryFn: () =>
      staffApi.listStaff({
        school: schoolId,
        search: searchTerm || undefined,
        page,
        page_size: pageSize,
      }),
    enabled: !!schoolId,
  });

  const columns: Column<Staff>[] = [
    {
      key: "name",
      label: "Staff Name",
      render: (staff) => (
        <div>
          <p className="font-medium">{staff.name}</p>
          <p className="text-sm text-muted-foreground">{staff.designation}</p>
        </div>
      ),
    },
    {
      key: "mobile",
      label: "Contact",
      render: (staff) => staff.mobile,
    },
    {
      key: "monthly_salary",
      label: "Monthly Salary",
      render: (staff) => `₹${parseFloat(staff.monthly_salary).toLocaleString("en-IN")}`,
    },
    {
      key: "employment_status",
      label: "Status",
      render: (staff) => <StatusBadge status={staff.employment_status} type="enrollment" />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (staff) => (
        <Link href={`/dashboard/staff/${staff.id}`}>
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </Link>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/superuser/schools/${schoolId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to School
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{school?.name} - Staff</h1>
            <p className="text-muted-foreground mt-2">View and manage staff for this school</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Card */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(24, 195, 168, 0.1)" }}
            >
              <UserCog className="w-6 h-6" style={{ color: "#18C3A8" }} />
            </div>
            <div>
              <p className="text-2xl font-bold">{staffData?.count || 0}</p>
              <p className="text-sm text-muted-foreground">Total Staff Members</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {staffData && staffData.results.length > 0 ? (
          <DataTable
            columns={columns}
            data={staffData.results}
            pagination={{
              currentPage: page,
              totalPages: Math.ceil(staffData.count / pageSize),
              pageSize,
              totalItems: staffData.count,
              onPageChange: setPage,
            }}
          />
        ) : (
          <EmptyState title="No staff found" description="This school has no staff members yet." />
        )}
      </div>
    </DashboardLayout>
  );
}
