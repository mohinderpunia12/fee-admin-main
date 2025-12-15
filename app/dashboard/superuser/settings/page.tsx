'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSystemSettings, updateSystemSettings, SystemSettings } from '@/lib/api/settings';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, DollarSign, Calendar, Mail, Phone, MapPin, QrCode, Video } from 'lucide-react';
import { PageLoader } from '@/components/ui/loading-spinner';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});

  // Fetch system settings
  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ['system-settings'],
    queryFn: getSystemSettings,
  });

  // Initialize form data when settings are loaded
  useState(() => {
    if (settings) {
      setFormData(settings);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: FormData) => updateSystemSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Settings updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = new FormData();
    
    // Add text fields
    if (formData.monthly_subscription_amount !== undefined) {
      submitData.append('monthly_subscription_amount', formData.monthly_subscription_amount.toString());
    }
    if (formData.trial_period_days !== undefined) {
      submitData.append('trial_period_days', formData.trial_period_days.toString());
    }
    if (formData.payment_upi_id) {
      submitData.append('payment_upi_id', formData.payment_upi_id);
    }
    if (formData.support_email) {
      submitData.append('support_email', formData.support_email);
    }
    if (formData.support_mobile) {
      submitData.append('support_mobile', formData.support_mobile);
    }
    if (formData.support_address) {
      submitData.append('support_address', formData.support_address);
    }

    updateMutation.mutate(submitData);
  };

  const handleFileUpload = (field: string, file: File | null) => {
    if (!file) return;

    const fileData = new FormData();
    fileData.append(field, file);

    updateMutation.mutate(fileData);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
            <PageLoader />
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-2">Manage subscription pricing and system configuration</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subscription Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Subscription Settings
            </CardTitle>
            <CardDescription>Configure subscription pricing and trial period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monthly Subscription Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.monthly_subscription_amount || ''}
                  onChange={(e) => setFormData({ ...formData, monthly_subscription_amount: parseFloat(e.target.value) })}
                  placeholder="299.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trial" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Trial Period (days)
                </Label>
                <Input
                  id="trial"
                  type="number"
                  value={formData.trial_period_days || ''}
                  onChange={(e) => setFormData({ ...formData, trial_period_days: parseInt(e.target.value) })}
                  placeholder="7"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Payment Settings
            </CardTitle>
            <CardDescription>Upload payment QR code and UPI details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr">Payment QR Code</Label>
              {settings?.payment_qr_code_url && (
                <div className="mb-2">
                  <img 
                    src={settings.payment_qr_code_url} 
                    alt="Payment QR" 
                    className="w-32 h-32 object-contain border rounded"
                  />
                </div>
              )}
              <Input
                id="qr"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('payment_qr_code', e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upi">UPI ID</Label>
              <Input
                id="upi"
                type="text"
                value={formData.payment_upi_id || ''}
                onChange={(e) => setFormData({ ...formData, payment_upi_id: e.target.value })}
                placeholder="your-upi@bank"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Support Contact Information</CardTitle>
            <CardDescription>Contact details shown to schools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Support Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.support_email || ''}
                onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                placeholder="support@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Support Mobile
              </Label>
              <Input
                id="mobile"
                type="text"
                value={formData.support_mobile || ''}
                onChange={(e) => setFormData({ ...formData, support_mobile: e.target.value })}
                placeholder="+91 XXXXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Support Address
              </Label>
              <textarea
                id="address"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.support_address || ''}
                onChange={(e) => setFormData({ ...formData, support_address: e.target.value })}
                placeholder="Full address"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tutorial Video */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Tutorial Video
            </CardTitle>
            <CardDescription>Upload tutorial video for landing page</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="video">Tutorial Video</Label>
              {settings?.tutorial_video_url && (
                <div className="mb-2">
                  <video 
                    src={settings.tutorial_video_url} 
                    controls 
                    className="w-full max-w-md border rounded"
                  />
                </div>
              )}
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={(e) => handleFileUpload('tutorial_video', e.target.files?.[0] || null)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
    </DashboardLayout>
  );
}
