import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { getTenant, getTenantBilling, listProvisioningProjects } from '@/lib/api';
import { useTranslation } from '@/contexts/LanguageContext';
import { TenantFormDialog } from '@/components/TenantFormDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatDateTime, getLanguageLocale } from '@/lib/locale';

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { format } = useCurrency();
  const { t, language } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);
  const locale = getLanguageLocale(language);

  const tenantQuery = useQuery({ queryKey: ['tenant', id], queryFn: () => getTenant(id!), enabled: !!id });
  const billingQuery = useQuery({ queryKey: ['tenant-billing', id], queryFn: () => getTenantBilling(id!), enabled: !!id });
  const projectsQuery = useQuery({ queryKey: ['tenant-projects', id], queryFn: () => listProvisioningProjects({ tenantId: id!, status: 'all' }), enabled: !!id });

  const tenant = tenantQuery.data;
  const billing = billingQuery.data;
  const projects = projectsQuery.data?.items ?? [];

  const infoRows = useMemo(() => {
    if (!tenant) return [];
    return [
      [t('common.slug'), tenant.slug],
      [t('tenantForm.baseDomain'), tenant.baseDomain],
      [t('tenants.companyCode'), tenant.companyCode || '—'],
      [t('common.status'), t(`status.${tenant.status}`)],
      [t('tenantDetail.createdAt'), formatDateTime(tenant.createdAt, locale)],
      [t('tenantDetail.updatedAt'), formatDateTime(tenant.updatedAt, locale)],
    ];
  }, [locale, t, tenant]);

  const endpointRows = useMemo(() => {
    if (!tenant) return [];
    return [
      [t('common.api'), tenant.apiBaseUrl],
      [t('tenantDetail.websocket'), tenant.wsBaseUrl],
      [t('common.web'), tenant.webBaseUrl],
      [t('common.assets'), tenant.assetsBaseUrl || '—'],
    ];
  }, [t, tenant]);

  if (tenantQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">{t('tenantDetail.loading')}</div>;
  }

  if (!tenant) {
    return <div className="text-sm text-muted-foreground">{t('tenantDetail.notFound')}</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{tenant.displayName}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline">{t(`status.${tenant.status}`)}</Badge>
              <span className="text-sm text-muted-foreground">{tenant.baseDomain}</span>
            </div>
          </div>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />{t('tenantDetail.edit')}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-border bg-card shadow-sm"><CardContent className="p-6"><p className="text-sm text-muted-foreground">{t('tenantDetail.projects')}</p><p className="mt-2 text-2xl font-bold text-foreground">{tenant._count?.provisioningProjects ?? projects.length}</p></CardContent></Card>
          <Card className="border-border bg-card shadow-sm"><CardContent className="p-6"><p className="text-sm text-muted-foreground">{t('tenantDetail.invoices')}</p><p className="mt-2 text-2xl font-bold text-foreground">{billing?.summary.invoiceCount ?? 0}</p></CardContent></Card>
          <Card className="border-border bg-card shadow-sm"><CardContent className="p-6"><p className="text-sm text-muted-foreground">{t('tenantDetail.monthlyRevenue')}</p><p className="mt-2 text-2xl font-bold text-foreground">{billing?.profile ? format(billing.profile.monthlyAmount, billing.profile.currency) : '—'}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="info">
          <TabsList className="border border-border bg-muted/50">
            <TabsTrigger value="info">{t('tenantDetail.tenantTab')}</TabsTrigger>
            <TabsTrigger value="projects">{t('tenantDetail.projectsTab')} ({projects.length})</TabsTrigger>
            <TabsTrigger value="billing">{t('tenantDetail.billingTab')} ({billing?.summary.invoiceCount ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 space-y-4">
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {infoRows.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="mt-1 break-all font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader><CardTitle>{t('tenantForm.endpoints')}</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {endpointRows.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="mt-1 break-all font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader><CardTitle>{t('tenantDetail.projectsTab')}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                    <div>
                      <p className="font-medium text-foreground">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.ownerName || t('tenantDetail.noOwner')}{project.targetGoLiveAt ? ` • ${t('tenantDetail.goLive')} ${project.targetGoLiveAt.slice(0, 10)}` : ''}</p>
                    </div>
                    <Badge variant="outline">{t(`status.${project.status}`)}</Badge>
                  </div>
                ))}
                {!projects.length ? <p className="text-sm text-muted-foreground">{t('tenantDetail.noProjects')}</p> : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-4">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader><CardTitle>{t('tenantDetail.billingProfile')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {billing?.profile ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div><p className="text-sm text-muted-foreground">{t('finance.plan')}</p><p className="mt-1 font-medium text-foreground">{t(`status.${billing.profile.plan}`)}</p></div>
                    <div><p className="text-sm text-muted-foreground">{t('common.status')}</p><p className="mt-1 font-medium text-foreground">{t(`status.${billing.profile.status}`)}</p></div>
                    <div><p className="text-sm text-muted-foreground">{t('tenantDetail.monthlyAmount')}</p><p className="mt-1 font-medium text-foreground">{format(billing.profile.monthlyAmount, billing.profile.currency)}</p></div>
                    <div><p className="text-sm text-muted-foreground">{t('tenantDetail.outstanding')}</p><p className="mt-1 font-medium text-foreground">{format(billing.summary.totalOutstanding, billing.profile.currency)}</p></div>
                  </div>
                ) : <p className="text-sm text-muted-foreground">{t('tenantDetail.billingUnavailable')}</p>}

                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>{t('finance.number')}</TableHead>
                      <TableHead>{t('finance.value')}</TableHead>
                      <TableHead>{t('finance.issueDate')}</TableHead>
                      <TableHead>{t('finance.dueDate')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billing?.invoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-border">
                        <TableCell className="font-medium text-foreground">{invoice.number}</TableCell>
                        <TableCell className="text-foreground">{format(invoice.amount, invoice.currency)}</TableCell>
                        <TableCell className="text-muted-foreground">{invoice.issueDate.slice(0, 10)}</TableCell>
                        <TableCell className="text-muted-foreground">{invoice.dueDate.slice(0, 10)}</TableCell>
                        <TableCell><Badge variant="outline">{t(`status.${invoice.status}`)}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {!billing?.invoices.length ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">{t('tenantDetail.noInvoices')}</TableCell></TableRow> : null}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <TenantFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        tenantId={tenant.id}
        onSuccess={async (updatedTenant) => {
          await queryClient.invalidateQueries({ queryKey: ['tenant', updatedTenant.id] });
        }}
        onDelete={(deletedTenantId) => {
          void queryClient.invalidateQueries({ queryKey: ['tenants'] });
          void queryClient.removeQueries({ queryKey: ['tenant', deletedTenantId] });
          navigate('/tenants');
        }}
      />
    </>
  );
}
