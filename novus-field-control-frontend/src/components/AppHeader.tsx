import { useAuth } from '@/contexts/AuthContext';
import { useTranslation, languageLabels } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Language } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Globe, LogOut, Moon, Sun } from 'lucide-react';

export function AppHeader() {
  const { logout, adminName } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75 flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground hidden sm:inline">{adminName}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} title={t('theme.toggle')} className="text-muted-foreground hover:text-foreground">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="sr-only">{t('theme.toggle')}</span>
        </Button>

        <Select value={language} onValueChange={v => setLanguage(v as Language)}>
          <SelectTrigger className="w-[140px] h-9 bg-muted/40 border-border text-sm">
            <Globe className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(languageLabels) as [Language, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" onClick={() => void logout()} className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">{t('nav.logout')}</span>
        </Button>
      </div>
    </header>
  );
}
