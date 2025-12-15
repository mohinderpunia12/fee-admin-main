"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Download, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loading-spinner";
import { pdf } from '@react-pdf/renderer';
import { FeeReceiptPDF } from '@/components/pdf';
import apiClient from "@/lib/api/client";

export default function FeeDownloadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const feeId = params.id as string;
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feeData, setFeeData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchFeeData = async () => {
      try {
        if (!token) {
          // If no token, try to fetch with auth
          const response = await apiClient.get(`/fee-records/${feeId}/`);
          setFeeData(response.data);
        } else {
          // Use token-based endpoint to get data
          const response = await apiClient.get(`/fee-records/data/${token}/`);
          setFeeData(response.data);
        }
        
        setLoading(false);
        // Auto-download after loading
        setTimeout(() => {
          handleDownload();
        }, 500);
      } catch (err: any) {
        console.error("Error fetching fee data:", err);
        setError(err.response?.data?.error || err.response?.data?.message || "Failed to load fee receipt");
        setLoading(false);
      }
    };

    fetchFeeData();
  }, [feeId, token]);

  const handleDownload = async () => {
    if (!feeData) return;
    
    try {
      setDownloading(true);
      
      const fullName = `${feeData.student.first_name} ${feeData.student.last_name}`;
      
      const doc = <FeeReceiptPDF 
        feeRecord={feeData}
        schoolName={feeData.school.name}
        studentName={fullName}
        className={feeData.student.classroom_name}
        admissionNo={feeData.student.admission_no}
        fatherName={feeData.student.parent_guardian_name}
        schoolLogoUrl={feeData.school.logo_url}
        schoolEmail={feeData.school.email}
        schoolMobile={feeData.school.mobile}
      />;

      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Fee_Receipt_${fullName}_${feeData.month}_${feeData.year}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      setDownloading(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to download fee receipt");
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Fee Receipt</h1>
          <p className="text-gray-600">
            {feeData?.student.first_name} {feeData?.student.last_name}
          </p>
          <p className="text-sm text-gray-500">
            Month: {feeData?.month}/{feeData?.year}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">School:</span>
            <span className="font-medium">{feeData?.school.name}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">₹{parseFloat(feeData?.total_amount || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${feeData?.paid ? 'text-green-600' : 'text-red-600'}`}>
              {feeData?.paid ? 'Paid ✓' : 'Unpaid'}
            </span>
          </div>
        </div>

        <Button 
          onClick={handleDownload} 
          className="w-full"
          disabled={downloading}
        >
          <Download className="mr-2 h-4 w-4" />
          {downloading ? 'Downloading...' : 'Download Receipt'}
        </Button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your download will start automatically. If it doesn't, click the button above.
        </p>
      </div>
    </div>
  );
}
