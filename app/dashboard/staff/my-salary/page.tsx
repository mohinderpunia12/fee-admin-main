"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMySalary } from "@/lib/api/salary-records";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Download, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MySalaryPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["my-salary", page],
    queryFn: () => getMySalary({ page, page_size: pageSize }),
  });

  const salaryRecords = data?.results || [];
  const totalRecords = data?.count || 0;
  const totalPages = Math.ceil(totalRecords / pageSize);

  // Calculate statistics
  const totalPaid = salaryRecords.filter(r => r.paid).length;
  const totalUnpaid = salaryRecords.filter(r => !r.paid).length;
  const totalEarned = salaryRecords
    .filter(r => r.paid)
    .reduce((sum, r) => sum + parseFloat(r.net_salary || "0"), 0);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getStatusBadge = (paid: boolean) => {
    if (paid) {
      return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
    }
    return <Badge variant="destructive">Unpaid</Badge>;
  };

  const handleDownloadSlip = (record: any) => {
    // TODO: Implement PDF download
    console.log("Download slip for record:", record.id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1A1F36' }}>My Salary</h1>
          <p className="text-muted-foreground mt-2">View and download your salary records</p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <TrendingUp className="h-4 w-4" style={{ color: '#3EB489' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1A1F36' }}>
                ₹{totalEarned.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {totalPaid} paid records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Records</CardTitle>
              <Wallet className="h-4 w-4" style={{ color: '#18C3A8' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1A1F36' }}>{totalPaid}</div>
              <p className="text-xs text-muted-foreground mt-1">Salary slips paid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Records</CardTitle>
              <Calendar className="h-4 w-4" style={{ color: '#223E97' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1A1F36' }}>{totalUnpaid}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
            </CardContent>
          </Card>
        </div>

        {/* Salary Records */}
        <Card>
          <CardHeader>
            <CardTitle>Salary History</CardTitle>
          </CardHeader>
          <CardContent>
            {salaryRecords.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No salary records found</h3>
                <p className="text-muted-foreground mt-2">
                  Your salary records will appear here once they are generated.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {salaryRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5" style={{ color: '#223E97' }} />
                        <div>
                          <h4 className="font-semibold" style={{ color: '#1A1F36' }}>
                            {monthNames[record.month - 1]} {record.year}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Base: ₹{parseFloat(record.base_salary).toLocaleString('en-IN')}
                            {record.bonuses && ` | Bonus: ₹${parseFloat(record.bonuses).toLocaleString('en-IN')}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Net Salary</p>
                        <p className="text-lg font-bold" style={{ color: '#223E97' }}>
                          ₹{parseFloat(record.net_salary).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(record.paid)}
                        {record.paid && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadSlip(record)}
                            style={{ borderColor: '#18C3A8', color: '#18C3A8' }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalRecords)} of {totalRecords} records
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
