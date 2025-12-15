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
  listStudents,
  createStudent,
  updateStudent,
  patchStudent,
  listActiveStudents,
  listInactiveStudents,
  createStudentUser,
  deleteStudent,
} from "@/lib/api/students";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { listClassRooms } from "@/lib/api/classrooms";
import { Student } from "@/types";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type FilterType = "all" | "active" | "inactive";

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("active");
  const [classroomFilter, setClassroomFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fetch students based on filter
  const { data, isLoading, error } = useQuery({
    queryKey: ["students", currentPage, search, filter, classroomFilter, genderFilter],
    queryFn: async () => {
      const params: any = { page: currentPage, page_size: 20, search };
      
      if (classroomFilter) params.classroom = classroomFilter;
      if (genderFilter) params.gender = genderFilter;

      if (filter === "active") {
        return await listActiveStudents(params);
      } else if (filter === "inactive") {
        return await listInactiveStudents(params);
      } else {
        return await listStudents(params);
      }
    },
  });

  // Fetch classrooms for filter dropdown
  const { data: classroomsData } = useQuery({
    queryKey: ["classrooms-list"],
    queryFn: () => listClassRooms({ page_size: 100 }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student created successfully!");
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create student");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student updated successfully!");
      setIsEditModalOpen(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update student");
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      createStudentUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("User account created successfully!");
      setIsCreateUserModalOpen(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create user account");
    },
  });

  // Mark inactive mutation
  const markInactiveMutation = useMutation({
    mutationFn: ({ id }: { id: number }) =>
      patchStudent(id, { enrollment_status: "inactive" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student marked as inactive!");
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to mark student as inactive");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete student");
    },
  });

  const handleMarkInactive = (student: Student) => {
    if (confirm(`Are you sure you want to mark "${student.first_name} ${student.last_name}" as inactive?`)) {
      markInactiveMutation.mutate({ id: student.id });
    }
  };

  const columns = [
    {
      key: "admission_no",
      label: "Admission No",
      render: (student: Student) => student.admission_no || "-",
    },
    {
      key: "roll_number",
      label: "Roll No",
      render: (student: Student) => student.roll_number || "-",
    },
    {
      key: "first_name",
      label: "Name",
      render: (student: Student) => `${student.first_name} ${student.last_name}`,
    },
    {
      key: "classroom_name",
      label: "Class",
    },
    {
      key: "gender",
      label: "Gender",
      render: (student: Student) => (
        <span className="capitalize">{student.gender}</span>
      ),
    },
    {
      key: "mobile",
      label: "Mobile",
    },
    {
      key: "enrollment_status",
      label: "Status",
      render: (student: Student) => (
        <StatusBadge
          status={student.enrollment_status}
          type="enrollment"
        />
      ),
    },
    {
      key: "has_user_account",
      label: "Account",
      render: (student: Student) => (
        <StatusBadge
          status={student.has_user_account ? "active" : "inactive"}
          type="enrollment"
        />
      ),
    },
  ];

  const handleCreate = (data: any) => {
    // Validate that at least one of admission_no or roll_number is provided
    if (!data.admission_no && !data.roll_number) {
      toast.error("Either Admission Number or Roll Number must be provided");
      return;
    }
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
    // Validate that at least one of admission_no or roll_number is provided
    if (!data.admission_no && !data.roll_number) {
      toast.error("Either Admission Number or Roll Number must be provided");
      return;
    }
    // Client-side file size check for profile picture
    if (data.profile_picture instanceof File) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (data.profile_picture.size > maxSize) {
        toast.error('Profile picture must be 5MB or smaller.');
        return;
      }
    }

    if (selectedStudent) {
      updateMutation.mutate({ id: selectedStudent.id, data });
    }
  };

  const handleCreateUser = (data: any) => {
    if (selectedStudent) {
      createUserMutation.mutate({ id: selectedStudent.id, data });
    }
  };

  const classrooms = classroomsData?.results || [];

  const formFields: FormField[] = [
    {
      name: "admission_no",
      label: "Admission Number",
      type: "text",
      required: false,
      placeholder: "e.g., 2025001",
    },
    {
      name: "roll_number",
      label: "Roll Number",
      type: "text",
      required: false,
      placeholder: "e.g., 101",
    },
    {
      name: "first_name",
      label: "First Name",
      type: "text",
      required: true,
      placeholder: "Enter first name",
    },
    {
      name: "last_name",
      label: "Last Name",
      type: "text",
      required: true,
      placeholder: "Enter last name",
    },
    {
      name: "dob",
      label: "Date of Birth",
      type: "date",
      required: true,
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      required: true,
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "classroom",
      label: "ClassRoom",
      type: "select",
      required: true,
      options: classrooms.map((c) => ({
        value: c.id.toString(),
        label: `${c.name} - ${c.section}`,
      })),
    },
    {
      name: "mobile",
      label: "Mobile Number",
      type: "text",
      required: true,
      placeholder: "Enter mobile number",
    },
    {
      name: "parent_guardian_name",
      label: "Parent/Guardian Name",
      type: "text",
      required: true,
      placeholder: "Enter parent/guardian name",
    },
    {
      name: "parent_guardian_contact",
      label: "Parent/Guardian Contact",
      type: "text",
      required: true,
      placeholder: "Enter contact number",
    },
    {
      name: "address",
      label: "Address",
      type: "textarea",
      required: false,
      placeholder: "Enter full address",
    },
    {
      name: "enrollment_status",
      label: "Enrollment Status",
      type: "select",
      required: true,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    {
      name: "total_amount",
      label: "Annual Fee Amount (Optional)",
      type: "number",
      required: false,
      placeholder: "e.g., 60000",
      description: "Total yearly fee for this student. This amount will be used to pre-fill fee records.",
    },
    {
      name: "profile_picture",
      label: "Profile Picture",
      type: "file",
      required: false,
      accept: "image/*",
      description: "Optional. JPEG/PNG image up to 5MB."
    },
  ];

  const createUserFields: FormField[] = [
    {
      name: "username",
      label: "Username",
      type: "text",
      required: true,
      placeholder: "e.g., student2025001",
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
  if (error) return <EmptyState title="Failed to load students" description="Please try again later" />;

  const students = data?.results || [];
  const totalCount = data?.count || 0;

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            Manage your school's students
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{totalCount}</div>
          <p className="text-sm text-muted-foreground">Total Students</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">
            {students.filter((s: Student) => s.enrollment_status === "active").length}
          </div>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">
            {students.filter((s: Student) => s.enrollment_status === "inactive").length}
          </div>
          <p className="text-sm text-muted-foreground">Inactive</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">
            {students.filter((s: Student) => s.has_user_account).length}
          </div>
          <p className="text-sm text-muted-foreground">With Accounts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Search students..."
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
            variant={filter === "inactive" ? "default" : "outline"}
            onClick={() => setFilter("inactive")}
            size="sm"
          >
            Inactive
          </Button>
          <select
            value={classroomFilter}
            onChange={(e) => setClassroomFilter(e.target.value)}
            className="rounded-md border px-3 py-1 text-sm"
          >
            <option value="">All Classes</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.section}
              </option>
            ))}
          </select>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="rounded-md border px-3 py-1 text-sm"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={students}
        pagination={{
          currentPage,
          totalPages: Math.ceil(totalCount / 20),
          pageSize: 20,
          totalItems: totalCount,
          onPageChange: setCurrentPage,
        }}
        actions={(student: Student) => (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/student/${student.id}`}>
              <Button
                variant="ghost"
                size="sm"
                title="View Details"
              >
                <Eye className="h-4 w-4 text-blue-500" />
              </Button>
            </Link>
            {!student.has_user_account && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedStudent(student);
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
                setSelectedStudent(student);
                setIsEditModalOpen(true);
              }}
              title="Edit Student"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {student.enrollment_status === "active" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMarkInactive(student)}
                title="Mark as Inactive"
              >
                <UserX className="h-4 w-4 text-orange-500" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedStudent(student);
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
        title="Add New Student"
        description="Create a new student record"
        fields={formFields}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStudent(null);
        }}
        onSubmit={handleEdit}
        title="Edit Student"
        description="Update student information"
        fields={formFields}
        initialData={selectedStudent || undefined}
      />

      {/* Create User Modal */}
      <FormModal
        isOpen={isCreateUserModalOpen}
        onClose={() => {
          setIsCreateUserModalOpen(false);
          setSelectedStudent(null);
        }}
        onSubmit={handleCreateUser}
        title="Create User Account"
        description={`Create login account for ${selectedStudent?.first_name} ${selectedStudent?.last_name}`}
        fields={createUserFields}
      />
      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={(open) => setIsDeleteDialogOpen(open)}
        onConfirm={() => {
          if (selectedStudent) deleteMutation.mutate(selectedStudent.id);
        }}
        title="Delete Student"
        description="Deleting a student will also remove their fee records and attendance. This action cannot be undone."
        isLoading={deleteMutation.status === 'pending'}
      />
    </div>
    </DashboardLayout>
  );
}
