"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyAttendance } from "@/lib/api/attendance";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Calendar, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MyAttendancePage() {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const pageSize = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["my-attendance", page, dateFrom, dateTo],
    queryFn: () => getMyAttendance({ 
      page, 
      page_size: pageSize,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined
    }),
  });

  const attendanceRecords = data?.results || [];
  const totalRecords = data?.count || 0;
  const totalPages = Math.ceil(totalRecords / pageSize);

  // Calculate statistics
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const leaveCount = attendanceRecords.filter(r => r.status === 'leave').length;
  const halfDayCount = attendanceRecords.filter(r => r.status === 'half_day').length;
  const overtimeCount = attendanceRecords.filter(r => r.status === 'overtime').length;

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      present: { label: "Present", className: "bg-green-500 hover:bg-green-600" },
      absent: { label: "Absent", className: "bg-red-500 hover:bg-red-600" },
      leave: { label: "Leave", className: "bg-yellow-500 hover:bg-yellow-600" },
      half_day: { label: "Half Day", className: "bg-orange-500 hover:bg-orange-600" },
      overtime: { label: "Overtime", className: "bg-blue-500 hover:bg-blue-600" },
    };

    const config = statusConfig[status] || { label: status, className: "" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1A1F36' }}>My Attendance</h1>
          <p className="text-muted-foreground mt-2">View your attendance history</p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <CalendarCheck className="h-4 w-4" style={{ color: '#3EB489' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1A1F36' }}>{presentCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Days present</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <Calendar className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1A1F36' }}>{absentCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Days absent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leave</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1A1F36' }}>{leaveCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Days on leave</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Half Day</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1A1F36' }}>{halfDayCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Half days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overtime</CardTitle>
              <TrendingUp className="h-4 w-4" style={{ color: '#223E97' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1A1F36' }}>{overtimeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">OT days</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date_from">From Date</Label>
                <Input
                  id="date_from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_to">To Date</Label>
                <Input
                  id="date_to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-12">
                <CalendarCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No attendance records found</h3>
                <p className="text-muted-foreground mt-2">
                  {dateFrom || dateTo ? "Try adjusting your filters" : "Your attendance records will appear here."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Calendar className="h-5 w-5" style={{ color: '#223E97' }} />
                      <div>
                        <h4 className="font-semibold" style={{ color: '#1A1F36' }}>
                          {formatDate(record.date)}
                        </h4>
                        {record.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{record.notes}</p>
                        )}
                        {record.hours_worked && (
                          <p className="text-sm text-muted-foreground">
                            Hours worked: {record.hours_worked}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(record.status)}
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
