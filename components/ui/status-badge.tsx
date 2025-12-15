import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  type?: "enrollment" | "employment" | "payment" | "subscription" | "attendance";
}

export function StatusBadge({ status, type = "enrollment" }: StatusBadgeProps) {
  const getStatusConfig = () => {
    // Normalize status to lowercase for consistent comparison
    const normalizedStatus = status?.toLowerCase() || "";

    switch (type) {
      case "enrollment":
        if (normalizedStatus === "active") {
          return { variant: "default" as const, icon: CheckCircle, text: "Active", className: "bg-green-500 hover:bg-green-600" };
        }
        return { variant: "secondary" as const, icon: XCircle, text: "Inactive", className: "bg-gray-500 hover:bg-gray-600" };

      case "employment":
        if (normalizedStatus === "active") {
          return { variant: "default" as const, icon: CheckCircle, text: "Active", className: "bg-green-500 hover:bg-green-600" };
        }
        return { variant: "secondary" as const, icon: XCircle, text: "Resigned", className: "bg-gray-500 hover:bg-gray-600" };

      case "payment":
        if (normalizedStatus === "paid" || normalizedStatus === "true") {
          return { variant: "default" as const, icon: CheckCircle, text: "Paid", className: "bg-green-500 hover:bg-green-600" };
        }
        return { variant: "destructive" as const, icon: Clock, text: "Unpaid", className: "bg-red-500 hover:bg-red-600" };

      case "subscription":
        if (normalizedStatus === "active" || normalizedStatus === "true") {
          return { variant: "default" as const, icon: CheckCircle, text: "Active", className: "bg-green-500 hover:bg-green-600" };
        }
        if (normalizedStatus === "expiring") {
          return { variant: "default" as const, icon: AlertCircle, text: "Expiring Soon", className: "bg-yellow-500 hover:bg-yellow-600" };
        }
        return { variant: "destructive" as const, icon: XCircle, text: "Inactive", className: "bg-red-500 hover:bg-red-600" };

      case "attendance":
        if (normalizedStatus === "present") {
          return { variant: "default" as const, icon: CheckCircle, text: "Present", className: "bg-green-500 hover:bg-green-600" };
        }
        if (normalizedStatus === "absent") {
          return { variant: "destructive" as const, icon: XCircle, text: "Absent", className: "bg-red-500 hover:bg-red-600" };
        }
        if (normalizedStatus === "leave") {
          return { variant: "default" as const, icon: Clock, text: "Leave", className: "bg-blue-500 hover:bg-blue-600" };
        }
        if (normalizedStatus === "half_day") {
          return { variant: "default" as const, icon: AlertCircle, text: "Half Day", className: "bg-yellow-500 hover:bg-yellow-600" };
        }
        if (normalizedStatus === "overtime") {
          return { variant: "default" as const, icon: CheckCircle, text: "Overtime", className: "bg-purple-500 hover:bg-purple-600" };
        }
        break;

      default:
        return { variant: "secondary" as const, icon: AlertCircle, text: status, className: "" };
    }

    return { variant: "secondary" as const, icon: AlertCircle, text: status, className: "" };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.text}
    </Badge>
  );
}
