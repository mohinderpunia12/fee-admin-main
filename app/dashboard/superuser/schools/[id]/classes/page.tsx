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
import { ArrowLeft, Search, GraduationCap } from "lucide-react";
import * as classroomsApi from "@/lib/api/classrooms";
import * as schoolsApi from "@/lib/api/schools";
import { ClassRoom } from "@/types";

export default function SchoolClassesPage() {
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

  // Fetch classrooms for this school
  const { data: classroomsData, isLoading } = useQuery({
    queryKey: ["school-classrooms", schoolId, searchTerm, page, pageSize],
    queryFn: () =>
      classroomsApi.listClassRooms({
        school: schoolId,
        search: searchTerm || undefined,
        page,
        page_size: pageSize,
      }),
    enabled: !!schoolId,
  });

  const columns: Column<ClassRoom>[] = [
    {
      key: "name",
      label: "Class Name",
      render: (classroom) => <span className="font-medium">{classroom.name}</span>,
    },
    {
      key: "section",
      label: "Section",
      render: (classroom) => classroom.section,
    },
    {
      key: "created_at",
      label: "Created",
      render: (classroom) => new Date(classroom.created_at).toLocaleDateString(),
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
            <h1 className="text-3xl font-bold">{school?.name} - Classes</h1>
            <p className="text-muted-foreground mt-2">View classes for this school</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by class name, section..."
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
              style={{ backgroundColor: "rgba(62, 180, 137, 0.1)" }}
            >
              <GraduationCap className="w-6 h-6" style={{ color: "#3EB489" }} />
            </div>
            <div>
              <p className="text-2xl font-bold">{classroomsData?.count || 0}</p>
              <p className="text-sm text-muted-foreground">Total Classes</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {classroomsData && classroomsData.results.length > 0 ? (
          <DataTable
            columns={columns}
            data={classroomsData.results}
            pagination={{
              currentPage: page,
              totalPages: Math.ceil(classroomsData.count / pageSize),
              pageSize,
              totalItems: classroomsData.count,
              onPageChange: setPage,
            }}
          />
        ) : (
          <EmptyState title="No classes found" description="This school has no classes yet." />
        )}
      </div>
    </DashboardLayout>
  );
}
