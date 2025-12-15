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
import { ArrowLeft, Search, Users, Eye } from "lucide-react";
import * as studentsApi from "@/lib/api/students";
import * as schoolsApi from "@/lib/api/schools";
import { Student } from "@/types";
import Link from "next/link";

export default function SchoolStudentsPage() {
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

  // Fetch students for this school
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ["school-students", schoolId, searchTerm, page, pageSize],
    queryFn: () =>
      studentsApi.listStudents({
        school: schoolId,
        search: searchTerm || undefined,
        page,
        page_size: pageSize,
      }),
    enabled: !!schoolId,
  });

  const columns: Column<Student>[] = [
    {
      key: "admission_no",
      label: "Admission No",
      render: (student) => <span className="font-medium">{student.admission_no}</span>,
    },
    {
      key: "name",
      label: "Student Name",
      render: (student) => (
        <div>
          <p className="font-medium">
            {student.first_name} {student.last_name}
          </p>
          <p className="text-sm text-muted-foreground">{student.classroom_name || "No class"}</p>
        </div>
      ),
    },
    {
      key: "gender",
      label: "Gender",
      render: (student) => <span className="capitalize">{student.gender}</span>,
    },
    {
      key: "mobile",
      label: "Contact",
      render: (student) => student.mobile,
    },
    {
      key: "enrollment_status",
      label: "Status",
      render: (student) => <StatusBadge status={student.enrollment_status} type="enrollment" />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (student) => (
        <Link href={`/dashboard/student/${student.id}`}>
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
            <h1 className="text-3xl font-bold">{school?.name} - Students</h1>
            <p className="text-muted-foreground mt-2">
              View and manage students for this school
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, admission number..."
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
              style={{ backgroundColor: "rgba(34, 62, 151, 0.1)" }}
            >
              <Users className="w-6 h-6" style={{ color: "#223E97" }} />
            </div>
            <div>
              <p className="text-2xl font-bold">{studentsData?.count || 0}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {studentsData && studentsData.results.length > 0 ? (
          <DataTable
            columns={columns}
            data={studentsData.results}
            pagination={{
              currentPage: page,
              totalPages: Math.ceil(studentsData.count / pageSize),
              pageSize,
              totalItems: studentsData.count,
              onPageChange: setPage,
            }}
          />
        ) : (
          <EmptyState
            title="No students found"
            description="This school has no students yet."
          />
        )}
      </div>
    </DashboardLayout>
  );
}
