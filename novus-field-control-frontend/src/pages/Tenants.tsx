import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Eye, Pencil } from 'lucide-react';
import { listTenants } from '@/lib/api';
import { useTranslation } from '@/contexts/LanguageContext';
import { TenantFormDialog } from '@/components/TenantFormDialog';
import type { TenantStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Tenants() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);

  const tenantsQuery = useQuery({
    queryKey: ['tenants', search, statusFilter],
    queryFn: () => listTenants({ search, status: statusFilter }),
  });

  const tenants = tenantsQuery.data?.items ?? [];

  const openCreateModal = () => {
    setEditingTenantId(null);
    setModalOpen(true);
  };

  const openEditModal = (tenantId: string) => {
    setEditingTenantId(tenantId);
    setModalOpen(true);
  };

  const closeModal = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setEditingTenantId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('tenants.title')}</h1>
            <p className="mt-1 text-muted-foreground">{t('tenants.subtitle')}</p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />{t('tenants.new')}
          </Button>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder={t('tenants.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TenantStatus | 'all')}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="active">{t('status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                  <SelectItem value="suspended">{t('status.suspended')}</SelectItem>
                  <SelectItem value="provisioning">{t('status.provisioning')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>{t('common.tenant')}</TableHead>
                  <TableHead>{t('tenantForm.baseDomain')}</TableHead>
                  <TableHead>{t('tenants.companyCode')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('common.currency')}</TableHead>
                  <TableHead>{t('tenants.plan')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id} className="border-border">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{tenant.displayName}</p>
                        <p className="text-sm text-muted-foreground">{tenant.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px] text-muted-foreground">
                      <div className="truncate">{tenant.baseDomain}</div>
                      <div className="text-xs text-muted-foreground/80">{tenant.apiBaseUrl}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tenant.companyCode || '—'}</TableCell>
                    <TableCell><Badge variant="outline">{t(`status.${tenant.status}`)}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{tenant.billingProfile?.currency || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{t(`status.${tenant.billingProfile?.plan || 'starter'}`)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/tenants/${tenant.id}`)} aria-label={t('common.back')}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(tenant.id)} aria-label={t('common.edit')}><Pencil className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!tenantsQuery.isLoading && tenants.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">{t('tenants.noResults')}</TableCell></TableRow>
                ) : null}
              </TableBody>
            </Table>
            {tenantsQuery.isLoading ? <div className="p-6 text-sm text-muted-foreground">{t('tenants.loading')}</div> : null}
            {tenantsQuery.error instanceof Error ? <div className="p-6 text-sm text-destructive">{tenantsQuery.error.message}</div> : null}
          </CardContent>
        </Card>
      </div>

      <TenantFormDialog open={modalOpen} onOpenChange={closeModal} tenantId={editingTenantId} />
    </>
  );
}
