"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, CheckCircle, Zap, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { FormModal, FormField } from "@/components/form-modal";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import {
  listFeeRecords,
  createFeeRecord,
  updateFeeRecord,
  deleteFeeRecord,
  listPaidFeeRecords,
  listUnpaidFeeRecords,
  markFeeAsPaid,
  generateMonthlyFees,
  getFeeDownloadLink,
} from "@/lib/api/fee-records";
import { listStudents } from "@/lib/api/students";
import { listClassRooms } from "@/lib/api/classrooms";
import { getUserProfile } from "@/lib/api/auth";
import { FeeRecord } from "@/types";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { pdf } from '@react-pdf/renderer';
import { FeeReceiptPDF } from '@/components/pdf';

type FilterType = "all" | "paid" | "unpaid";

export default function FeeRecordsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);
  const [isGenerateFeesModalOpen, setIsGenerateFeesModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [feeFormData, setFeeFormData] = useState<any>({});

  // Fetch current user for school info
  const { data: currentUser } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
  });

  // Fetch fee records based on filter
  const { data, isLoading, error } = useQuery({
    queryKey: ["fee-records", currentPage, search, filter, monthFilter, yearFilter],
    queryFn: async () => {
      const params: any = { page: currentPage, page_size: 20, search };
      
      if (monthFilter) params.month = monthFilter;
      if (yearFilter) params.year = yearFilter;

      if (filter === "paid") {
        return await listPaidFeeRecords(params);
      } else if (filter === "unpaid") {
        return await listUnpaidFeeRecords(params);
      } else {
        return await listFeeRecords(params);
      }
    },
  });

  // Fetch students for dropdown
  const { data: studentsData } = useQuery({
    queryKey: ["students-list"],
    queryFn: () => listStudents({ page_size: 1000 }),
  });

  // Fetch classrooms for bulk generation
  const { data: classroomsData } = useQuery({
    queryKey: ["classrooms-list"],
    queryFn: () => listClassRooms({ page_size: 1000 }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createFeeRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-records"] });
      toast.success("Fee record created successfully!");
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create fee record");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateFeeRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-records"] });
      toast.success("Fee record updated successfully!");
      setIsEditModalOpen(false);
      setSelectedFee(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update fee record");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteFeeRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-records"] });
      toast.success("Fee record deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedFee(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete fee record");
    },
  });

  // Mark paid mutation
  const markPaidMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      markFeeAsPaid(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-records"] });
      toast.success("Fee marked as paid successfully!");
      setIsMarkPaidModalOpen(false);
      setSelectedFee(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to mark fee as paid");
    },
  });

  // Generate monthly fees mutation
  const generateFeesMutation = useMutation({
    mutationFn: generateMonthlyFees,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["fee-records"] });
      toast.success(
        `${response.created_count} fee records generated successfully! ${
          response.skipped_count > 0 ? `${response.skipped_count} skipped.` : ""
        }`
      );
      setIsGenerateFeesModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to generate fee records");
    },
  });

  const columns = [
    {
      key: "student_name",
      label: "Student",
    },
    {
      key: "month",
      label: "Month",
      render: (fee: FeeRecord) => {
        const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months[fee.month];
      },
    },
    {
      key: "year",
      label: "Year",
    },
    {
      key: "academic_year",
      label: "Academic Year",
    },
    {
      key: "final_amount",
      label: "Final Amount",
      render: (fee: FeeRecord) => `₹${fee.final_amount?.toLocaleString() || 0}`,
    },
    {
      key: "paid",
      label: "Status",
      render: (fee: FeeRecord) => (
        <StatusBadge
          status={fee.paid ? "paid" : "unpaid"}
          type="payment"
        />
      ),
    },
    {
      key: "paid_on",
      label: "Paid On",
      render: (fee: FeeRecord) =>
        fee.paid_on ? new Date(fee.paid_on).toLocaleDateString() : "-",
    },
  ];

  const handleCreate = (data: any) => {
    createMutation.mutate(data);
  };

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id.toString() === studentId);
    if (student && student.total_amount) {
      // Divide annual amount by 12 to get monthly fee
      const monthlyAmount = (parseFloat(student.total_amount) / 12).toFixed(2);
      setFeeFormData((prev: any) => ({
        ...prev,
        student: studentId,
        total_amount: monthlyAmount,
      }));
    } else {
      setFeeFormData((prev: any) => ({
        ...prev,
        student: studentId,
      }));
    }
  };

  const handleEdit = (data: any) => {
    if (selectedFee) {
      updateMutation.mutate({ id: selectedFee.id, data });
    }
  };

  const handleDelete = () => {
    if (selectedFee) {
      deleteMutation.mutate(selectedFee.id);
    }
  };

  const handleMarkPaid = (data: any) => {
    if (selectedFee) {
      // Add transaction number to notes if provided
      const updatedData = { ...data };
      if (data.transaction_number) {
        const existingNotes = selectedFee.notes || '';
        const transactionNote = `Transaction #: ${data.transaction_number}`;
        updatedData.notes = existingNotes 
          ? `${existingNotes}\n${transactionNote}` 
          : transactionNote;
        delete updatedData.transaction_number; // Remove from data as it's in notes now
      }
      markPaidMutation.mutate({ id: selectedFee.id, data: updatedData });
    }
  };

  const handleGenerateFees = (data: any) => {
    // Transform fee components from form data
    const feeComponents: { [key: string]: number } = {};
    if (data.tuition) feeComponents.tuition = parseFloat(data.tuition);
    if (data.transport) feeComponents.transport = parseFloat(data.transport);
    if (data.library) feeComponents.library = parseFloat(data.library);
    if (data.lab) feeComponents.lab = parseFloat(data.lab);
    if (data.sports) feeComponents.sports = parseFloat(data.sports);
    if (data.exam) feeComponents.exam = parseFloat(data.exam);

    generateFeesMutation.mutate({
      classroom_id: parseInt(data.classroom_id),
      month: parseInt(data.month),
      year: parseInt(data.year),
      academic_year: data.academic_year,
      fee_components: feeComponents,
      late_fee: data.late_fee ? parseFloat(data.late_fee) : 0,
      discount: data.discount ? parseFloat(data.discount) : 0,
      notes: data.notes || "",
    });
  };

  // Download Fee Receipt PDF
  const handleDownloadFeeReceipt = async (fee: FeeRecord) => {
    try {
      const student = students.find(s => s.id === fee.student);
      if (!student) {
        toast.error("Student data not available");
        return;
      }

      // Get school info from fee record (works for all roles including superuser)
      const schoolName = fee.school_name || currentUser?.school_name || "School Name";
      const schoolLogoUrl = fee.school_logo_url || currentUser?.school_logo_url;
      const schoolEmail = fee.school_email || currentUser?.school_email;
      const schoolMobile = fee.school_mobile || currentUser?.school_mobile;
      const fullName = `${student.first_name} ${student.last_name}`;
      const className = student.classroom_name || "";

      const doc = <FeeReceiptPDF 
        feeRecord={fee}
        schoolName={schoolName}
        studentName={fullName}
        className={className}
        admissionNo={student.admission_no}
        fatherName={student.parent_guardian_name}
        schoolLogoUrl={schoolLogoUrl}
        schoolEmail={schoolEmail}
        schoolMobile={schoolMobile}
      />;

      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Fee_Receipt_${fullName}_${fee.month}_${fee.year}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Fee receipt downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download fee receipt");
    }
  };

  // Generate WhatsApp link with PDF download
  const handleSendViaWhatsApp = async (fee: FeeRecord) => {
    try {
      const student = students.find(s => s.id === fee.student);
      if (!student) {
        toast.error("Student data not available");
        return;
      }

      // Clean phone number (remove spaces, dashes, etc.)
      const phoneNumber = student.mobile?.replace(/\D/g, '');
      if (!phoneNumber) {
        toast.error("Student mobile number not available");
        return;
      }

      // Prepend 91 if not already present (check for 10-digit or 12-digit with country code)
      const formattedNumber = phoneNumber.length === 10 ? `91${phoneNumber}` : phoneNumber;

      // Generate download link from backend
      toast.info("Generating download link...");
      const linkData = await getFeeDownloadLink(fee.id);

      // Get school info from fee record (works for all roles including superuser)
      const schoolName = fee.school_name || currentUser?.school_name || "School Name";
      const fullName = `${student.first_name} ${student.last_name}`;
      const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthName = monthNames[fee.month];

      // Create WhatsApp message with download link
      const message = `Hello ${student.parent_guardian_name || fullName},

This is a fee receipt notification from *${schoolName}* for *${fullName}*.

📋 *Fee Details:*
📅 Month: ${monthName} ${fee.year}
💰 Amount: ₹${fee.final_amount?.toLocaleString()}
${fee.paid ? '✅ Status: Paid' : '⚠️ Status: Unpaid'}

📥 *Download your receipt here:*
${linkData.download_url}

${fee.paid ? 'Thank you for your payment!' : 'Please make the payment at your earliest convenience.'}

- ${schoolName}`;

      // Generate WhatsApp URL with formatted number (including +91)
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;

      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');

      toast.success("WhatsApp opened with download link!");
    } catch (error) {
      console.error("Error generating WhatsApp link:", error);
      toast.error("Failed to generate WhatsApp link");
    }
  };

  const students = studentsData?.results || [];
  const classrooms = classroomsData?.results || [];

  const formFields: FormField[] = [
    {
      name: "student",
      label: "Student",
      type: "select",
      required: true,
      options: students.map((s) => ({
        value: s.id.toString(),
        label: `${s.first_name} ${s.last_name} (${s.admission_no})`,
      })),
    },
    {
      name: "month",
      label: "Month",
      type: "select",
      required: true,
      options: [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
      ],
    },
    {
      name: "year",
      label: "Year",
      type: "number",
      required: true,
      placeholder: "e.g., 2025",
    },
    {
      name: "academic_year",
      label: "Academic Year",
      type: "text",
      required: true,
      placeholder: "e.g., 2024-2025",
    },
    {
      name: "total_amount",
      label: "Total Amount",
      type: "number",
      required: true,
      placeholder: "Enter total fee amount",
    },
    {
      name: "late_fee",
      label: "Late Fee",
      type: "number",
      required: false,
      placeholder: "Enter late fee (if any)",
    },
    {
      name: "discount",
      label: "Discount",
      type: "number",
      required: false,
      placeholder: "Enter discount (if any)",
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      required: false,
      placeholder: "Additional notes",
    },
  ];

  const markPaidFields: FormField[] = [
    {
      name: "payment_mode",
      label: "Payment Mode",
      type: "select",
      required: true,
      options: [
        { value: "cash", label: "Cash" },
        { value: "online", label: "Online/UPI" },
        { value: "cheque", label: "Cheque" },
        { value: "card", label: "Card" },
        { value: "bank_transfer", label: "Bank Transfer" },
      ],
    },
    {
      name: "transaction_number",
      label: "Transaction Number",
      type: "text",
      required: false,
      placeholder: "Enter transaction/reference number",
    },
  ];

  const generateFeesFields: FormField[] = [
    {
      name: "classroom_id",
      label: "Classroom",
      type: "select",
      required: true,
      options: classrooms.map((c) => ({
        value: c.id.toString(),
        label: `${c.name} - ${c.section}`,
      })),
    },
    {
      name: "month",
      label: "Month",
      type: "select",
      required: true,
      options: [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
      ],
    },
    {
      name: "year",
      label: "Year",
      type: "number",
      required: true,
      placeholder: "e.g., 2025",
    },
    {
      name: "academic_year",
      label: "Academic Year",
      type: "text",
      required: true,
      placeholder: "e.g., 2025-2026",
    },
    {
      name: "tuition",
      label: "Tuition Fee",
      type: "number",
      required: false,
      placeholder: "Enter tuition fee",
    },
    {
      name: "transport",
      label: "Transport Fee",
      type: "number",
      required: false,
      placeholder: "Enter transport fee",
    },
    {
      name: "library",
      label: "Library Fee",
      type: "number",
      required: false,
      placeholder: "Enter library fee",
    },
    {
      name: "lab",
      label: "Lab Fee",
      type: "number",
      required: false,
      placeholder: "Enter lab fee",
    },
    {
      name: "sports",
      label: "Sports Fee",
      type: "number",
      required: false,
      placeholder: "Enter sports fee",
    },
    {
      name: "exam",
      label: "Exam Fee",
      type: "number",
      required: false,
      placeholder: "Enter exam fee",
    },
    {
      name: "late_fee",
      label: "Late Fee",
      type: "number",
      required: false,
      placeholder: "Enter late fee (if any)",
    },
    {
      name: "discount",
      label: "Discount",
      type: "number",
      required: false,
      placeholder: "Enter discount (if any)",
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      required: false,
      placeholder: "Additional notes",
    },
  ];

  if (isLoading) return (
        <DashboardLayout>
          <PageLoader />
        </DashboardLayout>
      );
  if (error) return <EmptyState title="Failed to load fee records" description="Please try again later" />;

  const feeRecords = data?.results || [];
  const totalCount = data?.count || 0;

  const totalPaid = feeRecords
    .filter((f: FeeRecord) => f.paid)
    .reduce((sum: number, f: FeeRecord) => sum + Number(f.final_amount || 0), 0);

  const totalUnpaid = feeRecords
    .filter((f: FeeRecord) => !f.paid)
    .reduce((sum: number, f: FeeRecord) => sum + Number(f.final_amount || 0), 0);

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fee Records</h1>
          <p className="text-muted-foreground">
            Manage student fee records
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsGenerateFeesModalOpen(true)}
            className="border-[#18C3A8] text-[#18C3A8] hover:bg-[#18C3A8] hover:text-white"
          >
            <Zap className="mr-2 h-4 w-4" />
            Generate Fees
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Fee Record
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
          <div className="text-2xl font-bold">
            {feeRecords.filter((f: FeeRecord) => f.paid).length}
          </div>
          <p className="text-sm text-muted-foreground">Paid</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">
            {feeRecords.filter((f: FeeRecord) => !f.paid).length}
          </div>
          <p className="text-sm text-muted-foreground">Unpaid</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">₹{totalPaid.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">Total Collected</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Search by student name..."
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
            variant={filter === "paid" ? "default" : "outline"}
            onClick={() => setFilter("paid")}
            size="sm"
          >
            Paid
          </Button>
          <Button
            variant={filter === "unpaid" ? "default" : "outline"}
            onClick={() => setFilter("unpaid")}
            size="sm"
          >
            Unpaid
          </Button>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-md border px-3 py-1 text-sm"
          >
            <option value="">All Months</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
          <input
            type="number"
            placeholder="Year"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-24 rounded-md border px-3 py-1 text-sm"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={feeRecords}
        pagination={{
          currentPage,
          totalPages: Math.ceil(totalCount / 20),
          pageSize: 20,
          totalItems: totalCount,
          onPageChange: setCurrentPage,
        }}
        actions={(fee: FeeRecord) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadFeeReceipt(fee)}
              title="Download Receipt"
            >
              <Download className="h-4 w-4 text-blue-500" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSendViaWhatsApp(fee)}
              title="Send via WhatsApp"
            >
              <Send className="h-4 w-4 text-green-500" />
            </Button>
            {!fee.paid && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFee(fee);
                    setIsMarkPaidModalOpen(true);
                  }}
                  title="Mark as Paid"
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFee(fee);
                    setIsEditModalOpen(true);
                  }}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedFee(fee);
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
        onClose={() => {
          setIsCreateModalOpen(false);
          setFeeFormData({});
        }}
        onSubmit={handleCreate}
        title="Add New Fee Record"
        description="Create a new fee record for a student"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          handleCreate(feeFormData);
        }} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="student" className="text-sm font-medium">
              Student <span className="text-red-500">*</span>
            </label>
            <select
              id="student"
              value={feeFormData.student || ""}
              onChange={(e) => handleStudentChange(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id.toString()}>
                  {s.first_name} {s.last_name} ({s.admission_no})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="month" className="text-sm font-medium">
              Month <span className="text-red-500">*</span>
            </label>
            <select
              id="month"
              value={feeFormData.month || ""}
              onChange={(e) => setFeeFormData({ ...feeFormData, month: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select...</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="year" className="text-sm font-medium">
              Year <span className="text-red-500">*</span>
            </label>
            <input
              id="year"
              type="number"
              value={feeFormData.year || ""}
              onChange={(e) => setFeeFormData({ ...feeFormData, year: e.target.value })}
              placeholder="e.g., 2025"
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="academic_year" className="text-sm font-medium">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <input
              id="academic_year"
              type="text"
              value={feeFormData.academic_year || ""}
              onChange={(e) => setFeeFormData({ ...feeFormData, academic_year: e.target.value })}
              placeholder="e.g., 2024-2025"
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="total_amount" className="text-sm font-medium">
              Total Amount <span className="text-red-500">*</span>
            </label>
            <input
              id="total_amount"
              type="number"
              value={feeFormData.total_amount || ""}
              onChange={(e) => setFeeFormData({ ...feeFormData, total_amount: e.target.value })}
              placeholder="Enter total fee amount"
              required
              readOnly
              className="w-full px-3 py-2 border rounded-md bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="late_fee" className="text-sm font-medium">
              Late Fee
            </label>
            <input
              id="late_fee"
              type="number"
              value={feeFormData.late_fee || ""}
              onChange={(e) => setFeeFormData({ ...feeFormData, late_fee: e.target.value })}
              placeholder="Enter late fee (if any)"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="discount" className="text-sm font-medium">
              Discount
            </label>
            <input
              id="discount"
              type="number"
              value={feeFormData.discount || ""}
              onChange={(e) => setFeeFormData({ ...feeFormData, discount: e.target.value })}
              placeholder="Enter discount (if any)"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              value={feeFormData.notes || ""}
              onChange={(e) => setFeeFormData({ ...feeFormData, notes: e.target.value })}
              placeholder="Additional notes"
              className="w-full px-3 py-2 border rounded-md min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setFeeFormData({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedFee(null);
        }}
        onSubmit={handleEdit}
        title="Edit Fee Record"
        description="Update fee record information"
        fields={formFields}
        initialData={selectedFee || undefined}
      />

      {/* Mark Paid Modal */}
      <FormModal
        isOpen={isMarkPaidModalOpen}
        onClose={() => {
          setIsMarkPaidModalOpen(false);
          setSelectedFee(null);
        }}
        onSubmit={handleMarkPaid}
        title="Mark Fee as Paid"
        description={`Mark fee record for ${selectedFee?.student_name} as paid`}
        fields={markPaidFields}
      />

      {/* Generate Fees Modal */}
      <FormModal
        isOpen={isGenerateFeesModalOpen}
        onClose={() => setIsGenerateFeesModalOpen(false)}
        onSubmit={handleGenerateFees}
        title="Generate Monthly Fees"
        description="Generate fee records for all students in a classroom"
        fields={generateFeesFields}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedFee(null);
        }}
        onConfirm={handleDelete}
        title="Delete Fee Record"
        description={`Are you sure you want to delete this fee record for "${selectedFee?.student_name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
    </DashboardLayout>
  );
}
