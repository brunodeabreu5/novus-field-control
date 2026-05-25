import { useId, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus } from 'lucide-react';
import { createProvisioningProject, listProvisioningProjects, listTenants } from '@/lib/api';
import { useTranslation } from '@/contexts/LanguageContext';
import type { ProvisioningProjectPayload, ProvisioningProjectStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function Projects() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();
  const tenantsQuery = useQuery({ queryKey: ['project-tenants'], queryFn: () => listTenants({ status: 'all' }) });
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<ProvisioningProjectStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ProvisioningProjectPayload>({ tenantId: '', name: '', description: '', ownerName: '', status: 'planned', startedAt: '', targetGoLiveAt: '' });
  const [error, setError] = useState<string | null>(null);

  const projectsQuery = useQuery({
    queryKey: ['projects', search, tenantFilter, statusFilter],
    queryFn: () => listProvisioningProjects({
      search,
      tenantId: tenantFilter === 'all' ? undefined : tenantFilter,
      status: statusFilter,
    }),
  });

  const tenants = tenantsQuery.data?.items ?? [];
  const projects = projectsQuery.data?.items ?? [];

  const mutation = useMutation({
    mutationFn: () => createProvisioningProject({
      ...form,
      description: form.description || undefined,
      ownerName: form.ownerName || undefined,
      startedAt: form.startedAt || undefined,
      targetGoLiveAt: form.targetGoLiveAt || undefined,
    }),
    onSuccess: async () => {
      setDialogOpen(false);
      setError(null);
      setForm({ tenantId: '', name: '', description: '', ownerName: '', status: 'planned', startedAt: '', targetGoLiveAt: '' });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : t('projects.createError')),
  });

  const statusOptions = useMemo(() => ['all', 'planned', 'active', 'blocked', 'completed'] as const, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('projects.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('projects.subtitle')}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />{t('projects.new')}
        </Button>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder={t('projects.search')} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={tenantFilter} onValueChange={setTenantFilter}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder={t('common.tenant')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {tenants.map((tenant) => <SelectItem key={tenant.id} value={tenant.id}>{tenant.displayName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProvisioningProjectStatus | 'all')}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => <SelectItem key={status} value={status}>{status === 'all' ? t('common.all') : t(`status.${status}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader><CardTitle>{t('projects.pipeline')}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>{t('projects.project')}</TableHead>
                <TableHead>{t('common.tenant')}</TableHead>
                <TableHead>{t('projects.owner')}</TableHead>
                <TableHead>{t('projects.status')}</TableHead>
                <TableHead>{t('projects.goLive')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className="border-border">
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.description || t('projects.noDescription')}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{project.tenant?.displayName || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{project.ownerName || '—'}</TableCell>
                  <TableCell><Badge variant="outline">{t(`status.${project.status}`)}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{project.targetGoLiveAt ? project.targetGoLiveAt.slice(0, 10) : '—'}</TableCell>
                </TableRow>
              ))}
              {!projects.length && !projectsQuery.isLoading ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t('projects.noResults')}</TableCell></TableRow> : null}
            </TableBody>
          </Table>
          {projectsQuery.isLoading ? <div className="p-6 text-sm text-muted-foreground">{t('projects.loading')}</div> : null}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border" titleId={titleId} descriptionId={descriptionId}>
          <DialogHeader>
            <DialogTitle id={titleId}>{t('projects.newDialog')}</DialogTitle>
            <DialogDescription id={descriptionId}>{t('projects.subtitle')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label={t('common.tenant')}>
              <Select value={form.tenantId} onValueChange={(value) => setForm((prev) => ({ ...prev, tenantId: value }))}>
                <SelectTrigger><SelectValue placeholder={t('projects.tenantPlaceholder')} /></SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => <SelectItem key={tenant.id} value={tenant.id}>{tenant.displayName}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('projects.name')}><Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></Field>
            <Field label={t('projects.description')}><Input value={form.description || ''} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} /></Field>
            <Field label={t('projects.owner')}><Input value={form.ownerName || ''} onChange={(e) => setForm((prev) => ({ ...prev, ownerName: e.target.value }))} /></Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t('projects.status')}>
                <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as ProvisioningProjectStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">{t('status.planned')}</SelectItem>
                    <SelectItem value="active">{t('status.active')}</SelectItem>
                    <SelectItem value="blocked">{t('status.blocked')}</SelectItem>
                    <SelectItem value="completed">{t('status.completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t('projects.goLive')}><Input type="date" value={form.targetGoLiveAt || ''} onChange={(e) => setForm((prev) => ({ ...prev, targetGoLiveAt: e.target.value }))} /></Field>
            </div>
            {error ? <div className="text-sm text-destructive">{error}</div> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => void mutation.mutateAsync()} disabled={mutation.isPending}>{mutation.isPending ? t('projects.creating') : t('projects.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label className="text-sm text-muted-foreground">{label}</label>{children}</div>;
}
