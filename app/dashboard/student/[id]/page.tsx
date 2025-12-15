"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, User, Phone, Calendar, MapPin, Users, GraduationCap, Shield, Receipt, TrendingUp, DollarSign, AlertCircle, Download, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormModal, FormField } from "@/components/form-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { getStudent, updateStudent } from "@/lib/api/students";
import { listClassRooms } from "@/lib/api/classrooms";
import { listFeeRecords } from "@/lib/api/fee-records";
import { listAttendanceRecords } from "@/lib/api/attendance";
import { getUserProfile } from "@/lib/api/auth";
import { Student } from "@/types";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Link from "next/link";
import { pdf } from '@react-pdf/renderer';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';
import { FeeReceiptPDF, StudentIDStyle1, StudentIDStyle2 } from '@/components/pdf';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const studentId = parseInt(params.id as string);
  
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

  // Fetch student details
  const { data: student, isLoading, error } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => getStudent(studentId),
    enabled: !!studentId,
  });

  // Fetch classrooms for edit modal
  const { data: classroomsData } = useQuery({
    queryKey: ["classrooms-list"],
    queryFn: () => listClassRooms({ page_size: 100 }),
  });

  // Fetch student's fee records
  const { data: feeRecordsData } = useQuery({
    queryKey: ["student-fees", studentId],
    queryFn: () => listFeeRecords({ student: studentId, page_size: 10, ordering: '-year,-month' }),
    enabled: !!studentId,
  });

  // Fetch student's attendance records
  const { data: attendanceData } = useQuery({
    queryKey: ["student-attendance", studentId],
    queryFn: () => listAttendanceRecords({ student: studentId, page_size: 30, ordering: '-date' }),
    enabled: !!studentId,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateStudent(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      toast.success("Student updated successfully!");
      setIsEditModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update student");
    },
  });

  const handleEdit = (data: any) => {
    updateMutation.mutate(data);
  };

  // Download PDF function
  const handleDownloadFeeReceipt = async (feeRecord: any) => {
    try {
      if (!student) {
        toast.error("Student data not available");
        return;
      }
      
      // Get school info from fee record (works for all roles)
      const schoolName = feeRecord.school_name || currentUser?.school_name || "School Name";
      const schoolLogoUrl = feeRecord.school_logo_url || currentUser?.school_logo_url;
      const schoolEmail = feeRecord.school_email || currentUser?.school_email;
      const schoolMobile = feeRecord.school_mobile || currentUser?.school_mobile;
      const fullName = `${student.first_name} ${student.last_name}`;
      const className = student.classroom_name || "";
      
      const doc = <FeeReceiptPDF 
        feeRecord={feeRecord}
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
      link.download = `Fee_Receipt_${fullName}_${feeRecord.month}_${feeRecord.year}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("Fee receipt downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download fee receipt");
    }
  };

  const handleDownloadID = async (style: 1 | 2) => {
    try {
      if (!student) {
        toast.error('Student data not available');
        return;
      }

      const schoolName = currentUser?.school_name || student.school_name || 'School Name';
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

      const studentObj = {
        first_name: student.first_name,
        last_name: student.last_name,
        admission_no: student.admission_no,
        classroom_name: student.classroom_name,
        profile_picture_url: student.profile_picture_url || null,
        mobile: student.mobile || null,
        address: student.address || null,
      };

      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Render the ID card component
      const root = createRoot(container);
      const IDComponent = style === 1 ? StudentIDStyle1 : StudentIDStyle2;
      
      await new Promise<void>((resolve) => {
        root.render(<IDComponent student={studentObj} school={schoolObj} />);
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
          link.download = `ID_${student.first_name}_${student.last_name}_style${style}.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('ID card downloaded successfully!');
        }
        
        // Cleanup
        root.unmount();
        document.body.removeChild(container);
      }, 'image/png');

    } catch (error) {
      console.error('Error generating ID image:', error);
      toast.error('Failed to download ID card');
    }
  };

  const classrooms = classroomsData?.results || [];

  const formFields: FormField[] = [
    {
      name: "admission_no",
      label: "Admission Number",
      type: "text",
      required: true,
      placeholder: "e.g., 2025001",
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
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  if (error || !student) {
    return (
      <DashboardLayout>
        <EmptyState 
          title="Student not found" 
          description="The student you're looking for doesn't exist or you don't have permission to view it." 
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

  // Calculate age
  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-muted-foreground">
                Admission No: {student.admission_no}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button onClick={() => setIsEditModalOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Details
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => handleDownloadID(1)} title="Download ID - Style 1">
              <Download className="mr-2 h-4 w-4" />
              ID Style 1
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownloadID(2)} title="Download ID - Style 2">
              <Download className="mr-2 h-4 w-4" />
              ID Style 2
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {student.profile_picture_url ? (
                <img
                  src={student.profile_picture_url}
                  alt={`${student.first_name} ${student.last_name}`}
                  className="w-20 h-20 rounded-full object-cover shadow-sm ring-1 ring-border"
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                  style={{ background: 'linear-gradient(to bottom right, #223E97, #18C3A8)' }}
                >
                  {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">
                  {student.first_name} {student.last_name}
                </h2>
                <p className="text-muted-foreground">
                  {student.classroom_name || 'No Class Assigned'}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 items-end">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={student.enrollment_status} type="enrollment" />
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={student.has_user_account ? "active" : "inactive"}
                    type="enrollment"
                  />
                  <span className="text-sm text-muted-foreground">
                    {student.has_user_account ? "Has Account" : "No Account"}
                  </span>
                </div>
              </div>
              
              {/* School Info */}
              {currentUser?.school_name && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-gradient-to-br from-background/50 to-background shadow-sm">
                  {currentUser?.school_logo_url ? (
                    <img
                      src={currentUser.school_logo_url}
                      alt={currentUser.school_name}
                      className="w-10 h-10 rounded-lg object-cover shadow-sm ring-1 ring-border"
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #223E97, #18C3A8)' }}
                    >
                      {currentUser.school_name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-medium text-muted-foreground">
                    {currentUser.school_name}
                  </span>
                </div>
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
                <p className="text-base font-medium">{student.first_name} {student.last_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gender</label>
                <p className="text-base font-medium capitalize">{student.gender}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                <p className="text-base font-medium">
                  {formatDate(student.dob)} ({calculateAge(student.dob)} years old)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Admission Number</label>
                <p className="text-base font-medium">{student.admission_no}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5" style={{ color: '#18C3A8' }} />
              Contact Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                <p className="text-base font-medium">{student.mobile}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="text-base font-medium">{student.address || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Academic & Guardian Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" style={{ color: '#3EB489' }} />
              Academic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Class</label>
                <p className="text-base font-medium">{student.classroom_name || 'Not assigned'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Enrollment Status</label>
                <div className="mt-1">
                  <StatusBadge status={student.enrollment_status} type="enrollment" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Enrolled On</label>
                <p className="text-base font-medium">{formatDate(student.created_at)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: '#223E97' }} />
              Guardian Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Parent/Guardian Name</label>
                <p className="text-base font-medium">{student.parent_guardian_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact Number</label>
                <p className="text-base font-medium">{student.parent_guardian_contact}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        {student.has_user_account && (
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: '#18C3A8' }} />
              Login Account
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                This student has an active login account and can access the student portal.
              </p>
              <div className="flex items-center gap-2">
                <StatusBadge status="active" type="enrollment" />
                <span className="text-sm font-medium">Account Active</span>
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
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm font-medium">{formatDate(student.created_at)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm font-medium">{formatDate(student.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Attendance Information */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5" style={{ color: '#3EB489' }} />
              Attendance Information
            </h3>
          </div>

          {attendanceData && attendanceData.results.length > 0 ? (
            <>
              {/* Attendance Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 62, 151, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" style={{ color: '#223E97' }} />
                    <span className="text-xs font-medium text-muted-foreground">Total Days</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#223E97' }}>
                    {attendanceData.results.length}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(62, 180, 137, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" style={{ color: '#3EB489' }} />
                    <span className="text-xs font-medium text-muted-foreground">Present</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#3EB489' }}>
                    {attendanceData.results.filter(a => a.status === 'present').length}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                    <span className="text-xs font-medium text-muted-foreground">Absent</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                    {attendanceData.results.filter(a => a.status === 'absent').length}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(24, 195, 168, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4" style={{ color: '#18C3A8' }} />
                    <span className="text-xs font-medium text-muted-foreground">Attendance %</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#18C3A8' }}>
                    {attendanceData.results.length > 0 
                      ? Math.round((attendanceData.results.filter(a => a.status === 'present' || a.status === 'half_day').length / attendanceData.results.length) * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              {/* Recent Attendance Records */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Recent Attendance Records (Last 30 Days)</h4>
                <div className="space-y-3">
                  {attendanceData.results.slice(0, 10).map((record) => {
                    const getStatusIcon = (status: string) => {
                      switch (status) {
                        case 'present':
                          return <CheckCircle className="w-5 h-5" style={{ color: '#3EB489' }} />;
                        case 'absent':
                          return <XCircle className="w-5 h-5" style={{ color: '#ef4444' }} />;
                        case 'leave':
                          return <Calendar className="w-5 h-5" style={{ color: '#f59e0b' }} />;
                        case 'half_day':
                          return <Clock className="w-5 h-5" style={{ color: '#3b82f6' }} />;
                        default:
                          return <Calendar className="w-5 h-5" style={{ color: '#6b7280' }} />;
                      }
                    };

                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'present':
                          return 'rgba(62, 180, 137, 0.1)';
                        case 'absent':
                          return 'rgba(239, 68, 68, 0.1)';
                        case 'leave':
                          return 'rgba(245, 158, 11, 0.1)';
                        case 'half_day':
                          return 'rgba(59, 130, 246, 0.1)';
                        default:
                          return 'rgba(107, 114, 128, 0.1)';
                      }
                    };

                    return (
                      <div 
                        key={record.id} 
                        className="rounded-lg border p-4"
                        style={{ backgroundColor: getStatusColor(record.status) }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(record.status)}
                            <div>
                              <p className="font-medium">
                                {new Date(record.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                              {record.notes && (
                                <p className="text-sm text-muted-foreground mt-1">{record.notes}</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <StatusBadge 
                              status={record.status} 
                              type="attendance" 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="No attendance records"
              description="No attendance has been marked for this student yet."
            />
          )}
        </div>

        {/* Fee Information */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="w-5 h-5" style={{ color: '#223E97' }} />
              Fee Information
            </h3>
            {currentUser?.role === 'student' && (
              <Link href="/dashboard/student/my-fees">
                <Button variant="outline" size="sm">
                  View All Fees
                </Button>
              </Link>
            )}
          </div>

          {feeRecordsData && feeRecordsData.results.length > 0 ? (
            <>
              {/* Fee Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 62, 151, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="w-4 h-4" style={{ color: '#223E97' }} />
                    <span className="text-xs font-medium text-muted-foreground">Total Records</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#223E97' }}>
                    {feeRecordsData.count}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(62, 180, 137, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4" style={{ color: '#3EB489' }} />
                    <span className="text-xs font-medium text-muted-foreground">Paid</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#3EB489' }}>
                    {feeRecordsData.results.filter(f => f.paid).length}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                    <span className="text-xs font-medium text-muted-foreground">Unpaid</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                    {feeRecordsData.results.filter(f => !f.paid).length}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(24, 195, 168, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4" style={{ color: '#18C3A8' }} />
                    <span className="text-xs font-medium text-muted-foreground">Payment Rate</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#18C3A8' }}>
                    {Math.round((feeRecordsData.results.filter(f => f.paid).length / feeRecordsData.results.length) * 100)}%
                  </p>
                </div>
              </div>

              {/* Recent Fee Records */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Recent Fee Records</h4>
                <div className="space-y-4">
                  {feeRecordsData.results.slice(0, 5).map((fee) => {
                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const lateFee = parseFloat(fee.late_fee || '0');
                    const discount = parseFloat(fee.discount || '0');
                    const totalAmount = parseFloat(fee.total_amount || '0');
                    const finalAmount = totalAmount + lateFee - discount;
                    
                    return (
                      <div key={fee.id} className="rounded-lg border bg-background p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b">
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-lg">
                              {monthNames[fee.month - 1]} {fee.year}
                            </div>
                            <StatusBadge status={fee.paid ? "paid" : "unpaid"} type="payment" />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadFeeReceipt(fee)}
                            title="Download Receipt"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Fee Breakdown */}
                        <div className="space-y-2 mb-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Fee Breakdown</p>
                          
                          {/* Fee Components */}
                          {fee.fee_components && Object.entries(fee.fee_components).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground capitalize">{key} Fee:</span>
                              <span className="font-medium">₹{parseFloat(String(value)).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                          
                          {/* Subtotal */}
                          <div className="flex justify-between items-center text-sm pt-2 border-t">
                            <span className="font-medium">Subtotal:</span>
                            <span className="font-semibold">₹{totalAmount.toLocaleString('en-IN')}</span>
                          </div>
                          
                          {/* Late Fee */}
                          {lateFee > 0 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-red-600">Late Fee:</span>
                              <span className="font-medium text-red-600">+₹{lateFee.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          
                          {/* Discount */}
                          {discount > 0 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-green-600">Discount:</span>
                              <span className="font-medium text-green-600">-₹{discount.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          
                          {/* Final Total */}
                          <div className="flex justify-between items-center pt-2 mt-2 border-t-2">
                            <span className="font-bold text-base">Total Amount:</span>
                            <span className="font-bold text-lg" style={{ color: '#223E97' }}>
                              ₹{finalAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                          <span>Academic Year: {fee.academic_year}</span>
                          {fee.paid && fee.paid_on && (
                            <span>Paid on {formatDate(fee.paid_on)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {feeRecordsData.count > 5 && (
                  <div className="mt-4 text-center">
                    {currentUser?.role === 'school_admin' ? (
                      <Link href="/dashboard/school-admin/fees">
                        <Button variant="outline" size="sm">
                          View All {feeRecordsData.count} Fee Records
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/dashboard/student/my-fees">
                        <Button variant="outline" size="sm">
                          View All {feeRecordsData.count} Fee Records
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-muted-foreground" style={{ opacity: 0.3 }} />
              <p className="text-sm text-muted-foreground">No fee records found for this student</p>
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
          title="Edit Student"
          description="Update student information"
          fields={formFields}
          initialData={student}
        />
      )}
    </DashboardLayout>
  );
}
