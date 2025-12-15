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
import { toast } from "sonner";
import {
  listSalaryRecords,
  createSalaryRecord,
  updateSalaryRecord,
  deleteSalaryRecord,
  listPaidSalaryRecords,
  listUnpaidSalaryRecords,
  markSalaryAsPaid,
  generateMonthlySalaries,
  getSalaryDownloadLink,
} from "@/lib/api/salary-records";
import { listStaff } from "@/lib/api/staff";
import { getUserProfile } from "@/lib/api/auth";
import { SalaryRecord } from "@/types";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageLoader } from "@/components/ui/loading-spinner";
import { pdf } from '@react-pdf/renderer';
import { SalarySlipPDF } from '@/components/pdf';

type FilterType = "all" | "paid" | "unpaid";

export default function SalaryRecordsPage() {
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
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<SalaryRecord | null>(null);
  const [salaryFormData, setSalaryFormData] = useState<any>({});

  // Fetch current user for school info
  const { data: currentUser } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
  });

  // Fetch salary records based on filter
  const { data, isLoading, error } = useQuery({
    queryKey: ["salary-records", currentPage, search, filter, monthFilter, yearFilter],
    queryFn: async () => {
      const params: any = { page: currentPage, page_size: 20, search };
      
      if (monthFilter) params.month = monthFilter;
      if (yearFilter) params.year = yearFilter;

      if (filter === "paid") {
        return await listPaidSalaryRecords(params);
      } else if (filter === "unpaid") {
        return await listUnpaidSalaryRecords(params);
      } else {
        return await listSalaryRecords(params);
      }
    },
  });

  // Fetch staff for dropdown
  const { data: staffData } = useQuery({
    queryKey: ["staff-list"],
    queryFn: () => listStaff({ page_size: 1000 }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createSalaryRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-records"] });
      toast.success("Salary record created successfully!");
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create salary record");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateSalaryRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-records"] });
      toast.success("Salary record updated successfully!");
      setIsEditModalOpen(false);
      setSelectedSalary(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update salary record");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSalaryRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-records"] });
      toast.success("Salary record deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedSalary(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete salary record");
    },
  });

  // Mark paid mutation
  const markPaidMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      markSalaryAsPaid(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-records"] });
      toast.success("Salary marked as paid successfully!");
      setIsMarkPaidModalOpen(false);
      setSelectedSalary(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to mark salary as paid");
    },
  });

  // Generate monthly salaries mutation
  const generateMutation = useMutation({
    mutationFn: generateMonthlySalaries,
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["salary-records"] });
      toast.success(response.message || "Monthly salaries generated successfully!");
      setIsGenerateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to generate monthly salaries");
    },
  });

  const columns = [
    {
      key: "staff_name",
      label: "Staff",
    },
    {
      key: "month",
      label: "Month",
      render: (salary: SalaryRecord) => {
        const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months[salary.month];
      },
    },
    {
      key: "year",
      label: "Year",
    },
    {
      key: "base_salary",
      label: "Base Salary",
      render: (salary: SalaryRecord) => `₹${salary.base_salary?.toLocaleString() || 0}`,
    },
    {
      key: "net_salary",
      label: "Net Salary",
      render: (salary: SalaryRecord) => `₹${salary.net_salary?.toLocaleString() || 0}`,
    },
    {
      key: "paid",
      label: "Status",
      render: (salary: SalaryRecord) => (
        <StatusBadge
          status={salary.paid ? "paid" : "unpaid"}
          type="payment"
        />
      ),
    },
    {
      key: "paid_on",
      label: "Paid On",
      render: (salary: SalaryRecord) =>
        salary.paid_on ? new Date(salary.paid_on).toLocaleDateString() : "-",
    },
  ];

  const handleCreate = (data: any) => {
    createMutation.mutate(data);
  };

  const handleStaffChange = (staffId: string) => {
    const staffMember = staff.find(s => s.id.toString() === staffId);
    if (staffMember && staffMember.total_amount) {
      // Divide annual salary by 12 to get monthly amount
      const monthlyAmount = (parseFloat(staffMember.total_amount) / 12).toFixed(2);
      setSalaryFormData((prev: any) => ({
        ...prev,
        staff: staffId,
        base_salary: monthlyAmount,
      }));
    } else if (staffMember && staffMember.monthly_salary) {
      setSalaryFormData((prev: any) => ({
        ...prev,
        staff: staffId,
        base_salary: staffMember.monthly_salary,
      }));
    } else {
      setSalaryFormData((prev: any) => ({
        ...prev,
        staff: staffId,
      }));
    }
  };

  const handleEdit = (data: any) => {
    if (selectedSalary) {
      updateMutation.mutate({ id: selectedSalary.id, data });
    }
  };

  const handleDelete = () => {
    if (selectedSalary) {
      deleteMutation.mutate(selectedSalary.id);
    }
  };

  const handleMarkPaid = (data: any) => {
    if (selectedSalary) {
      // Add transaction number to notes if provided
      const updatedData = { ...data };
      if (data.transaction_number) {
        const existingNotes = selectedSalary.notes || '';
        const transactionNote = `Transaction #: ${data.transaction_number}`;
        updatedData.notes = existingNotes 
          ? `${existingNotes}\n${transactionNote}` 
          : transactionNote;
        delete updatedData.transaction_number; // Remove from data as it's in notes now
      }
      markPaidMutation.mutate({ id: selectedSalary.id, data: updatedData });
    }
  };

  const handleGenerate = (data: any) => {
    generateMutation.mutate(data);
  };

  // Download Salary Slip PDF
  const handleDownloadSalarySlip = async (salary: SalaryRecord) => {
    try {
      const staffMember = staff.find(s => s.id === salary.staff);
      if (!staffMember) {
        toast.error("Staff data not available");
        return;
      }

      // Get school info from salary record (works for all roles including superuser)
      const schoolName = salary.school_name || currentUser?.school_name || "School Name";
      const schoolLogoUrl = salary.school_logo_url || currentUser?.school_logo_url;
      const schoolEmail = salary.school_email || currentUser?.school_email;
      const schoolMobile = salary.school_mobile || currentUser?.school_mobile;

      const doc = <SalarySlipPDF 
        salaryRecord={salary}
        schoolName={schoolName}
        staffName={staffMember.name}
        designation={staffMember.designation}
        employeeId={staffMember.id.toString()}
        schoolLogoUrl={schoolLogoUrl}
        schoolEmail={schoolEmail}
        schoolMobile={schoolMobile}
      />;

      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Salary_Slip_${staffMember.name}_${salary.month}_${salary.year}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Salary slip downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download salary slip");
    }
  };

  // Generate WhatsApp link with PDF download
  const handleSendViaWhatsApp = async (salary: SalaryRecord) => {
    try {
      const staffMember = staff.find(s => s.id === salary.staff);
      if (!staffMember) {
        toast.error("Staff data not available");
        return;
      }

      // Clean phone number (remove spaces, dashes, etc.)
      const phoneNumber = staffMember.mobile?.replace(/\D/g, '');
      if (!phoneNumber) {
        toast.error("Staff mobile number not available");
        return;
      }

      // Prepend 91 if not already present (check for 10-digit or 12-digit with country code)
      const formattedNumber = phoneNumber.length === 10 ? `91${phoneNumber}` : phoneNumber;

      // Generate download link from backend
      toast.info("Generating download link...");
      const linkData = await getSalaryDownloadLink(salary.id);

      // Get school info from salary record (works for all roles including superuser)
      const schoolName = salary.school_name || currentUser?.school_name || "School Name";
      const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthName = monthNames[salary.month];

      // Create WhatsApp message with download link
      const message = `Hello ${staffMember.name},

This is your salary slip notification from *${schoolName}*.

💼 *Salary Details:*
📅 Month: ${monthName} ${salary.year}
💰 Net Salary: ₹${salary.net_salary?.toLocaleString()}
${salary.paid ? '✅ Status: Paid' : '⏳ Status: Pending'}

📥 *Download your salary slip here:*
${linkData.download_url}

${salary.paid ? 'Salary has been credited to your account.' : 'Salary will be processed soon.'}

- ${schoolName}`;

      // Generate WhatsApp URL with formatted number (including country code 91)
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;

      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');

      toast.success("WhatsApp opened with download link!");
    } catch (error) {
      console.error("Error generating WhatsApp link:", error);
      toast.error("Failed to generate WhatsApp link");
    }
  };

  const staff = staffData?.results || [];

  const formFields: FormField[] = [
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
      name: "base_salary",
      label: "Base Salary",
      type: "number",
      required: true,
      placeholder: "Enter base salary",
    },
    {
      name: "bonuses",
      label: "Bonuses",
      type: "number",
      required: false,
      placeholder: "Enter bonuses (if any)",
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

  const generateFields: FormField[] = [
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
  ];

  if (isLoading) return (
        <DashboardLayout>
          <PageLoader />
        </DashboardLayout>
      );
  if (error) return <EmptyState title="Failed to load salary records" description="Please try again later" />;

  const salaryRecords = data?.results || [];
  const totalCount = data?.count || 0;

  const totalPaid = salaryRecords
    .filter((s: SalaryRecord) => s.paid)
    .reduce((sum: number, s: SalaryRecord) => sum + Number(s.net_salary || 0), 0);

  const totalUnpaid = salaryRecords
    .filter((s: SalaryRecord) => !s.paid)
    .reduce((sum: number, s: SalaryRecord) => sum + Number(s.net_salary || 0), 0);

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Salary Records</h1>
          <p className="text-muted-foreground">
            Manage staff salary records
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsGenerateModalOpen(true)} variant="outline">
            <Zap className="mr-2 h-4 w-4" />
            Generate Monthly
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Salary Record
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
            {salaryRecords.filter((s: SalaryRecord) => s.paid).length}
          </div>
          <p className="text-sm text-muted-foreground">Paid</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">
            {salaryRecords.filter((s: SalaryRecord) => !s.paid).length}
          </div>
          <p className="text-sm text-muted-foreground">Unpaid</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">₹{totalPaid.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">Total Paid</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Search by staff name..."
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
        data={salaryRecords}
        pagination={{
          currentPage,
          totalPages: Math.ceil(totalCount / 20),
          pageSize: 20,
          totalItems: totalCount,
          onPageChange: setCurrentPage,
        }}
        actions={(salary: SalaryRecord) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadSalarySlip(salary)}
              title="Download Salary Slip"
            >
              <Download className="h-4 w-4 text-blue-500" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSendViaWhatsApp(salary)}
              title="Send via WhatsApp"
            >
              <Send className="h-4 w-4 text-green-500" />
            </Button>
            {!salary.paid && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSalary(salary);
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
                    setSelectedSalary(salary);
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
                setSelectedSalary(salary);
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
          setSalaryFormData({});
        }}
        onSubmit={handleCreate}
        title="Add New Salary Record"
        description="Create a new salary record for a staff member"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          handleCreate(salaryFormData);
        }} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="staff" className="text-sm font-medium">
              Staff Member <span className="text-red-500">*</span>
            </label>
            <select
              id="staff"
              value={salaryFormData.staff || ""}
              onChange={(e) => handleStaffChange(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select...</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id.toString()}>
                  {s.name} ({s.designation})
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
              value={salaryFormData.month || ""}
              onChange={(e) => setSalaryFormData({ ...salaryFormData, month: e.target.value })}
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
              value={salaryFormData.year || ""}
              onChange={(e) => setSalaryFormData({ ...salaryFormData, year: e.target.value })}
              placeholder="e.g., 2025"
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="base_salary" className="text-sm font-medium">
              Base Salary <span className="text-red-500">*</span>
            </label>
            <input
              id="base_salary"
              type="number"
              value={salaryFormData.base_salary || ""}
              onChange={(e) => setSalaryFormData({ ...salaryFormData, base_salary: e.target.value })}
              placeholder="Enter base salary"
              required
              readOnly
              className="w-full px-3 py-2 border rounded-md bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bonuses" className="text-sm font-medium">
              Bonuses
            </label>
            <input
              id="bonuses"
              type="number"
              value={salaryFormData.bonuses || ""}
              onChange={(e) => setSalaryFormData({ ...salaryFormData, bonuses: e.target.value })}
              placeholder="Enter bonuses (if any)"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              value={salaryFormData.notes || ""}
              onChange={(e) => setSalaryFormData({ ...salaryFormData, notes: e.target.value })}
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
                setSalaryFormData({});
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
          setSelectedSalary(null);
        }}
        onSubmit={handleEdit}
        title="Edit Salary Record"
        description="Update salary record information"
        fields={formFields}
        initialData={selectedSalary || undefined}
      />

      {/* Mark Paid Modal */}
      <FormModal
        isOpen={isMarkPaidModalOpen}
        onClose={() => {
          setIsMarkPaidModalOpen(false);
          setSelectedSalary(null);
        }}
        onSubmit={handleMarkPaid}
        title="Mark Salary as Paid"
        description={`Mark salary record for ${selectedSalary?.staff_name} as paid`}
        fields={markPaidFields}
      />

      {/* Generate Monthly Salaries Modal */}
      <FormModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onSubmit={handleGenerate}
        title="Generate Monthly Salaries"
        description="Generate salary records for all active staff members for the selected month"
        fields={generateFields}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedSalary(null);
        }}
        onConfirm={handleDelete}
        title="Delete Salary Record"
        description={`Are you sure you want to delete this salary record for "${selectedSalary?.staff_name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
    </DashboardLayout>
  );
}
