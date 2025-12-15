"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listStudents } from "@/lib/api/students";
import { listStaff } from "@/lib/api/staff";
import { StudentIDStyle1 } from "@/components/pdf/student-id-style1";
import { StaffIDStyle1 } from "@/components/pdf/staff-id-style1";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Users, UserCheck } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

type TabType = "students" | "staff";

export default function IDCardsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("students");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Fetch students
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["students-all"],
    queryFn: () => listStudents({ page_size: 1000 }),
    enabled: !!user && activeTab === "students",
  });

  // Fetch staff
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => listStaff({ page_size: 1000 }),
    enabled: !!user && activeTab === "staff",
  });

  const students = studentsData?.results || [];
  const staff = staffData?.results || [];

  // Handle student selection
  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Handle staff selection
  const toggleStaffSelection = (staffId: number) => {
    setSelectedStaff((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  // Select all students
  const selectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  // Select all staff
  const selectAllStaff = () => {
    if (selectedStaff.length === staff.length) {
      setSelectedStaff([]);
    } else {
      setSelectedStaff(staff.map((s) => s.id));
    }
  };

  // Download selected ID cards
  const downloadSelectedCards = async () => {
    if (activeTab === "students" && selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    if (activeTab === "staff" && selectedStaff.length === 0) {
      toast.error("Please select at least one staff member");
      return;
    }

    setIsDownloading(true);
    toast.info("Generating ID cards...");

    try {
      const selectedIds = activeTab === "students" ? selectedStudents : selectedStaff;
      console.log('Selected IDs:', selectedIds);
      console.log('Available refs:', Object.keys(cardRefs.current));

      for (let i = 0; i < selectedIds.length; i++) {
        const id = selectedIds[i];
        const element = cardRefs.current[`${activeTab}-${id}`];
        
        console.log(`Processing ${activeTab}-${id}:`, element);
        
        if (!element) {
          console.error(`Element not found for ${activeTab}-${id}`);
          toast.error(`Could not find ID card for ID: ${id}`);
          continue;
        }

        // Wait a bit for images to load
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log('Capturing canvas...');
        // Generate canvas from the element
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: true,
          imageTimeout: 15000,
        });

        console.log('Canvas created:', canvas.width, 'x', canvas.height);

        // Convert to blob and download
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
        });

        console.log('Blob created:', blob?.size);

        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          const name = activeTab === "students" 
            ? students.find(s => s.id === id)
            : staff.find(s => s.id === id);
          const fileName = name 
            ? `${activeTab === "students" 
                ? `${(name as any).first_name}_${(name as any).last_name}` 
                : (name as any).name}_id_card.png`
            : `${activeTab}-id-card-${id}.png`;
          
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          console.log('Download triggered for:', fileName);
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          console.error('Failed to create blob');
        }

        // Add small delay between downloads
        if (i < selectedIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }

      toast.success(`Downloaded ${selectedIds.length} ID card(s)`);
    } catch (error) {
      console.error("Error downloading ID cards:", error);
      toast.error(`Failed to download ID cards: ${error}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const school = {
    name: user?.school_name || "School Name",
    logo_url: user?.school_logo_url || null,
    email: user?.school_email || null,
    mobile: user?.school_mobile || null,
    address: null,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">ID Cards</h1>
          <Button
            onClick={downloadSelectedCards}
            disabled={
              isDownloading ||
              (activeTab === "students" && selectedStudents.length === 0) ||
              (activeTab === "staff" && selectedStaff.length === 0)
            }
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading
              ? "Downloading..."
              : `Download Selected (${
                  activeTab === "students"
                    ? selectedStudents.length
                    : selectedStaff.length
                })`}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b">
          <button
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === "students"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" />
            Students
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === "staff"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            Staff
          </button>
        </div>

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    students.length > 0 &&
                    selectedStudents.length === students.length
                  }
                  onCheckedChange={selectAllStudents}
                />
                <label className="text-sm font-medium">
                  Select All ({students.length})
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedStudents.length} selected
              </p>
            </div>

            {studentsLoading ? (
              <LoadingSpinner />
            ) : students.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No students found</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-3">
                  {students.map((student) => (
                    <Card key={student.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() =>
                                toggleStudentSelection(student.id)
                              }
                            />
                            <div className="flex items-center gap-3">
                              {student.profile_picture_url ? (
                                <img
                                  src={student.profile_picture_url}
                                  alt={`${student.first_name} ${student.last_name}`}
                                  className="h-12 w-12 rounded-full object-cover"
                                  crossOrigin="anonymous"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-primary">
                                    {student.first_name.charAt(0)}
                                    {student.last_name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-semibold">
                                  {student.first_name} {student.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {student.classroom_name || "No class assigned"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {student.admission_no || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Admission No.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Hidden ID cards for download */}
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                  {students.map((student) => (
                    <div
                      key={`card-${student.id}`}
                      ref={(el) => {
                        cardRefs.current[`students-${student.id}`] = el;
                      }}
                    >
                      <StudentIDStyle1
                        student={{
                          first_name: student.first_name,
                          last_name: student.last_name,
                          admission_no: student.admission_no,
                          classroom_name: student.classroom_name,
                          profile_picture_url: student.profile_picture_url,
                          mobile: student.mobile,
                          address: student.address,
                        }}
                        school={school}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Staff Tab */}
        {activeTab === "staff" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    staff.length > 0 && selectedStaff.length === staff.length
                  }
                  onCheckedChange={selectAllStaff}
                />
                <label className="text-sm font-medium">
                  Select All ({staff.length})
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedStaff.length} selected
              </p>
            </div>

            {staffLoading ? (
              <LoadingSpinner />
            ) : staff.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No staff found</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-3">
                  {staff.map((staffMember) => (
                    <Card key={staffMember.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedStaff.includes(staffMember.id)}
                              onCheckedChange={() =>
                                toggleStaffSelection(staffMember.id)
                              }
                            />
                            <div className="flex items-center gap-3">
                              {staffMember.profile_picture_url ? (
                                <img
                                  src={staffMember.profile_picture_url}
                                  alt={staffMember.name}
                                  className="h-12 w-12 rounded-full object-cover"
                                  crossOrigin="anonymous"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-primary">
                                    {staffMember.name
                                      .split(" ")
                                      .map((n) => n.charAt(0))
                                      .join("")
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-semibold">
                                  {staffMember.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {staffMember.designation}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {staffMember.mobile}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {staffMember.employment_status === "active"
                                ? "Active"
                                : "Resigned"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Hidden ID cards for download */}
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                  {staff.map((staffMember) => (
                    <div
                      key={`card-${staffMember.id}`}
                      ref={(el) => {
                        cardRefs.current[`staff-${staffMember.id}`] = el;
                      }}
                    >
                      <StaffIDStyle1
                        staff={{
                          name: staffMember.name,
                          designation: staffMember.designation,
                          id: staffMember.id,
                          profile_picture_url: staffMember.profile_picture_url,
                          joining_date: staffMember.joining_date,
                        }}
                        school={school}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
