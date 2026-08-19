import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, DollarSign, FolderKanban, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getDashboardSummary } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { format, convert } = useCurrency();
  const { t } = useTranslation();
  // Os totais vem agregados do servidor: as listagens sao paginadas, entao somar
  // no cliente veria apenas uma fatia da base.
  const summaryQuery = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: getDashboardSummary });
  const summary = summaryQuery.data;

  const metrics = useMemo(() => {
    const monthlyRevenue = (summary?.metrics.monthlyRevenueByCurrency ?? []).reduce(
      (sum, entry) => sum + convert(entry.total, entry.currency),
      0,
    );

    return {
      activeTenants: summary?.metrics.activeTenants ?? 0,
      blockedProjects: summary?.metrics.blockedProjects ?? 0,
      overdueInvoices: summary?.metrics.overdueInvoices ?? 0,
      monthlyRevenue,
    };
  }, [convert, summary]);

  const chartData = useMemo(() => {
    // O servidor devolve uma linha por mes e moeda; a conversao para a moeda
    // exibida acontece aqui, onde a preferencia do usuario e conhecida.
    const grouped = new Map<string, number>();
    (summary?.issuedByMonth ?? []).forEach((entry) => {
      grouped.set(entry.month, (grouped.get(entry.month) || 0) + convert(entry.total, entry.currency));
    });
    return Array.from(grouped.entries()).map(([month, value]) => ({ month, value }));
  }, [convert, summary]);

  const recentTenants = summary?.recentTenants ?? [];
  const priorityProjects = summary?.priorityProjects ?? [];

  const metricCards = [
    { label: t('dashboard.activeTenants'), value: metrics.activeTenants, icon: Users, color: 'text-blue-500' },
    { label: t('dashboard.monthlyRevenue'), value: format(metrics.monthlyRevenue), icon: DollarSign, color: 'text-primary' },
    { label: t('dashboard.blockedProjects'), value: metrics.blockedProjects, icon: FolderKanban, color: 'text-amber-500' },
    { label: t('dashboard.overdueInvoices'), value: metrics.overdueInvoices, icon: AlertTriangle, color: 'text-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <Card key={card.label} className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
                </div>
                <card.icon className={`h-8 w-8 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle>{t('dashboard.issuedRevenue')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => format(value)} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number) => [format(value), t('dashboard.issuedLegend')]}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('dashboard.recentTenants')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTenants.map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                <div>
                  <p className="font-medium text-foreground">{tenant.displayName}</p>
                  <p className="text-sm text-muted-foreground">{tenant.slug}</p>
                </div>
                <Badge variant="outline">{t(`status.${tenant.status}`)}</Badge>
              </div>
            ))}
            {!recentTenants.length ? <p className="text-sm text-muted-foreground">{t('dashboard.noTenants')}</p> : null}
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('dashboard.focusedProvisioning')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                <div>
                  <p className="font-medium text-foreground">{project.name}</p>
                  <p className="text-sm text-muted-foreground">{project.tenant?.displayName || t('dashboard.tenantUnavailable')}</p>
                </div>
                <Badge variant="outline">{t(`status.${project.status}`)}</Badge>
              </div>
            ))}
            {!priorityProjects.length ? <p className="text-sm text-muted-foreground">{t('dashboard.noProjects')}</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
