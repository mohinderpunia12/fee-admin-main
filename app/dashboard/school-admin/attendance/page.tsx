"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users2, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { FormModal, FormField } from "@/components/form-modal";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import {
  listAttendanceRecords,
  createAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  getTodayAttendance,
  bulkMarkAttendance,
  getMonthlyAttendanceSummary,
} from "@/lib/api/attendance";
import { listStaff } from "@/lib/api/staff";
import { listStudents } from "@/lib/api/students";
import { Attendance } from "@/types";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [attendanceType, setAttendanceType] = useState<"staff" | "student">("staff");
  const [dateFilter, setDateFilter] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkMarkModalOpen, setIsBulkMarkModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

  // Fetch attendance records
  const { data, isLoading, error } = useQuery({
    queryKey: ["attendance", currentPage, search, dateFilter, statusFilter, attendanceType],
    queryFn: async () => {
      const params: any = { page: currentPage, page_size: 20, search };
      
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      // Filter by type
      if (attendanceType === "staff") {
        params.staff__isnull = "false";
      } else {
        params.student__isnull = "false";
      }

      return await listAttendanceRecords(params);
    },
  });

  // Fetch staff for dropdown
  const { data: staffData } = useQuery({
    queryKey: ["staff-list"],
    queryFn: () => listStaff({ page_size: 1000 }),
  });

  // Fetch students for dropdown
  const { data: studentsData } = useQuery({
    queryKey: ["students-list"],
    queryFn: () => listStudents({ page_size: 1000 }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createAttendanceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance marked successfully!");
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to mark attendance");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateAttendanceRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance updated successfully!");
      setIsEditModalOpen(false);
      setSelectedAttendance(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update attendance");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAttendanceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedAttendance(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete attendance");
    },
  });

  // Bulk mark mutation
  const bulkMarkMutation = useMutation({
    mutationFn: bulkMarkAttendance,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success(response.message || "Bulk attendance marked successfully!");
      setIsBulkMarkModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to mark bulk attendance");
    },
  });

  const columns = [
    {
      key: attendanceType === "staff" ? "staff_name" : "student_name",
      label: attendanceType === "staff" ? "Staff" : "Student",
      render: (attendance: Attendance) => {
        if (attendanceType === "staff") {
          return (
            <div>
              <div className="font-medium">{attendance.staff_name}</div>
              {attendance.staff_designation && (
                <div className="text-xs text-muted-foreground">
                  {attendance.staff_designation}
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div>
              <div className="font-medium">{attendance.student_name}</div>
              <div className="text-xs text-muted-foreground">
                {attendance.classroom_name} • {attendance.student_admission_no}
              </div>
            </div>
          );
        }
      },
    },
    {
      key: "date",
      label: "Date",
      render: (attendance: Attendance) =>
        new Date(attendance.date).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      render: (attendance: Attendance) => {
        return (
          <StatusBadge
            status={attendance.status}
            type="attendance"
          />
        );
      },
    },
    ...(attendanceType === "staff"
      ? [
          {
            key: "hours_worked",
            label: "Hours Worked",
            render: (attendance: Attendance) => attendance.hours_worked || "-",
          },
        ]
      : []),
    {
      key: "notes",
      label: "Notes",
      render: (attendance: Attendance) => attendance.notes || "-",
    },
  ];

  const handleCreate = (data: any) => {
    createMutation.mutate(data);
  };

  const handleEdit = (data: any) => {
    if (selectedAttendance) {
      updateMutation.mutate({ id: selectedAttendance.id, data });
    }
  };

  const handleDelete = () => {
    if (selectedAttendance) {
      deleteMutation.mutate(selectedAttendance.id);
    }
  };

  const staff = staffData?.results || [];
  const students = studentsData?.results || [];

  const handleBulkMark = (data: any) => {
    if (attendanceType === "staff") {
      // Add all staff IDs to the request
      const staff_ids = staff.map((s) => s.id);
      bulkMarkMutation.mutate({
        ...data,
        staff_ids,
      });
    } else {
      // Add all student IDs to the request
      const student_ids = students.map((s: any) => s.id);
      bulkMarkMutation.mutate({
        ...data,
        student_ids,
      });
    }
  };

  const handleViewSummary = async () => {
    try {
      const currentDate = new Date();
      const data = await getMonthlyAttendanceSummary({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      });
      setSummaryData(data);
      setIsSummaryModalOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to fetch summary");
    }
  };

  const formFields: FormField[] = [
    ...(attendanceType === "staff"
      ? [
          {
            name: "staff",
            label: "Staff Member",
            type: "select",
            required: true,
            options: staff.map((s) => ({
              value: s.id.toString(),
              label: `${s.name} (${s.designation})`,
            })),
          },
        ]
      : [
          {
            name: "student",
            label: "Student",
            type: "select",
            required: true,
            options: students.map((s) => ({
              value: s.id.toString(),
              label: `${s.first_name} ${s.last_name} - ${s.classroom_name} (${s.admission_no})`,
            })),
          },
        ]),
    {
      name: "date",
      label: "Date",
      type: "date",
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options:
        attendanceType === "staff"
          ? [
              { value: "present", label: "Present" },
              { value: "absent", label: "Absent" },
              { value: "leave", label: "Leave" },
              { value: "half_day", label: "Half Day" },
              { value: "overtime", label: "Overtime" },
            ]
          : [
              { value: "present", label: "Present" },
              { value: "absent", label: "Absent" },
              { value: "leave", label: "Leave" },
              { value: "half_day", label: "Half Day" },
            ],
    },
    ...(attendanceType === "staff"
      ? [
          {
            name: "hours_worked",
            label: "Hours Worked",
            type: "number",
            required: false,
            placeholder: "Enter hours worked (for overtime)",
          },
        ]
      : []),
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      required: false,
      placeholder: "Additional notes",
    },
  ];

  const bulkMarkFields: FormField[] = [
    {
      name: "date",
      label: "Date",
      type: "date",
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options:
        attendanceType === "staff"
          ? [
              { value: "present", label: "Present" },
              { value: "absent", label: "Absent" },
              { value: "leave", label: "Leave" },
              { value: "half_day", label: "Half Day" },
              { value: "overtime", label: "Overtime" },
            ]
          : [
              { value: "present", label: "Present" },
              { value: "absent", label: "Absent" },
              { value: "leave", label: "Leave" },
              { value: "half_day", label: "Half Day" },
            ],
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      required: false,
      placeholder: "Optional notes",
    },
  ];

  if (isLoading) return (
        <DashboardLayout>
          <LoadingSpinner />
        </DashboardLayout>
      );
  if (error) return <EmptyState title="Failed to load attendance records" description="Please try again later" />;

  const attendanceRecords = data?.results || [];
  const totalCount = data?.count || 0;

  const presentCount = attendanceRecords.filter(
    (a: Attendance) => a.status === "present"
  ).length;
  const absentCount = attendanceRecords.filter(
    (a: Attendance) => a.status === "absent"
  ).length;
  const leaveCount = attendanceRecords.filter(
    (a: Attendance) => a.status === "leave"
  ).length;

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">
            Manage staff and student attendance records
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleViewSummary} variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Monthly Summary
          </Button>
          <Button onClick={() => setIsBulkMarkModalOpen(true)} variant="outline">
            <Users2 className="mr-2 h-4 w-4" />
            Bulk Mark
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Type Selector */}
      <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">Attendance Type:</span>
        <div className="flex gap-2">
          <Button
            variant={attendanceType === "staff" ? "default" : "outline"}
            size="sm"
            onClick={() => setAttendanceType("staff")}
          >
            Staff
          </Button>
          <Button
            variant={attendanceType === "student" ? "default" : "outline"}
            size="sm"
            onClick={() => setAttendanceType("student")}
          >
            Student
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{totalCount}</div>
          <p className="text-sm text-muted-foreground">Total Records</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold text-green-600">{presentCount}</div>
          <p className="text-sm text-muted-foreground">Present</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold text-red-600">{absentCount}</div>
          <p className="text-sm text-muted-foreground">Absent</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold text-blue-600">{leaveCount}</div>
          <p className="text-sm text-muted-foreground">On Leave</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder={`Search by ${attendanceType} name...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border px-4 py-2 md:w-64"
        />
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-md border px-3 py-1 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border px-3 py-1 text-sm"
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="leave">Leave</option>
            <option value="half_day">Half Day</option>
            {attendanceType === "staff" && <option value="overtime">Overtime</option>}
          </select>
          <Button
            onClick={() => setDateFilter(new Date().toISOString().split("T")[0])}
            variant="outline"
            size="sm"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={attendanceRecords}
        pagination={{
          currentPage,
          totalPages: Math.ceil(totalCount / 20),
          pageSize: 20,
          totalItems: totalCount,
          onPageChange: setCurrentPage,
        }}
        actions={(attendance: Attendance) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedAttendance(attendance);
                setIsEditModalOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedAttendance(attendance);
                setIsDeleteDialogOpen(true);
              }}
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
        title="Mark Attendance"
        description="Mark attendance for a staff member"
        fields={formFields}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAttendance(null);
        }}
        onSubmit={handleEdit}
        title="Edit Attendance"
        description="Update attendance record"
        fields={formFields}
        initialData={selectedAttendance || undefined}
      />

      {/* Bulk Mark Modal */}
      <FormModal
        isOpen={isBulkMarkModalOpen}
        onClose={() => setIsBulkMarkModalOpen(false)}
        onSubmit={handleBulkMark}
        title={`Bulk Mark ${attendanceType === "staff" ? "Staff" : "Student"} Attendance`}
        description={`Mark attendance for all active ${attendanceType === "staff" ? "staff members" : "students"} for the selected date`}
        fields={bulkMarkFields}
      />

      {/* Monthly Summary Modal */}
      {isSummaryModalOpen && summaryData && (
        <FormModal
          isOpen={isSummaryModalOpen}
          onClose={() => {
            setIsSummaryModalOpen(false);
            setSummaryData(null);
          }}
          onSubmit={() => setIsSummaryModalOpen(false)}
          title="Monthly Attendance Summary"
          description={`Summary for ${summaryData.month}/${summaryData.year}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">{summaryData.total_records}</div>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold text-green-600">
                  {summaryData.summary?.present || 0}
                </div>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold text-red-600">
                  {summaryData.summary?.absent || 0}
                </div>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {summaryData.summary?.leave || 0}
                </div>
                <p className="text-sm text-muted-foreground">Leave</p>
              </div>
            </div>
          </div>
        </FormModal>
      )}

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedAttendance(null);
        }}
        onConfirm={handleDelete}
        title="Delete Attendance"
        description={`Are you sure you want to delete this attendance record for "${
          selectedAttendance?.staff_name || selectedAttendance?.student_name
        }"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
    </DashboardLayout>
  );
}
