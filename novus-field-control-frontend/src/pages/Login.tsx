import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation, languageLabels } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Language } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Lock, Mail, Moon, Sun } from 'lucide-react';
import novusioLogo from '@/assets/novusio-logo.png';

export default function Login() {
  const { login } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('admin@novusfield.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('login.unexpected');
      const normalized = message.toLowerCase();

      if (normalized.includes('invalid credentials') || normalized.includes('unauthorized') || normalized.includes('credenciais')) {
        setError(t('login.invalidCredentials'));
      } else if (
        normalized.includes('failed to fetch') ||
        normalized.includes('networkerror') ||
        normalized.includes('network request failed') ||
        normalized.includes('load failed')
      ) {
        setError(t('login.backendUnavailable'));
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row animate-in fade-in duration-500 bg-background text-foreground">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--sidebar-background))_100%)]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)' }} />
        <div className="relative z-10 flex flex-col items-center text-center px-12 space-y-8">
          <img src={novusioLogo} alt={t('app.title')} className="w-40 h-40 object-contain drop-shadow-2xl" />
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-white">{t('app.title')}</h1>
            <p className="text-lg text-white/80 max-w-sm">{t('app.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-background">
        <div className="flex justify-end gap-2 p-6">
          <Button variant="ghost" size="icon" onClick={toggleTheme} title={t('theme.toggle')}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
            <SelectTrigger className="w-[160px] border-border bg-card/70 backdrop-blur-sm">
              <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(languageLabels) as [Language, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm space-y-8">
            <div className="flex flex-col items-center space-y-4 lg:hidden">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--sidebar-background)))]">
                <img src={novusioLogo} alt={t('app.title')} className="w-14 h-14 object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{t('app.title')}</h1>
            </div>

            <div className="hidden lg:block space-y-2">
              <h2 className="text-3xl font-bold text-foreground">{t('login.title')}</h2>
              <p className="text-muted-foreground">{t('login.subtitle')}</p>
            </div>

            <div className="lg:hidden text-center space-y-1">
              <h2 className="text-xl font-semibold text-foreground">{t('login.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('login.mobileSubtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('login.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-11 h-11 bg-card border-border focus:border-primary/50" value={email} onChange={e => { setEmail(e.target.value); setError(null); }} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('login.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-11 h-11 bg-card border-border focus:border-primary/50" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(null); }} />
                </div>
              </div>

              {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}

              <Button type="submit" className="w-full h-11 text-sm font-semibold bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--sidebar-background)))] hover:opacity-95" disabled={submitting}>
                {submitting ? t('login.submitting') : t('login.submit')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
