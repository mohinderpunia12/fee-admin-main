"use client";

import { AlertTriangle, Mail, Phone, QrCode, MapPin, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getSystemSettings } from "@/lib/api/settings";

interface SubscriptionExpiredModalProps {
  schoolName?: string;
  subscriptionEnd?: string | null;
}

export function SubscriptionExpiredModal({
  schoolName,
  subscriptionEnd,
}: SubscriptionExpiredModalProps) {
  // Fetch system settings for dynamic values
  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: getSystemSettings,
  });

  const subscriptionAmount = settings?.monthly_subscription_amount || 299;
  const qrCodeUrl = settings?.payment_qr_code_url || '';
  const supportEmail = settings?.support_email || 'mohinderpunia82@gmail.com';
  const supportMobile = settings?.support_mobile || '+91 95182 33053';
  const supportAddress = settings?.support_address || 'Pal Nagar, Kachwa Road, Karnal, Haryana (India)';

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-red-500/50 max-h-[90vh] flex flex-col">
        <CardHeader className="text-center space-y-4 pb-6 flex-shrink-0">
          <div className="flex justify-center">
            <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
              <AlertTriangle className="h-16 w-16 text-red-600 dark:text-red-500" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-red-600 dark:text-red-500">
            Subscription Expired
          </CardTitle>
          <CardDescription className="text-lg">
            Your school&apos;s subscription has expired. Please contact the administrator to renew access.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* School Info */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">School Name:</span>
                  <span className="font-semibold">{schoolName || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Subscription Ended:</span>
                  <span className="font-semibold text-red-600 dark:text-red-500">
                    {formatDate(subscriptionEnd)}
                  </span>
                </div>
              </div>

              {/* QR Code for Renewal Payment */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-center">Scan to Renew Subscription (₹{subscriptionAmount})</h3>
                <div className="flex flex-col items-center justify-center">
                  <div className="w-64 h-64 border-2 border-muted-foreground/30 rounded-lg p-2 flex items-center justify-center bg-white">
                    {qrCodeUrl ? (
                      <Image
                        src={qrCodeUrl}
                        alt="Payment QR Code"
                        width={256}
                        height={256}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    ) : (
                      <QrCode className="h-32 w-32 text-muted-foreground/40" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-3">
                    Scan with any UPI app to pay ₹{subscriptionAmount}
                  </p>
                </div>
              </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Need Help?</h3>
            <div className="space-y-2">
              <a
                href={`https://wa.me/${supportMobile.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
              >
                <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Call/WhatsApp: {supportMobile}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Contact administrator for subscription renewal
                  </p>
                </div>
              </a>

              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors"
              >
                <Mail className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Email: {supportEmail}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Send renewal request via email
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    Address
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    {supportAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              <strong>Important:</strong> You can view your dashboard but cannot perform any actions
              (create, edit, or delete) until your subscription is renewed.
            </p>
          </div>
          </>
          )}
        </CardContent>

        {/* Action Button */}
        <div className="flex justify-center p-6 pt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => {
              window.open(`https://wa.me/${supportMobile.replace(/\D/g, '')}`, "_blank");
            }}
            className="w-full sm:w-auto"
          >
            <Phone className="h-4 w-4 mr-2" />
            Contact via WhatsApp
          </Button>
        </div>
      </Card>
    </div>
  );
}
