"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, User, Phone, Calendar, Briefcase, Wallet, Building2, Shield, CreditCard, CalendarCheck, TrendingUp, DollarSign, Clock, CheckCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormModal, FormField } from "@/components/form-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { getStaff, updateStaff } from "@/lib/api/staff";
import { listSalaryRecords } from "@/lib/api/salary-records";
import { listAttendanceRecords } from "@/lib/api/attendance";
import { getUserProfile } from "@/lib/api/auth";
import { Staff } from "@/types";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Link from "next/link";
import { pdf } from '@react-pdf/renderer';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';
import { SalarySlipPDF, StaffIDStyle1, StaffIDStyle2 } from '@/components/pdf';

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const staffId = parseInt(params.id as string);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch current user to check role
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
  });

  useEffect(() => {
    if (userProfile) {
      setCurrentUser(userProfile);
    }
  }, [userProfile]);

  // Fetch staff details
  const { data: staff, isLoading, error } = useQuery({
    queryKey: ["staff", staffId],
    queryFn: () => getStaff(staffId),
    enabled: !!staffId,
  });

  // Fetch staff's salary records
  const { data: salaryRecordsData } = useQuery({
    queryKey: ["staff-salary", staffId],
    queryFn: () => listSalaryRecords({ staff: staffId, page_size: 10, ordering: '-year,-month' }),
    enabled: !!staffId,
  });

  // Fetch staff's attendance records
  const { data: attendanceRecordsData } = useQuery({
    queryKey: ["staff-attendance", staffId],
    queryFn: () => listAttendanceRecords({ staff: staffId, page_size: 10, ordering: '-date' }),
    enabled: !!staffId,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateStaff(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      toast.success("Staff updated successfully!");
      setIsEditModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update staff");
    },
  });

  const handleEdit = (data: any) => {
    updateMutation.mutate(data);
  };

  // Download PDF function
  const handleDownloadSalarySlip = async (salaryRecord: any) => {
    try {
      if (!staff) {
        toast.error("Staff data not available");
        return;
      }
      
      // Get school info from salary record (works for all roles)
      const schoolName = salaryRecord.school_name || currentUser?.school_name || "School Name";
      const schoolLogoUrl = salaryRecord.school_logo_url || currentUser?.school_logo_url;
      const schoolEmail = salaryRecord.school_email || currentUser?.school_email;
      const schoolMobile = salaryRecord.school_mobile || currentUser?.school_mobile;
      const staffName = staff.name;

      const empIdForSlip = (staff as any).employee_id ?? staff.id?.toString();

      const doc = <SalarySlipPDF 
        salaryRecord={salaryRecord}
        schoolName={schoolName}
        staffName={staffName}
        designation={staff.designation}
        employeeId={empIdForSlip}
        schoolLogoUrl={schoolLogoUrl}
        schoolEmail={schoolEmail}
        schoolMobile={schoolMobile}
      />;
      
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Salary_Slip_${staffName.replace(/\s+/g, '_')}_${salaryRecord.month}_${salaryRecord.year}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("Salary slip downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download salary slip");
    }
  };

  const handleDownloadID = async (style: 1 | 2) => {
    try {
      if (!staff) {
        toast.error('Staff data not available');
        return;
      }

      const schoolName = currentUser?.school_name || staff.school_name || 'School Name';
      const schoolLogoUrl = currentUser?.school_logo_url || undefined;
      const schoolEmail = currentUser?.school_email || undefined;
      const schoolMobile = currentUser?.school_mobile || undefined;
      const schoolAddress = currentUser?.school_address || undefined;

      const schoolObj = {
        name: schoolName,
        logo_url: schoolLogoUrl,
        email: schoolEmail,
        mobile: schoolMobile,
        address: schoolAddress,
      };

      const staffObj = {
        name: staff.name,
        designation: staff.designation,
        joining_date: staff.joining_date,
        profile_picture_url: staff.profile_picture_url || null,
        id: ((staff as any).employee_id ?? staff.id?.toString()) || null,
        mobile: staff.mobile || null,
      };

      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Render the ID card component
      const root = createRoot(container);
      const IDComponent = style === 1 ? StaffIDStyle1 : StaffIDStyle2;
      
      await new Promise<void>((resolve) => {
        root.render(<IDComponent staff={staffObj} school={schoolObj} />);
        setTimeout(resolve, 100); // Wait for render
      });

      // Convert to canvas and download
      const canvas = await html2canvas(container.firstChild as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: false,
        logging: true,
        imageTimeout: 15000,
      });

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ID_${staff.name.replace(/\s+/g, '_')}_style${style}.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('ID card downloaded successfully!');
        }
        
        // Cleanup
        root.unmount();
        document.body.removeChild(container);
      }, 'image/png');

    } catch (error) {
      console.error('Error generating staff ID image:', error);
      toast.error('Failed to download ID card');
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
      placeholder: "e.g., Teacher, Principal, Accountant",
    },
    {
      name: "qualifications",
      label: "Qualifications",
      type: "text",
      required: true,
      placeholder: "e.g., B.Ed, M.A., Ph.D",
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
      name: "employment_status",
      label: "Employment Status",
      type: "select",
      required: true,
      options: [
        { value: "active", label: "Active" },
        { value: "resigned", label: "Resigned" },
      ],
    },
    {
      name: "monthly_salary",
      label: "Monthly Salary",
      type: "text",
      required: true,
      placeholder: "Enter monthly salary",
    },
    {
      name: "bank_account_no",
      label: "Bank Account Number",
      type: "text",
      required: true,
      placeholder: "Enter account number",
    },
    {
      name: "bank_name",
      label: "Bank Name",
      type: "text",
      required: true,
      placeholder: "Enter bank name",
    },
    {
      name: "ifsc_code",
      label: "IFSC Code",
      type: "text",
      required: true,
      placeholder: "e.g., SBIN0001234",
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  if (error || !staff) {
    return (
      <DashboardLayout>
        <EmptyState 
          title="Staff not found" 
          description="The staff member you're looking for doesn't exist or you don't have permission to view it." 
        />
      </DashboardLayout>
    );
  }

  const isSchoolAdmin = currentUser?.role === "school_admin";
  const canEdit = isSchoolAdmin;

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  // Get initials safely
  const getInitials = (name: string) => {
    if (!name) return 'ST';
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {staff.name}
              </h1>
              <p className="text-muted-foreground">
                {staff.designation}
              </p>
              <p className="text-sm text-muted-foreground">
                Employee ID: {(staff as any).employee_id || staff.id}
              </p>
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsEditModalOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Details
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownloadID(1)} title="Download ID - Style 1">
                <Download className="mr-2 h-4 w-4" />
                ID Style 1
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownloadID(2)} title="Download ID - Style 2">
                <Download className="mr-2 h-4 w-4" />
                ID Style 2
              </Button>
            </div>
          )}
        </div>

        {/* Status Card */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                style={{ background: 'linear-gradient(to bottom right, #223E97, #18C3A8)' }}
              >
                {staff.profile_picture_url ? (
                  <img
                    src={staff.profile_picture_url}
                    alt={staff.name}
                    className="w-20 h-20 rounded-full object-cover shadow-sm ring-1 ring-border"
                  />
                ) : (
                  getInitials(staff.name)
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {staff.name}
                </h2>
                <p className="text-muted-foreground">
                  {staff.designation}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {staff.employment_status && (
                <StatusBadge 
                  status={staff.employment_status} 
                  type="employment"
                />
              )}
              {staff.has_user_account && (
                <StatusBadge 
                  status="active" 
                  type="enrollment"
                />
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" style={{ color: '#223E97' }} />
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-base font-medium">{staff.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Designation</label>
                <p className="text-base font-medium">{staff.designation}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Qualifications</label>
                <p className="text-base font-medium">{staff.qualifications}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                <p className="text-base font-medium">{staff.mobile}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" style={{ color: '#18C3A8' }} />
              Employment Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Joining Date</label>
                <p className="text-base font-medium">{formatDate(staff.joining_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employment Status</label>
                <div className="mt-1">
                  <StatusBadge status={staff.employment_status} type="employment" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Monthly Salary</label>
                <p className="text-base font-medium">{formatCurrency(staff.monthly_salary)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Banking Information - Only visible to school admin */}
        {canEdit && (
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" style={{ color: '#3EB489' }} />
              Banking Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                <p className="text-base font-medium">{staff.bank_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                <p className="text-base font-medium font-mono">{staff.bank_account_no}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">IFSC Code</label>
                <p className="text-base font-medium font-mono">{staff.ifsc_code}</p>
              </div>
            </div>
          </div>
        )}

        {/* Account Information */}
        {staff.has_user_account && (
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: '#18C3A8' }} />
              Login Account
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                This staff member has an active login account and can access the staff portal.
              </p>
              <div className="flex items-center gap-2">
                <StatusBadge status="active" type="employment" />
              </div>
            </div>
          </div>
        )}

        {/* Activity Log */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: '#3EB489' }} />
            Activity Log
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Joined</span>
              <span className="text-sm font-medium">{formatDate(staff.joining_date)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm font-medium">{formatDate(staff.created_at)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm font-medium">{formatDate(staff.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Salary Information */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Wallet className="w-5 h-5" style={{ color: '#223E97' }} />
              Salary Information
            </h3>
            {currentUser?.role === 'staff' && currentUser?.linked_staff === staffId && (
              <Link href="/dashboard/staff/my-salary">
                <Button variant="outline" size="sm">
                  View All Salary
                </Button>
              </Link>
            )}
          </div>

          {salaryRecordsData && salaryRecordsData.results.length > 0 ? (
            <>
              {/* Salary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 62, 151, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4" style={{ color: '#223E97' }} />
                    <span className="text-xs font-medium text-muted-foreground">Total Records</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#223E97' }}>
                    {salaryRecordsData.count}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(62, 180, 137, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" style={{ color: '#3EB489' }} />
                    <span className="text-xs font-medium text-muted-foreground">Paid</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#3EB489' }}>
                    {salaryRecordsData.results.filter(s => s.paid).length}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" style={{ color: '#ef4444' }} />
                    <span className="text-xs font-medium text-muted-foreground">Pending</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                    {salaryRecordsData.results.filter(s => !s.paid).length}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(24, 195, 168, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4" style={{ color: '#18C3A8' }} />
                    <span className="text-xs font-medium text-muted-foreground">Total Earned</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#18C3A8' }}>
                    ₹{salaryRecordsData.results.filter(s => s.paid).reduce((sum, s) => sum + parseFloat(s.net_salary || '0'), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {/* Recent Salary Records */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Recent Salary Records</h4>
                <div className="space-y-4">
                  {salaryRecordsData.results.slice(0, 5).map((salary) => {
                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const baseSalary = parseFloat(salary.base_salary || '0');
                    const bonuses = parseFloat(salary.bonuses || '0');
                    const netSalary = parseFloat(salary.net_salary || '0');
                    
                    // Calculate totals
                    const allowances = salary.allowances || {};
                    const totalAllowances = Object.values(allowances).reduce(
                      (sum, val) => sum + parseFloat(String(val) || '0'),
                      0
                    );
                    const deductions = salary.deductions || {};
                    const totalDeductions = Object.values(deductions).reduce(
                      (sum, val) => sum + parseFloat(String(val) || '0'),
                      0
                    );
                    const grossEarnings = baseSalary + totalAllowances + bonuses;
                    
                    return (
                      <div key={salary.id} className="rounded-lg border bg-background p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b">
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-lg">
                              {monthNames[salary.month - 1]} {salary.year}
                            </div>
                            <StatusBadge status={salary.paid ? "paid" : "unpaid"} type="payment" />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadSalarySlip(salary)}
                            title="Download Salary Slip"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          {/* Earnings Section */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Earnings</p>
                            <div className="space-y-2">
                              {/* Basic Salary */}
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Basic Salary:</span>
                                <span className="font-medium">₹{baseSalary.toLocaleString('en-IN')}</span>
                              </div>
                              
                              {/* Allowances */}
                              {Object.entries(allowances).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground capitalize">{key}:</span>
                                  <span className="font-medium">₹{parseFloat(String(value)).toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                              
                              {/* Bonuses */}
                              {bonuses > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Bonus:</span>
                                  <span className="font-medium">₹{bonuses.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              
                              {/* Gross Earnings */}
                              <div className="flex justify-between items-center text-sm pt-2 border-t">
                                <span className="font-semibold">Gross Earnings:</span>
                                <span className="font-bold text-green-600">₹{grossEarnings.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Deductions Section */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Deductions</p>
                            <div className="space-y-2">
                              {Object.keys(deductions).length > 0 ? (
                                <>
                                  {Object.entries(deductions).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center text-sm">
                                      <span className="text-muted-foreground capitalize">{key}:</span>
                                      <span className="font-medium text-red-600">₹{parseFloat(String(value)).toLocaleString('en-IN')}</span>
                                    </div>
                                  ))}
                                  
                                  {/* Total Deductions */}
                                  <div className="flex justify-between items-center text-sm pt-2 border-t">
                                    <span className="font-semibold">Total Deductions:</span>
                                    <span className="font-bold text-red-600">₹{totalDeductions.toLocaleString('en-IN')}</span>
                                  </div>
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No deductions</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Net Salary */}
                        <div className="flex justify-between items-center pt-3 mt-3 border-t-2">
                          <span className="font-bold text-base">Net Salary:</span>
                          <span className="font-bold text-xl" style={{ color: '#223E97' }}>
                            ₹{netSalary.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Footer Info */}
                        {salary.paid && salary.paid_on && (
                          <div className="text-xs text-muted-foreground pt-2 mt-2 border-t text-right">
                            Paid on {formatDate(salary.paid_on)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {salaryRecordsData.count > 5 && (
                  <div className="mt-4 text-center">
                    {currentUser?.role === 'school_admin' ? (
                      <Link href="/dashboard/school-admin/salary">
                        <Button variant="outline" size="sm">
                          View All {salaryRecordsData.count} Salary Records
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/dashboard/staff/my-salary">
                        <Button variant="outline" size="sm">
                          View All {salaryRecordsData.count} Salary Records
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground" style={{ opacity: 0.3 }} />
              <p className="text-sm text-muted-foreground">No salary records found for this staff member</p>
            </div>
          )}
        </div>

        {/* Attendance Information */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CalendarCheck className="w-5 h-5" style={{ color: '#18C3A8' }} />
              Attendance Information
            </h3>
            {currentUser?.role === 'staff' && currentUser?.linked_staff === staffId && (
              <Link href="/dashboard/staff/my-attendance">
                <Button variant="outline" size="sm">
                  View All Attendance
                </Button>
              </Link>
            )}
          </div>

          {attendanceRecordsData && attendanceRecordsData.results.length > 0 ? (
            <>
              {/* Attendance Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 62, 151, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarCheck className="w-4 h-4" style={{ color: '#223E97' }} />
                    <span className="text-xs font-medium text-muted-foreground">Total Days</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#223E97' }}>
                    {attendanceRecordsData.count}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(62, 180, 137, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" style={{ color: '#3EB489' }} />
                    <span className="text-xs font-medium text-muted-foreground">Present</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#3EB489' }}>
                    {attendanceRecordsData.results.filter(a => a.status === 'present').length}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" style={{ color: '#ef4444' }} />
                    <span className="text-xs font-medium text-muted-foreground">Absent</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                    {attendanceRecordsData.results.filter(a => a.status === 'absent').length}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" style={{ color: '#3b82f6' }} />
                    <span className="text-xs font-medium text-muted-foreground">Leave</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
                    {attendanceRecordsData.results.filter(a => a.status === 'leave').length}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(24, 195, 168, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4" style={{ color: '#18C3A8' }} />
                    <span className="text-xs font-medium text-muted-foreground">Attendance Rate</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#18C3A8' }}>
                    {attendanceRecordsData.results.length > 0 ? Math.round((attendanceRecordsData.results.filter(a => a.status === 'present').length / attendanceRecordsData.results.length) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Recent Attendance Records */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Recent Attendance Records</h4>
                <div className="space-y-3">
                  {attendanceRecordsData.results.slice(0, 5).map((attendance) => {
                    return (
                      <div key={attendance.id} className="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="font-medium">
                              {formatDate(attendance.date)}
                            </div>
                            <StatusBadge status={attendance.status} type="attendance" />
                          </div>
                          {attendance.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {attendance.notes}
                            </p>
                          )}
                        </div>
                        {attendance.hours_worked && (
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {attendance.hours_worked}h
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Hours worked
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {attendanceRecordsData.count > 5 && (
                  <div className="mt-4 text-center">
                    {currentUser?.role === 'school_admin' ? (
                      <Link href="/dashboard/school-admin/attendance">
                        <Button variant="outline" size="sm">
                          View All {attendanceRecordsData.count} Attendance Records
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/dashboard/staff/my-attendance">
                        <Button variant="outline" size="sm">
                          View All {attendanceRecordsData.count} Attendance Records
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <CalendarCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground" style={{ opacity: 0.3 }} />
              <p className="text-sm text-muted-foreground">No attendance records found for this staff member</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {canEdit && (
        <FormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEdit}
          title="Edit Staff"
          description="Update staff member information"
          fields={formFields}
          initialData={staff}
        />
      )}
    </DashboardLayout>
  );
}
