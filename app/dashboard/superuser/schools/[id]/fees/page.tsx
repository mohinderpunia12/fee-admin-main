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
import { ArrowLeft, Search, Receipt } from "lucide-react";
import * as feeRecordsApi from "@/lib/api/fee-records";
import * as schoolsApi from "@/lib/api/schools";
import { FeeRecord } from "@/types";

export default function SchoolFeesPage() {
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

  // Fetch fee records for this school
  const { data: feeRecordsData, isLoading } = useQuery({
    queryKey: ["school-fees", schoolId, searchTerm, filterStatus, page, pageSize],
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

      return feeRecordsApi.listFeeRecords(params);
    },
    enabled: !!schoolId,
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const columns: Column<FeeRecord>[] = [
    {
      key: "student",
      label: "Student",
      render: (fee) => (
        <div>
          <p className="font-medium">{fee.student_name || `Student #${fee.student}`}</p>
          <p className="text-sm text-muted-foreground">
            {monthNames[fee.month - 1]} {fee.year}
          </p>
        </div>
      ),
    },
    {
      key: "total_amount",
      label: "Amount",
      render: (fee) => {
        const total = parseFloat(fee.total_amount);
        const lateFee = parseFloat(fee.late_fee || "0");
        const discount = parseFloat(fee.discount || "0");
        const finalAmount = total + lateFee - discount;
        return `₹${finalAmount.toLocaleString("en-IN")}`;
      },
    },
    {
      key: "paid",
      label: "Status",
      render: (fee) => <StatusBadge status={fee.paid ? "paid" : "unpaid"} type="payment" />,
    },
    {
      key: "paid_on",
      label: "Payment Date",
      render: (fee) => (fee.paid_on ? new Date(fee.paid_on).toLocaleDateString() : "Not paid"),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  const paidCount = feeRecordsData?.results.filter((f) => f.paid).length || 0;
  const unpaidCount = feeRecordsData?.results.filter((f) => !f.paid).length || 0;

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
            <h1 className="text-3xl font-bold">{school?.name} - Fee Records</h1>
            <p className="text-muted-foreground mt-2">View fee records for this school</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name..."
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
                style={{ backgroundColor: "rgba(34, 62, 151, 0.1)" }}
              >
                <Receipt className="w-6 h-6" style={{ color: "#223E97" }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{feeRecordsData?.count || 0}</p>
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
                <Receipt className="w-6 h-6" style={{ color: "#3EB489" }} />
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
                <Receipt className="w-6 h-6" style={{ color: "#ef4444" }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{unpaidCount}</p>
                <p className="text-sm text-muted-foreground">Unpaid</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {feeRecordsData && feeRecordsData.results.length > 0 ? (
          <DataTable
            columns={columns}
            data={feeRecordsData.results}
            pagination={{
              currentPage: page,
              totalPages: Math.ceil(feeRecordsData.count / pageSize),
              pageSize,
              totalItems: feeRecordsData.count,
              onPageChange: setPage,
            }}
          />
        ) : (
          <EmptyState title="No fee records found" description="This school has no fee records yet." />
        )}
      </div>
    </DashboardLayout>
  );
}
