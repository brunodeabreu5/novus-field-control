import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createBillingInvoice, getTenantBilling, listBillingInvoices, listTenants, updateTenantBillingProfile } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatCurrencyValue, getLanguageLocale } from '@/lib/locale';
import type { BillingInvoicePayload, BillingInvoiceStatus, BillingPlan, BillingProfileStatus, Currency } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Finance() {
  const queryClient = useQueryClient();
  const { format } = useCurrency();
  const { t, language } = useTranslation();
  const locale = getLanguageLocale(language);
  const tenantsQuery = useQuery({ queryKey: ['billing-tenants'], queryFn: () => listTenants({ status: 'all' }) });
  const [statusFilter, setStatusFilter] = useState<BillingInvoiceStatus | 'all'>('all');
  const [tenantId, setTenantId] = useState<string>('');
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const invoicesQuery = useQuery({
    queryKey: ['billing-invoices', tenantId, statusFilter],
    queryFn: () => listBillingInvoices({ tenantId: tenantId || undefined, status: statusFilter }),
  });

  const billingQuery = useQuery({
    queryKey: ['tenant-billing', tenantId],
    queryFn: () => getTenantBilling(tenantId),
    enabled: !!tenantId,
  });

  const tenants = tenantsQuery.data?.items ?? [];

  useEffect(() => {
    if (!tenantId && tenants.length) {
      setTenantId(tenants[0].id);
    }
  }, [tenantId, tenants]);

  const [invoiceForm, setInvoiceForm] = useState<BillingInvoicePayload>({
    tenantId: '',
    number: '',
    amount: 0,
    currency: 'PYG',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    status: 'issued',
    description: '',
  });
  const [profileForm, setProfileForm] = useState<{ plan: BillingPlan; currency: Currency; monthlyAmount: number; status: BillingProfileStatus; notes: string }>({
    plan: 'starter',
    currency: 'PYG',
    monthlyAmount: 0,
    status: 'active',
    notes: '',
  });

  useEffect(() => {
    if (billingQuery.data?.profile) {
      setProfileForm({
        plan: billingQuery.data.profile.plan,
        currency: billingQuery.data.profile.currency,
        monthlyAmount: billingQuery.data.profile.monthlyAmount,
        status: billingQuery.data.profile.status,
        notes: billingQuery.data.profile.notes || '',
      });
      setInvoiceForm((prev) => ({ ...prev, tenantId: billingQuery.data!.tenant.id, currency: billingQuery.data!.profile.currency }));
    }
  }, [billingQuery.data]);

  const totalsByMoney = useMemo(() => {
    const totals: Record<Currency, number> = { PYG: 0, BRL: 0, USD: 0 };
    (invoicesQuery.data?.items ?? []).forEach((invoice) => {
      totals[invoice.currency] += invoice.amount;
    });
    return totals;
  }, [invoicesQuery.data?.items]);

  const invoiceMutation = useMutation({
    mutationFn: () => createBillingInvoice({ ...invoiceForm, tenantId: tenantId || invoiceForm.tenantId, description: invoiceForm.description || undefined }),
    onSuccess: async () => {
      setInvoiceError(null);
      setInvoiceOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['tenant-billing', tenantId] });
    },
    onError: (error) => {
      setInvoiceError(error instanceof Error ? error.message : t('finance.invoiceCreateError'));
    },
  });

  const profileMutation = useMutation({
    mutationFn: () => updateTenantBillingProfile(tenantId, profileForm),
    onSuccess: async () => {
      setProfileError(null);
      setProfileOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['billing-tenants'] });
      await queryClient.invalidateQueries({ queryKey: ['tenant-billing', tenantId] });
    },
    onError: (error) => {
      setProfileError(error instanceof Error ? error.message : t('finance.profileSaveError'));
    },
  });

  const resetInvoiceDialog = (open: boolean) => {
    setInvoiceOpen(open);
    if (open) {
      setInvoiceError(null);
    }
  };

  const resetProfileDialog = (open: boolean) => {
    setProfileOpen(open);
    if (open) {
      setProfileError(null);
    }
  };

  const handleInvoiceSubmit = async () => {
    const effectiveTenantId = tenantId || invoiceForm.tenantId;

    if (!effectiveTenantId) {
      setInvoiceError(t('finance.invoiceTenantRequired'));
      return;
    }

    if (!invoiceForm.number.trim()) {
      setInvoiceError(t('finance.invoiceNumberRequired'));
      return;
    }

    if (!Number.isFinite(invoiceForm.amount) || invoiceForm.amount < 0) {
      setInvoiceError(t('finance.invoiceAmountRequired'));
      return;
    }

    if (!invoiceForm.issueDate) {
      setInvoiceError(t('finance.invoiceIssueDateRequired'));
      return;
    }

    if (!invoiceForm.dueDate) {
      setInvoiceError(t('finance.invoiceDueDateRequired'));
      return;
    }

    setInvoiceError(null);
    await invoiceMutation.mutateAsync();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('finance.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('finance.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => resetProfileDialog(true)} disabled={!tenantId}>{t('finance.editProfile')}</Button>
          <Button onClick={() => resetInvoiceDialog(true)} disabled={!tenantId}>{t('finance.newInvoice')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.entries(totalsByMoney) as [Currency, number][]).map(([cur, total]) => (
          <Card key={cur} className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{t('finance.filteredTotal')} - {cur}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrencyValue(total, cur, locale)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>{t('finance.sectionTitle')}</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger className="w-[240px]"><SelectValue placeholder={t('common.tenant')} /></SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => <SelectItem key={tenant.id} value={tenant.id}>{tenant.displayName}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BillingInvoiceStatus | 'all')}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="draft">{t('status.draft')}</SelectItem>
                  <SelectItem value="issued">{t('status.issued')}</SelectItem>
                  <SelectItem value="paid">{t('status.paid')}</SelectItem>
                  <SelectItem value="overdue">{t('status.overdue')}</SelectItem>
                  <SelectItem value="voided">{t('status.voided')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {billingQuery.data?.profile ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InfoCard label={t('finance.plan')} value={t(`status.${billingQuery.data.profile.plan}`)} />
              <InfoCard label={t('common.status')} value={t(`status.${billingQuery.data.profile.status}`)} />
              <InfoCard label={t('finance.monthlyFee')} value={format(billingQuery.data.profile.monthlyAmount, billingQuery.data.profile.currency)} />
              <InfoCard label={t('finance.outstanding')} value={format(billingQuery.data.summary.totalOutstanding, billingQuery.data.profile.currency)} />
            </div>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>{t('finance.number')}</TableHead>
                <TableHead>{t('common.tenant')}</TableHead>
                <TableHead>{t('finance.value')}</TableHead>
                <TableHead>{t('finance.dueDate')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoicesQuery.data?.items ?? []).map((invoice) => (
                <TableRow key={invoice.id} className="border-border">
                  <TableCell className="font-medium text-foreground">{invoice.number}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.tenant?.displayName || '—'}</TableCell>
                  <TableCell className="text-foreground">{format(invoice.amount, invoice.currency)}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.dueDate.slice(0, 10)}</TableCell>
                  <TableCell><Badge variant="outline">{t(`status.${invoice.status}`)}</Badge></TableCell>
                </TableRow>
              ))}
              {!invoicesQuery.isLoading && !(invoicesQuery.data?.items.length) ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t('finance.noResults')}</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={invoiceOpen} onOpenChange={resetInvoiceDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{t('finance.invoiceDialog')}</DialogTitle>
            <DialogDescription>{t('finance.subtitle')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label={t('finance.number')}><Input value={invoiceForm.number} onChange={(e) => { setInvoiceForm((prev) => ({ ...prev, number: e.target.value })); setInvoiceError(null); }} /></Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t('finance.value')}><Input type="number" value={invoiceForm.amount} onChange={(e) => { setInvoiceForm((prev) => ({ ...prev, amount: Number(e.target.value) })); setInvoiceError(null); }} /></Field>
              <Field label={t('common.currency')}>
                <Select value={invoiceForm.currency} onValueChange={(value) => { setInvoiceForm((prev) => ({ ...prev, currency: value as Currency })); setInvoiceError(null); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PYG">PYG</SelectItem>
                    <SelectItem value="BRL">BRL</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t('finance.issueDate')}><Input type="date" value={invoiceForm.issueDate} onChange={(e) => { setInvoiceForm((prev) => ({ ...prev, issueDate: e.target.value })); setInvoiceError(null); }} /></Field>
              <Field label={t('finance.dueDate')}><Input type="date" value={invoiceForm.dueDate} onChange={(e) => { setInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value })); setInvoiceError(null); }} /></Field>
              <Field label={t('common.status')}>
                <Select value={invoiceForm.status} onValueChange={(value) => { setInvoiceForm((prev) => ({ ...prev, status: value as BillingInvoiceStatus })); setInvoiceError(null); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('status.draft')}</SelectItem>
                    <SelectItem value="issued">{t('status.issued')}</SelectItem>
                    <SelectItem value="paid">{t('status.paid')}</SelectItem>
                    <SelectItem value="overdue">{t('status.overdue')}</SelectItem>
                    <SelectItem value="voided">{t('status.voided')}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t('finance.description')}><Input value={invoiceForm.description || ''} onChange={(e) => { setInvoiceForm((prev) => ({ ...prev, description: e.target.value })); setInvoiceError(null); }} /></Field>
            </div>
            {invoiceError ? <div className="text-sm text-destructive">{invoiceError}</div> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => resetInvoiceDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => void handleInvoiceSubmit()} disabled={invoiceMutation.isPending}>{invoiceMutation.isPending ? t('common.loading') : t('finance.createInvoice')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={profileOpen} onOpenChange={resetProfileDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{t('finance.profileDialog')}</DialogTitle>
            <DialogDescription>{t('finance.subtitle')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t('finance.plan')}>
                <Select value={profileForm.plan} onValueChange={(value) => { setProfileForm((prev) => ({ ...prev, plan: value as BillingPlan })); setProfileError(null); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">{t('status.starter')}</SelectItem>
                    <SelectItem value="growth">{t('status.growth')}</SelectItem>
                    <SelectItem value="enterprise">{t('status.enterprise')}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t('common.status')}>
                <Select value={profileForm.status} onValueChange={(value) => { setProfileForm((prev) => ({ ...prev, status: value as BillingProfileStatus })); setProfileError(null); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('status.active')}</SelectItem>
                    <SelectItem value="grace">{t('status.grace')}</SelectItem>
                    <SelectItem value="suspended">{t('status.suspended')}</SelectItem>
                    <SelectItem value="canceled">{t('status.canceled')}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t('common.currency')}>
                <Select value={profileForm.currency} onValueChange={(value) => { setProfileForm((prev) => ({ ...prev, currency: value as Currency })); setProfileError(null); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PYG">PYG</SelectItem>
                    <SelectItem value="BRL">BRL</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t('finance.monthlyFee')}><Input type="number" value={profileForm.monthlyAmount} onChange={(e) => { setProfileForm((prev) => ({ ...prev, monthlyAmount: Number(e.target.value) })); setProfileError(null); }} /></Field>
            </div>
            <Field label={t('finance.notes')}><Input value={profileForm.notes} onChange={(e) => { setProfileForm((prev) => ({ ...prev, notes: e.target.value })); setProfileError(null); }} /></Field>
            {profileError ? <div className="text-sm text-destructive">{profileError}</div> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => resetProfileDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => void profileMutation.mutateAsync()} disabled={profileMutation.isPending}>{profileMutation.isPending ? t('common.loading') : t('finance.saveProfile')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted/40 p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-semibold text-foreground">{value}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label className="text-sm text-muted-foreground">{label}</label>{children}</div>;
}
