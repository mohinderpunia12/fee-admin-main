"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { School } from "@/types";

export function SubscriptionAlert() {
  const { user } = useAuth();

  // Only show for school_admin users
  if (!user || user.role !== "school_admin" || !user.school) {
    return null;
  }

  // Check if school is an object (not just an ID)
  const school = typeof user.school === 'object' ? user.school : null;
  
  if (!school) {
    return null;
  }

  // Check if subscription is inactive
  if (!school.active) {
    return (
      <Alert variant="destructive" className="mb-4">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Subscription Inactive</AlertTitle>
        <AlertDescription>
          Your school subscription has ended. Please contact the system
          administrator to renew your subscription and regain access to all
          features.
        </AlertDescription>
      </Alert>
    );
  }

  // Check if subscription is expiring soon (within 7 days)
  if (school.subscription_end) {
    const endDate = new Date(school.subscription_end);
    const today = new Date();
    const daysRemaining = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining <= 7 && daysRemaining > 0) {
      return (
        <Alert className="mb-4 border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">
            Subscription Expiring Soon
          </AlertTitle>
          <AlertDescription className="text-yellow-700">
            Your subscription will expire in {daysRemaining} day
            {daysRemaining !== 1 ? "s" : ""} (
            {endDate.toLocaleDateString()}). Please contact the administrator to
            renew.
          </AlertDescription>
        </Alert>
      );
    }

    if (daysRemaining <= 0) {
      return (
        <Alert variant="destructive" className="mb-4">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Subscription Expired</AlertTitle>
          <AlertDescription>
            Your subscription expired on {endDate.toLocaleDateString()}. Please
            contact the system administrator to renew your subscription.
          </AlertDescription>
        </Alert>
      );
    }
  }

  return null;
}
