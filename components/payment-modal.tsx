"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, QrCode, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getSystemSettings } from "@/lib/api/settings";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  daysRemaining: number;
  isTrial?: boolean;
}

export function PaymentModal({ open, onOpenChange, daysRemaining, isTrial = false }: PaymentModalProps) {
  // Fetch system settings for dynamic values
  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: getSystemSettings,
  });

  const subscriptionAmount = settings?.monthly_subscription_amount || 299;
  const qrCodeUrl = settings?.payment_qr_code_url || '';
  const supportEmail = settings?.support_email || 'mohinderpunia82@gmail.com';
  const supportMobile = settings?.support_mobile || '+91 95182 33053';
  const trialDays = settings?.trial_period_days || 7;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isTrial ? `Welcome to Your ${trialDays}-Day Free Trial!` : "Subscription Payment Required"}
          </DialogTitle>
          <DialogDescription>
            {isTrial 
              ? `Your free trial will expire in ${trialDays} days. To continue using our services, please complete the payment.`
              : `Your subscription will expire in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Please renew to avoid service interruption.`
            }
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {/* Payment Amount */}
            <div className="bg-primary/10 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Subscription Amount</p>
              <p className="text-3xl font-bold text-primary">₹{subscriptionAmount}</p>
              <p className="text-xs text-muted-foreground mt-1">per month</p>
            </div>

          {/* Alert */}
          <Alert variant={daysRemaining <= 3 ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {isTrial ? "Trial Period Active" : daysRemaining <= 3 ? "Urgent: Payment Required" : "Payment Reminder"}
            </AlertTitle>
          </Alert>

          {/* QR Code Display */}
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
              QR Code for Payment
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 text-center">
              (Scan with any UPI app)
            </p>
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-semibold">Payment Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Scan the QR code using any UPI app</li>
              <li>Pay ₹{subscriptionAmount} to activate subscription</li>
              <li>Screenshot the payment confirmation</li>
              <li>Contact administrator to activate your account</li>
            </ol>
          </div>

          {/* Contact Info */}
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <p className="text-xs font-medium mb-1">Need Help?</p>
            <p className="text-xs text-muted-foreground mb-2">
              After payment, contact us to activate your subscription immediately.
            </p>
            <div className="space-y-1">
              <p className="text-xs">
                <span className="font-medium">Email:</span> {supportEmail}
              </p>
              <p className="text-xs">
                <span className="font-medium">Mobile:</span> {supportMobile}
              </p>
            </div>
          </div>
        </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            I'll Pay Later
          </Button>
          <Button 
            className="flex-1"
            onClick={() => {
              // TODO: Contact support or show payment proof upload
              onOpenChange(false);
            }}
          >
            Payment Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
