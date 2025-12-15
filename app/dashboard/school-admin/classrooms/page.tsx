"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { FormModal, FormField } from "@/components/form-modal";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import {
  listClassRooms,
  createClassRoom,
  updateClassRoom,
  deleteClassRoom,
  listClassRoomsWithStudents,
  listEmptyClassRooms,
} from "@/lib/api/classrooms";
import { ClassRoom } from "@/types";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type FilterType = "all" | "with_students" | "empty";

export default function ClassRoomsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClassRoom, setSelectedClassRoom] = useState<ClassRoom | null>(null);

  // Fetch classrooms based on filter - call useQuery first to ensure QueryClient context is available
  const { data, isLoading, error } = useQuery({
    queryKey: ["classrooms", currentPage, search, filter],
    queryFn: async () => {
      const params = { page: currentPage, page_size: 20, search };
      
      if (filter === "with_students") {
        return await listClassRoomsWithStudents(params);
      } else if (filter === "empty") {
        return await listEmptyClassRooms(params);
      } else {
        return await listClassRooms(params);
      }
    },
  });

  // Call useQueryClient after useQuery to ensure QueryClient is available
  const queryClient = useQueryClient();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createClassRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      toast.success("Classroom created successfully!");
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create classroom");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateClassRoom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      toast.success("Classroom updated successfully!");
      setIsEditModalOpen(false);
      setSelectedClassRoom(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update classroom");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteClassRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      toast.success("Classroom deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedClassRoom(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error ||
          "Failed to delete classroom. It may contain students."
      );
    },
  });

  const columns = [
    { key: "name", label: "Name" },
    { key: "section", label: "Section" },
    {
      key: "students_count",
      label: "Students",
      render: (classroom: ClassRoom) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{classroom.students_count || 0}</span>
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (classroom: ClassRoom) =>
        new Date(classroom.created_at).toLocaleDateString(),
    },
  ];

  const handleCreate = (data: any) => {
    createMutation.mutate(data);
  };

  const handleEdit = (data: any) => {
    if (selectedClassRoom) {
      updateMutation.mutate({ id: selectedClassRoom.id, data });
    }
  };

  const handleDelete = () => {
    if (selectedClassRoom) {
      deleteMutation.mutate(selectedClassRoom.id);
    }
  };

  const formFields: FormField[] = [
    {
      name: "name",
      label: "Class Name",
      type: "text",
      required: true,
      placeholder: "e.g., Class 10",
    },
    {
      name: "section",
      label: "Section",
      type: "text",
      required: true,
      placeholder: "e.g., A",
    },
  ];

  if (isLoading) return (
        <DashboardLayout>
          <PageLoader />
        </DashboardLayout>
      );
  if (error) return <EmptyState title="Failed to load classrooms" description="Please try again later" />;

  const classrooms = data?.results || [];
  const totalCount = data?.count || 0;

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">ClassRooms</h1>
          <p className="text-muted-foreground">
            Manage your school's classrooms
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add ClassRoom
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{totalCount}</div>
          <p className="text-sm text-muted-foreground">Total ClassRooms</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">
            {classrooms.filter((c: ClassRoom) => (c.students_count || 0) > 0).length}
          </div>
          <p className="text-sm text-muted-foreground">With Students</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">
            {classrooms.filter((c: ClassRoom) => (c.students_count || 0) === 0).length}
          </div>
          <p className="text-sm text-muted-foreground">Empty</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <input
          type="text"
          placeholder="Search classrooms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border px-4 py-2 md:w-64"
        />
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === "with_students" ? "default" : "outline"}
            onClick={() => setFilter("with_students")}
            size="sm"
          >
            With Students
          </Button>
          <Button
            variant={filter === "empty" ? "default" : "outline"}
            onClick={() => setFilter("empty")}
            size="sm"
          >
            Empty
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={classrooms}
        pagination={{
          currentPage,
          totalPages: Math.ceil(totalCount / 20),
          totalItems: totalCount,
          pageSize: 20,
          onPageChange: setCurrentPage,
        }}
        actions={(classroom: ClassRoom) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedClassRoom(classroom);
                setIsEditModalOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedClassRoom(classroom);
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
        title="Add New ClassRoom"
        description="Create a new classroom for your school"
        fields={formFields}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedClassRoom(null);
        }}
        onSubmit={handleEdit}
        title="Edit ClassRoom"
        description="Update classroom information"
        fields={formFields}
        initialData={selectedClassRoom || undefined}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedClassRoom(null);
        }}
        onConfirm={handleDelete}
        title="Delete ClassRoom"
        description={`Are you sure you want to delete "${selectedClassRoom?.name} - ${selectedClassRoom?.section}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
    </DashboardLayout>
  );
}
