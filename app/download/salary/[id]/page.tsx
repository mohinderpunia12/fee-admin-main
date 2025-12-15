"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Download, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loading-spinner";
import { pdf } from '@react-pdf/renderer';
import { SalarySlipPDF } from '@/components/pdf';
import apiClient from "@/lib/api/client";

export default function SalaryDownloadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const salaryId = params.id as string;
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salaryData, setSalaryData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        if (!token) {
          // If no token, try to fetch with auth
          const response = await apiClient.get(`/salary-records/${salaryId}/`);
          setSalaryData(response.data);
        } else {
          // Use token-based endpoint to get data
          const response = await apiClient.get(`/salary-records/data/${token}/`);
          setSalaryData(response.data);
        }
        
        setLoading(false);
        // Auto-download after loading
        setTimeout(() => {
          handleDownload();
        }, 500);
      } catch (err: any) {
        console.error("Error fetching salary data:", err);
        setError(err.response?.data?.error || err.response?.data?.message || "Failed to load salary slip");
        setLoading(false);
      }
    };

    fetchSalaryData();
  }, [salaryId, token]);

  const handleDownload = async () => {
    if (!salaryData) return;
    
    try {
      setDownloading(true);
      
      const doc = <SalarySlipPDF 
        salaryRecord={salaryData}
        schoolName={salaryData.school.name}
        staffName={salaryData.staff.name}
        designation={salaryData.staff.designation}
        employeeId={salaryData.staff.employee_id}
        schoolLogoUrl={salaryData.school.logo_url}
        schoolEmail={salaryData.school.email}
        schoolMobile={salaryData.school.mobile}
      />;

      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Salary_Slip_${salaryData.staff.name}_${salaryData.month}_${salaryData.year}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      setDownloading(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to download salary slip");
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <FileText className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Salary Slip</h1>
          <p className="text-gray-600">{salaryData?.staff.name}</p>
          <p className="text-sm text-gray-500">
            Month: {salaryData?.month}/{salaryData?.year}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">School:</span>
            <span className="font-medium">{salaryData?.school.name}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Designation:</span>
            <span className="font-medium">{salaryData?.staff.designation}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Net Salary:</span>
            <span className="font-medium">₹{parseFloat(salaryData?.net_salary || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${salaryData?.paid ? 'text-green-600' : 'text-red-600'}`}>
              {salaryData?.paid ? 'Paid ✓' : 'Pending'}
            </span>
          </div>
        </div>

        <Button 
          onClick={handleDownload} 
          className="w-full"
          disabled={downloading}
        >
          <Download className="mr-2 h-4 w-4" />
          {downloading ? 'Downloading...' : 'Download Salary Slip'}
        </Button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your download will start automatically. If it doesn't, click the button above.
        </p>
      </div>
    </div>
  );
}
