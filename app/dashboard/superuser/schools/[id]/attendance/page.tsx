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
import { ArrowLeft, Search, ClipboardList } from "lucide-react";
import * as attendanceApi from "@/lib/api/attendance";
import * as schoolsApi from "@/lib/api/schools";
import { Attendance } from "@/types";

export default function SchoolAttendancePage() {
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

  // Fetch attendance records for this school
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ["school-attendance", schoolId, searchTerm, page, pageSize],
    queryFn: () =>
      attendanceApi.listAttendanceRecords({
        school: schoolId,
        search: searchTerm || undefined,
        page,
        page_size: pageSize,
        ordering: "-date",
      }),
    enabled: !!schoolId,
  });

  const columns: Column<Attendance>[] = [
    {
      key: "staff",
      label: "Staff",
      render: (attendance) => (
        <span className="font-medium">{attendance.staff_name || `Staff #${attendance.staff}`}</span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (attendance) => new Date(attendance.date).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      render: (attendance) => {
        const statusMap: Record<string, "active" | "inactive" | "warning" | "default"> = {
          present: "active",
          absent: "inactive",
          leave: "warning",
          half_day: "default",
          overtime: "active",
        };
        const displayText = attendance.status.replace("_", " ").toUpperCase();
        return (
          <div className="capitalize">
            <StatusBadge
              status={statusMap[attendance.status] || "default"}
              type="enrollment"
            />
            <span className="ml-2 text-sm">{displayText}</span>
          </div>
        );
      },
    },
    {
      key: "hours_worked",
      label: "Hours Worked",
      render: (attendance) => attendance.hours_worked || "N/A",
    },
    {
      key: "notes",
      label: "Notes",
      render: (attendance) => (
        <span className="text-sm text-muted-foreground">{attendance.notes || "-"}</span>
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

  const presentCount = attendanceData?.results.filter((a: Attendance) => a.status === "present").length || 0;
  const absentCount = attendanceData?.results.filter((a: Attendance) => a.status === "absent").length || 0;
  const leaveCount = attendanceData?.results.filter((a: Attendance) => a.status === "leave").length || 0;

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
            <h1 className="text-3xl font-bold">{school?.name} - Attendance Records</h1>
            <p className="text-muted-foreground mt-2">View attendance records for this school</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by staff name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(62, 180, 137, 0.1)" }}
              >
                <ClipboardList className="w-6 h-6" style={{ color: "#3EB489" }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendanceData?.count || 0}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(62, 180, 137, 0.1)" }}
              >
                <ClipboardList className="w-6 h-6" style={{ color: "#3EB489" }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{presentCount}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
              >
                <ClipboardList className="w-6 h-6" style={{ color: "#ef4444" }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{absentCount}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(251, 191, 36, 0.1)" }}
              >
                <ClipboardList className="w-6 h-6" style={{ color: "#fbbf24" }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{leaveCount}</p>
                <p className="text-sm text-muted-foreground">On Leave</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {attendanceData && attendanceData.results.length > 0 ? (
          <DataTable
            columns={columns}
            data={attendanceData.results}
            pagination={{
              currentPage: page,
              totalPages: Math.ceil(attendanceData.count / pageSize),
              pageSize,
              totalItems: attendanceData.count,
              onPageChange: setPage,
            }}
          />
        ) : (
          <EmptyState title="No attendance records found" description="This school has no attendance records yet." />
        )}
      </div>
    </DashboardLayout>
  );
}
