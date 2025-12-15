"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyFees } from "@/lib/api/fee-records";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Download, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyFeesPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["my-fees", page],
    queryFn: () => getMyFees({ page, page_size: pageSize }),
  });

  const feeRecords = data?.results || [];
  const totalRecords = data?.count || 0;
  const totalPages = Math.ceil(totalRecords / pageSize);

  // Calculate statistics
  const totalPaid = feeRecords.filter(r => r.paid).length;
  const totalUnpaid = feeRecords.filter(r => !r.paid).length;
  const totalAmount = feeRecords.reduce((sum, r) => sum + parseFloat(r.total_amount || "0"), 0);
  const totalPaidAmount = feeRecords
    .filter(r => r.paid)
    .reduce((sum, r) => sum + parseFloat(r.total_amount || "0"), 0);
  const totalUnpaidAmount = feeRecords
    .filter(r => !r.paid)
    .reduce((sum, r) => sum + parseFloat(r.total_amount || "0"), 0);

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
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

  const handleDownloadReceipt = (record: any) => {
    // TODO: Implement PDF download
    console.log("Download receipt for record:", record.id);
  };

  const formatFeeComponents = (components: any) => {
    if (!components || typeof components !== 'object') return [];
    return Object.entries(components).map(([key, value]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      amount: value
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1A1F36' }}>My Fees</h1>
          <p className="text-muted-foreground mt-2">View and download your fee records</p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
              <Receipt className="h-4 w-4" style={{ color: '#223E97' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1A1F36' }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalRecords} total records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Fees</CardTitle>
              <TrendingUp className="h-4 w-4" style={{ color: '#3EB489' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1A1F36' }}>
                ₹{totalPaidAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalPaid} paid records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Fees</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₹{totalUnpaidAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalUnpaid} pending records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Rate</CardTitle>
              <Calendar className="h-4 w-4" style={{ color: '#18C3A8' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1A1F36' }}>
                {totalRecords > 0 ? Math.round((totalPaid / totalRecords) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Fees paid on time</p>
            </CardContent>
          </Card>
        </div>

        {/* Unpaid Fees Alert */}
        {totalUnpaid > 0 && (
          <Card className="border-red-200" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-700">Outstanding Fees</h4>
                  <p className="text-sm text-red-600 mt-1">
                    You have {totalUnpaid} unpaid fee record{totalUnpaid !== 1 ? 's' : ''} totaling ₹{totalUnpaidAmount.toLocaleString('en-IN')}. 
                    Please contact the school office for payment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fee Records */}
        <Card>
          <CardHeader>
            <CardTitle>Fee History</CardTitle>
          </CardHeader>
          <CardContent>
            {feeRecords.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No fee records found</h3>
                <p className="text-muted-foreground mt-2">
                  Your fee records will appear here once they are generated.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {feeRecords.map((record) => {
                  const feeComponents = formatFeeComponents(record.fee_components);
                  
                  return (
                    <div
                      key={record.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 mt-1" style={{ color: '#223E97' }} />
                          <div>
                            <h4 className="font-semibold" style={{ color: '#1A1F36' }}>
                              {monthNames[record.month - 1]} {record.year}
                              {record.academic_year && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  (AY: {record.academic_year})
                                </span>
                              )}
                            </h4>
                            {record.paid_on && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Paid on: {new Date(record.paid_on).toLocaleDateString('en-IN')}
                                {record.payment_mode && ` via ${record.payment_mode.replace('_', ' ')}`}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(record.paid)}
                        </div>
                      </div>

                      {/* Fee Breakdown */}
                      {feeComponents.length > 0 && (
                        <div className="ml-8 mb-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                          {feeComponents.map((component, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="text-muted-foreground">{component.name}:</span>
                              <span className="font-medium ml-2">₹{Number(component.amount).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Late Fee & Discount */}
                      {(record.late_fee || record.discount) && (
                        <div className="ml-8 mb-3 flex gap-4 text-sm">
                          {record.late_fee && parseFloat(record.late_fee) > 0 && (
                            <div className="text-red-600">
                              Late Fee: +₹{parseFloat(record.late_fee).toLocaleString('en-IN')}
                            </div>
                          )}
                          {record.discount && parseFloat(record.discount) > 0 && (
                            <div className="text-green-600">
                              Discount: -₹{parseFloat(record.discount).toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Total Amount */}
                      <div className="ml-8 flex items-center justify-between pt-3 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="text-xl font-bold" style={{ color: '#223E97' }}>
                            ₹{parseFloat(record.total_amount).toLocaleString('en-IN')}
                          </p>
                        </div>

                        {record.paid && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadReceipt(record)}
                            style={{ borderColor: '#18C3A8', color: '#18C3A8' }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download Receipt
                          </Button>
                        )}
                      </div>

                      {/* Notes */}
                      {record.notes && (
                        <div className="ml-8 mt-3 p-2 bg-gray-50 rounded text-sm text-muted-foreground">
                          <strong>Note:</strong> {record.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
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
