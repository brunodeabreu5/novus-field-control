import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createTenant, getTenant, updateTenant } from '@/lib/api';
import { useTranslation } from '@/contexts/LanguageContext';
import type { TenantPayload, TenantStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const defaultTenant: TenantPayload = {
  slug: '',
  companyCode: '',
  displayName: '',
  status: 'provisioning',
  apiBaseUrl: '',
  wsBaseUrl: '',
  webBaseUrl: '',
  assetsBaseUrl: '',
};

export default function TenantForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const isEdit = Boolean(id);
  const tenantQuery = useQuery({ queryKey: ['tenant', id], queryFn: () => getTenant(id!), enabled: isEdit });

  const [form, setForm] = useState<TenantPayload>(defaultTenant);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantQuery.data) {
      return;
    }

    setForm({
      slug: tenantQuery.data.slug,
      companyCode: tenantQuery.data.companyCode || '',
      displayName: tenantQuery.data.displayName,
      status: tenantQuery.data.status,
      apiBaseUrl: tenantQuery.data.apiBaseUrl,
      wsBaseUrl: tenantQuery.data.wsBaseUrl,
      webBaseUrl: tenantQuery.data.webBaseUrl,
      assetsBaseUrl: tenantQuery.data.assetsBaseUrl || '',
    });
  }, [tenantQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        companyCode: form.companyCode || undefined,
        assetsBaseUrl: form.assetsBaseUrl || undefined,
      };
      return isEdit ? updateTenant(id!, payload) : createTenant(payload);
    },
    onSuccess: async (tenant) => {
      await queryClient.invalidateQueries({ queryKey: ['tenants'] });
      await queryClient.invalidateQueries({ queryKey: ['tenant', tenant.id] });
      navigate(`/tenants/${tenant.id}`);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : t('tenantForm.saveError'));
    },
  });

  const title = useMemo(() => (isEdit ? t('tenantForm.editTitle') : t('tenantForm.createTitle')), [isEdit, t]);

  const setField = <K extends keyof TenantPayload>(key: K, value: TenantPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{t('tenantForm.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); void mutation.mutateAsync(); }} className="space-y-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader><CardTitle>{t('tenantForm.identification')}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t('tenantForm.displayName')}><Input value={form.displayName} onChange={(e) => setField('displayName', e.target.value)} required /></Field>
            <Field label={t('tenantForm.slug')}><Input value={form.slug} onChange={(e) => setField('slug', e.target.value)} required /></Field>
            <Field label={t('tenantForm.companyCode')}><Input value={form.companyCode || ''} onChange={(e) => setField('companyCode', e.target.value)} /></Field>
            <Field label={t('common.status')}>
              <Select value={form.status} onValueChange={(value) => setField('status', value as TenantStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="provisioning">{t('status.provisioning')}</SelectItem>
                  <SelectItem value="active">{t('status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                  <SelectItem value="suspended">{t('status.suspended')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader><CardTitle>{t('tenantForm.endpoints')}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t('tenantForm.apiUrl')}><Input value={form.apiBaseUrl} onChange={(e) => setField('apiBaseUrl', e.target.value)} required /></Field>
            <Field label={t('tenantForm.wsUrl')}><Input value={form.wsBaseUrl} onChange={(e) => setField('wsBaseUrl', e.target.value)} required /></Field>
            <Field label={t('tenantForm.webUrl')}><Input value={form.webBaseUrl} onChange={(e) => setField('webBaseUrl', e.target.value)} required /></Field>
            <Field label={t('tenantForm.assetsUrl')}><Input value={form.assetsBaseUrl || ''} onChange={(e) => setField('assetsBaseUrl', e.target.value)} /></Field>
          </CardContent>
        </Card>

        {error ? <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

        <div className="flex gap-3">
          <Button type="submit" disabled={mutation.isPending || tenantQuery.isLoading}>{mutation.isPending ? t('tenantForm.saving') : t('tenantForm.save')}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/tenants')}>{t('common.cancel')}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
