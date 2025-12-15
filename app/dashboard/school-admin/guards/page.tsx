"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { FormModal, FormField } from '@/components/form-modal';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUserProfile } from '@/lib/api/auth';
import { listGuards, createGuard, updateGuard, deleteGuard } from '@/lib/api/guards';

export default function SchoolGuardsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data: user, isLoading: userLoading } = useQuery({ queryKey: ['user-profile'], queryFn: getUserProfile });

  const schoolKey = ((): number | undefined => {
    const s = user?.school;
    if (!s) return undefined;
    return typeof s === 'object' && s !== null ? (s as any).id : (s as unknown as number);
  })();

  const { data, isLoading, error } = useQuery({
    queryKey: ['guards', schoolKey],
    queryFn: () => listGuards({ page_size: 100 }),
    enabled: !!user,
  });

  const createMut = useMutation({ mutationFn: (p: any) => createGuard(p), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['guards'] }); setIsModalOpen(false); toast.success('Guard created'); } });
  const updateMut = useMutation({ mutationFn: ({ id, payload }: any) => updateGuard(id, payload), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['guards'] }); setIsModalOpen(false); setEditing(null); toast.success('Guard updated'); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => deleteGuard(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['guards'] }); toast.success('Guard deleted'); } });

  const openCreate = () => { setEditing(null); setIsModalOpen(true); };
  const openEdit = (g: any) => { setEditing(g); setIsModalOpen(true); };

  const handleSubmit = (formData: any) => {
    const payload: any = {
      name: formData.name,
      mobile: formData.mobile,
      shift: formData.shift,
      employee_id: formData.employee_id,
      password: formData.password,
      profile_picture: formData.profile_picture,
    };

    if (editing) updateMut.mutate({ id: editing.id, payload });
    else createMut.mutate(payload);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Delete guard? This cannot be undone.')) return;
    deleteMut.mutate(id);
  };

  if (isLoading || userLoading) return <DashboardLayout><PageLoader /></DashboardLayout>;

  if (error) return <DashboardLayout><EmptyState title="Unable to load guards" description="Check your permissions or connection." /></DashboardLayout>;

  const guards = data?.results || [];

  const fields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'mobile', label: 'Mobile', type: 'text', required: false },
    { name: 'shift', label: 'Shift', type: 'text', required: false },
    { name: 'employee_id', label: 'Employee ID', type: 'text', required: false },
    { name: 'password', label: 'Password (for login)', type: 'password', required: !editing },
    { name: 'profile_picture', label: 'Profile Picture', type: 'file', required: false },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">School Guards</h1>
          <Button onClick={openCreate}>Add Guard</Button>
        </div>

        <div className="rounded-lg border bg-card p-6">
          {guards.length === 0 ? (
            <EmptyState title="No guards" description="No guards found for this school." />
          ) : (
            <div className="space-y-2">
              {guards.map((g: any) => (
                <div key={g.id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium">{g.name} {g.employee_id ? `• ${g.employee_id}` : ''}</div>
                    <div className="text-sm text-muted-foreground">{g.mobile} • {g.shift}</div>
                    {g.username && <div className="text-xs text-blue-600 font-mono mt-1">Username: {g.username}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(g)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(g.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isModalOpen && (
          <FormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmit}
            title={editing ? 'Edit Guard' : 'Add Guard'}
            description={editing ? 'Update guard details' : 'Create a new guard profile'}
            fields={fields}
            initialData={editing || undefined}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
