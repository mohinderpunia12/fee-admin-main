"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable, Column } from "@/components/data-table";
import { PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Search, Wallet } from "lucide-react";
import * as salaryRecordsApi from "@/lib/api/salary-records";
import * as schoolsApi from "@/lib/api/schools";
import { SalaryRecord } from "@/types";

export default function SchoolSalaryPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = parseInt(params.id as string);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Fetch school details
  const { data: school } = useQuery({
    queryKey: ["school", schoolId],
    queryFn: () => schoolsApi.getSchool(schoolId),
    enabled: !!schoolId,
  });

  // Fetch salary records for this school
  const { data: salaryRecordsData, isLoading } = useQuery({
    queryKey: ["school-salary", schoolId, searchTerm, filterStatus, page, pageSize],
    queryFn: () => {
      const params: any = {
        school: schoolId,
        search: searchTerm || undefined,
        page,
        page_size: pageSize,
        ordering: "-year,-month",
      };

      if (filterStatus === "paid") params.paid = true;
      if (filterStatus === "unpaid") params.paid = false;

      return salaryRecordsApi.listSalaryRecords(params);
    },
    enabled: !!schoolId,
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const columns: Column<SalaryRecord>[] = [
    {
      key: "staff",
      label: "Staff",
      render: (salary) => (
        <div>
          <p className="font-medium">{salary.staff_name || `Staff #${salary.staff}`}</p>
          <p className="text-sm text-muted-foreground">
            {monthNames[salary.month - 1]} {salary.year}
          </p>
        </div>
      ),
    },
    {
      key: "net_salary",
      label: "Net Salary",
      render: (salary) => `₹${parseFloat(salary.net_salary).toLocaleString("en-IN")}`,
    },
    {
      key: "paid",
      label: "Status",
      render: (salary) => <StatusBadge status={salary.paid ? "paid" : "unpaid"} type="payment" />,
    },
    {
      key: "paid_on",
      label: "Payment Date",
      render: (salary) => (salary.paid_on ? new Date(salary.paid_on).toLocaleDateString() : "Not paid"),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  const paidCount = salaryRecordsData?.results.filter((s) => s.paid).length || 0;
  const unpaidCount = salaryRecordsData?.results.filter((s) => !s.paid).length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/superuser/schools/${schoolId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to School
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{school?.name} - Salary Records</h1>
            <p className="text-muted-foreground mt-2">View salary records for this school</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by staff name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(24, 195, 168, 0.1)" }}
              >
                <Wallet className="w-6 h-6" style={{ color: "#18C3A8" }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{salaryRecordsData?.count || 0}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(62, 180, 137, 0.1)" }}
              >
                <Wallet className="w-6 h-6" style={{ color: "#3EB489" }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{paidCount}</p>
                <p className="text-sm text-muted-foreground">Paid</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
              >
                <Wallet className="w-6 h-6" style={{ color: "#ef4444" }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{unpaidCount}</p>
                <p className="text-sm text-muted-foreground">Unpaid</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {salaryRecordsData && salaryRecordsData.results.length > 0 ? (
          <DataTable
            columns={columns}
            data={salaryRecordsData.results}
            pagination={{
              currentPage: page,
              totalPages: Math.ceil(salaryRecordsData.count / pageSize),
              pageSize,
              totalItems: salaryRecordsData.count,
              onPageChange: setPage,
            }}
          />
        ) : (
          <EmptyState title="No salary records found" description="This school has no salary records yet." />
        )}
      </div>
    </DashboardLayout>
  );
}
