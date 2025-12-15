"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { FormModal, FormField } from '@/components/form-modal';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUserProfile } from '@/lib/api/auth';
import { listVisitors, createVisitor, updateVisitor } from '@/lib/api/visitors';

export default function VisitorsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<any | null>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<string | undefined>(undefined);
  const [debouncedName, setDebouncedName] = useState('');

  const { data: user, isLoading: userLoading } = useQuery({ queryKey: ['user-profile'], queryFn: getUserProfile });

  const schoolKey = ((): number | undefined => {
    const s = user?.school;
    if (!s) return undefined;
    return typeof s === 'object' && s !== null ? (s as any).id : (s as unknown as number);
  })();

  const linkedGuardKey = ((): number | undefined => {
    const lg = user?.linked_guard;
    if (!lg) return undefined;
    return typeof lg === 'object' && lg !== null ? (lg as any).id : (lg as unknown as number);
  })();

  // Debounce name input to avoid refetch on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedName(nameFilter.trim()), 300);
    return () => clearTimeout(t);
  }, [nameFilter]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['visitors', schoolKey, user?.role, linkedGuardKey, debouncedName || null, dateFilter || null],
    queryFn: () => {
      const params: any = { page_size: 100 };
      if (debouncedName) params.name = debouncedName;
      if (dateFilter) params.date = dateFilter;
      return listVisitors(params);
    },
    enabled: !!user,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => createVisitor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      toast.success('Visitor created');
      setIsModalOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to create visitor'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: any) => updateVisitor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      toast.success('Visitor updated');
      setEditingVisitor(null);
      setIsModalOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to update visitor'),
  });

  const handleOpenCreate = () => {
    setEditingVisitor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (v: any) => {
    setEditingVisitor(v);
    setIsModalOpen(true);
  };

  const handleSubmit = (formData: any) => {
    const payload = {
      name: formData.name,
      contact_no: formData.contact_no,
      purpose: formData.purpose,
      id_proof: formData.id_proof,
      vehicle_no: formData.vehicle_no,
      date: formData.date,
      guard: formData.guard || undefined,
    };

    if (editingVisitor) {
      updateMutation.mutate({ id: editingVisitor.id, payload });
    } else {
      // Auto check-in is now handled by backend
      createMutation.mutate(payload);
    }
  };

  if (isLoading || userLoading) return (
    <DashboardLayout><PageLoader /></DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <EmptyState title="Unable to load visitors" description="Check your connection or permissions." />
    </DashboardLayout>
  );

  const visitors = data?.results || [];
  const hasActiveFilters = !!debouncedName || !!dateFilter;

  const fields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'contact_no', label: 'Contact No', type: 'text', required: false },
    { name: 'purpose', label: 'Purpose', type: 'text', required: false },
    { name: 'id_proof', label: 'ID Proof', type: 'text', required: false },
    { name: 'vehicle_no', label: 'Vehicle No', type: 'text', required: false },
    { name: 'date', label: 'Date', type: 'date', required: true },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Visitors</h1>
          <div className="flex items-center gap-2">
            <Button onClick={handleOpenCreate}>Add Visitor</Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          {visitors.length === 0 && !hasActiveFilters ? (
            <EmptyState title="No visitors" description="No visitors found for this scope." />
          ) : (
            <div>
              <div className="mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Filter by name"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="px-3 py-2 rounded-md border w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="date"
                    value={dateFilter || ''}
                    onChange={(e) => setDateFilter(e.target.value || undefined)}
                    className="px-3 py-2 rounded-md border w-auto focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button variant="ghost" size="sm" onClick={() => { setNameFilter(''); setDateFilter(undefined); }}>
                    Clear
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground mt-2 sm:mt-0">Showing {visitors.length} result{visitors.length !== 1 ? 's' : ''}</div>
              </div>
              {visitors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No visitors found matching your filters. Try adjusting or clearing them.
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Visitor</th>
                      <th className="text-left p-3 font-semibold">Check In / Out</th>
                      <th className="text-right p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map((v: any) => (
                      <tr key={v.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium">{v.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {v.purpose} • {v.contact_no} • {v.date}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-4">
                            {v.time_in && <span className="text-green-600 text-sm">In: {v.time_in}</span>}
                            {v.time_out && <span className="text-red-600 text-sm">Out: {v.time_out}</span>}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(v)}>Edit</Button>
                            {v.time_in && !v.time_out && (
                              <Button size="sm" onClick={() => updateMutation.mutate({ id: v.id, payload: { time_out: new Date().toLocaleTimeString('en-GB') } })}>
                                Check Out
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          )}
        </div>

        {isModalOpen && (
          <FormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmit}
            title={editingVisitor ? 'Edit Visitor' : 'Add Visitor'}
            description={editingVisitor ? 'Update visitor details' : 'Register a new visitor'}
            fields={fields}
            initialData={editingVisitor || undefined}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
