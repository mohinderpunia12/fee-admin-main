"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/lib/api/auth";
import { PageLoader } from "@/components/ui/loading-spinner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function MyProfilePage() {
  const router = useRouter();

  // Fetch current user profile
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
  });

  useEffect(() => {
    if (userProfile) {
      // Redirect to student detail page if user is a student with linked_student
      if (userProfile.role === "student" && userProfile.linked_student) {
        router.replace(`/dashboard/student/${userProfile.linked_student}`);
      }
      // Redirect to staff detail page if user is a staff member with linked_staff
      else if (userProfile.role === "staff" && userProfile.linked_staff) {
        router.replace(`/dashboard/staff/${userProfile.linked_staff}`);
      }
    }
  }, [userProfile, router]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Redirecting to your profile...</p>
      </div>
    </DashboardLayout>
  );
}
