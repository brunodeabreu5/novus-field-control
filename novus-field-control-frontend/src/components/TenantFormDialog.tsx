import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTenant, deleteTenant, getTenant, updateTenant } from '@/lib/api';
import { useTranslation } from '@/contexts/LanguageContext';
import { buildTenantEndpoints, normalizeBaseDomain } from '@/lib/tenant-domain';
import type { Tenant, TenantPayload, TenantStatus } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

const defaultTenant: TenantPayload = {
  slug: '',
  companyCode: '',
  displayName: '',
  status: 'provisioning',
  baseDomain: '',
  apiBaseUrl: '',
  wsBaseUrl: '',
  webBaseUrl: '',
  assetsBaseUrl: '',
};

type EndpointKey = 'apiBaseUrl' | 'wsBaseUrl' | 'webBaseUrl' | 'assetsBaseUrl';

type EndpointCustomization = Record<EndpointKey, boolean>;

const defaultCustomization: EndpointCustomization = {
  apiBaseUrl: false,
  wsBaseUrl: false,
  webBaseUrl: false,
  assetsBaseUrl: false,
};

interface TenantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string | null;
  onSuccess?: (tenant: Tenant) => void;
  onDelete?: (tenantId: string) => void;
}

export function TenantFormDialog({ open, onOpenChange, tenantId, onSuccess, onDelete }: TenantFormDialogProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const isEdit = Boolean(tenantId);
  const [form, setForm] = useState<TenantPayload>(defaultTenant);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customized, setCustomized] = useState<EndpointCustomization>(defaultCustomization);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const tenantQuery = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => getTenant(tenantId!),
    enabled: open && isEdit,
  });

  const endpointPreview = useMemo(() => buildTenantEndpoints(form.baseDomain), [form.baseDomain]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setShowAdvanced(false);
      setCustomized(defaultCustomization);
      setForm(defaultTenant);
      setDeleteOpen(false);
      return;
    }

    if (!isEdit) {
      setForm(defaultTenant);
      setShowAdvanced(false);
      setCustomized(defaultCustomization);
      setDeleteOpen(false);
      return;
    }

    if (!tenantQuery.data) {
      return;
    }

    const derived = buildTenantEndpoints(tenantQuery.data.baseDomain);
    const nextCustomization: EndpointCustomization = {
      apiBaseUrl: tenantQuery.data.apiBaseUrl !== derived.apiBaseUrl,
      wsBaseUrl: tenantQuery.data.wsBaseUrl !== derived.wsBaseUrl,
      webBaseUrl: tenantQuery.data.webBaseUrl !== derived.webBaseUrl,
      assetsBaseUrl: (tenantQuery.data.assetsBaseUrl || derived.assetsBaseUrl) !== derived.assetsBaseUrl,
    };

    setCustomized(nextCustomization);
    setShowAdvanced(Object.values(nextCustomization).some(Boolean));
    setForm({
      slug: tenantQuery.data.slug,
      companyCode: tenantQuery.data.companyCode || '',
      displayName: tenantQuery.data.displayName,
      status: tenantQuery.data.status,
      baseDomain: tenantQuery.data.baseDomain,
      apiBaseUrl: tenantQuery.data.apiBaseUrl,
      wsBaseUrl: tenantQuery.data.wsBaseUrl,
      webBaseUrl: tenantQuery.data.webBaseUrl,
      assetsBaseUrl: tenantQuery.data.assetsBaseUrl || derived.assetsBaseUrl,
    });
  }, [isEdit, open, tenantQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: TenantPayload = {
        slug: form.slug,
        companyCode: form.companyCode || undefined,
        displayName: form.displayName,
        status: form.status,
        baseDomain: normalizeBaseDomain(form.baseDomain),
        ...(customized.apiBaseUrl ? { apiBaseUrl: form.apiBaseUrl } : {}),
        ...(customized.wsBaseUrl ? { wsBaseUrl: form.wsBaseUrl } : {}),
        ...(customized.webBaseUrl ? { webBaseUrl: form.webBaseUrl } : {}),
        ...(customized.assetsBaseUrl ? { assetsBaseUrl: form.assetsBaseUrl } : {}),
      };

      return isEdit ? updateTenant(tenantId!, payload) : createTenant(payload);
    },
    onSuccess: async (tenant) => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['tenants'] });
      await queryClient.invalidateQueries({ queryKey: ['tenant', tenant.id] });
      onSuccess?.(tenant);
      onOpenChange(false);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : t('tenantForm.saveError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => deleteTenant(tenantId!),
    onSuccess: async () => {
      setError(null);
      setDeleteOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['tenants'] });
      if (tenantId) {
        await queryClient.removeQueries({ queryKey: ['tenant', tenantId] });
      }
      toast({
        title: t('tenantForm.deleteSuccessTitle'),
        description: t('tenantForm.deleteSuccessDescription'),
      });
      onDelete?.(tenantId!);
      onOpenChange(false);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : t('tenantForm.deleteError'));
      setDeleteOpen(false);
    },
  });

  const title = useMemo(
    () => (isEdit ? t('tenantForm.editTitle') : t('tenantForm.createTitle')),
    [isEdit, t],
  );

  const setField = <K extends keyof TenantPayload>(key: K, value: TenantPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleBaseDomainChange = (value: string) => {
    const normalized = normalizeBaseDomain(value);
    const derived = buildTenantEndpoints(normalized);

    setForm((prev) => ({
      ...prev,
      baseDomain: value,
      apiBaseUrl: customized.apiBaseUrl ? prev.apiBaseUrl : derived.apiBaseUrl,
      wsBaseUrl: customized.wsBaseUrl ? prev.wsBaseUrl : derived.wsBaseUrl,
      webBaseUrl: customized.webBaseUrl ? prev.webBaseUrl : derived.webBaseUrl,
      assetsBaseUrl: customized.assetsBaseUrl ? prev.assetsBaseUrl : derived.assetsBaseUrl,
    }));
    setError(null);
  };

  const handleEndpointChange = (key: EndpointKey, value: string) => {
    setCustomized((prev) => ({ ...prev, [key]: value !== endpointPreview[key] }));
    setField(key, value);
  };

  const endpointRows: Array<{ key: EndpointKey; label: string; value: string }> = [
    { key: 'apiBaseUrl', label: t('tenantForm.apiUrl'), value: endpointPreview.apiBaseUrl },
    { key: 'wsBaseUrl', label: t('tenantForm.wsUrl'), value: endpointPreview.wsBaseUrl },
    { key: 'webBaseUrl', label: t('tenantForm.webUrl'), value: endpointPreview.webBaseUrl },
    { key: 'assetsBaseUrl', label: t('tenantForm.assetsUrl'), value: endpointPreview.assetsBaseUrl },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t('tenantForm.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t('tenantForm.identification')}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t('tenantForm.connectivity')}</h3>
            <div className="space-y-4">
              <Field label={t('tenantForm.baseDomain')}>
                <Input
                  value={form.baseDomain}
                  onChange={(e) => handleBaseDomainChange(e.target.value)}
                  placeholder="acme.seusistema.com"
                  required
                />
              </Field>

              <div className="rounded-lg border border-border bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('tenantForm.endpointPreview')}</p>
                    <p className="text-xs text-muted-foreground">{t('tenantForm.autoGeneratedHint')}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdvanced((prev) => !prev)}>
                    {showAdvanced ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                    {showAdvanced ? t('tenantForm.hideAdvanced') : t('tenantForm.showAdvanced')}
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {endpointRows.map((endpoint) => (
                    <div key={endpoint.key} className="rounded-md border border-border bg-card px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{endpoint.label}</p>
                      <p className="mt-1 break-all text-sm font-medium text-foreground">{endpoint.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {showAdvanced ? (
                <div className="rounded-lg border border-border bg-background/70 p-4">
                  <p className="mb-4 text-sm font-medium text-foreground">{t('tenantForm.advancedMode')}</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {endpointRows.map((endpoint) => (
                      <Field
                        key={endpoint.key}
                        label={`${endpoint.label}${customized[endpoint.key] ? ` • ${t('tenantForm.customized')}` : ''}`}
                      >
                        <Input
                          value={(form[endpoint.key] as string) || ''}
                          onChange={(e) => handleEndpointChange(endpoint.key, e.target.value)}
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {tenantQuery.isLoading ? <div className="text-sm text-muted-foreground">{t('tenantDetail.loading')}</div> : null}
          {error ? <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
        </div>

        <DialogFooter>
          {isEdit ? (
            <Button
              type="button"
              variant="destructive"
              className="mr-auto"
              onClick={() => setDeleteOpen(true)}
              disabled={mutation.isPending || deleteMutation.isPending || tenantQuery.isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('tenantForm.delete')}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button
            type="button"
            onClick={() => void mutation.mutateAsync()}
            disabled={mutation.isPending || deleteMutation.isPending || tenantQuery.isLoading}
          >
            {mutation.isPending ? t('tenantForm.saving') : t('tenantForm.save')}
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tenantForm.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('tenantForm.deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void deleteMutation.mutateAsync();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t('tenantForm.deleting') : t('tenantForm.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
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
