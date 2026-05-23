import { LayoutDashboard, Users, FolderKanban, Receipt } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import novusioLogo from '@/assets/novusio-logo.png';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { state } = useSidebar();
  const { t } = useTranslation();
  const collapsed = state === 'collapsed';

  const items = [
    { title: t('nav.dashboard'), url: '/', icon: LayoutDashboard },
    { title: t('nav.tenants'), url: '/tenants', icon: Users },
    { title: t('nav.projects'), url: '/projects', icon: FolderKanban },
    { title: t('nav.finance'), url: '/finance', icon: Receipt },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              <img src={novusioLogo} alt={t('app.title')} className="h-6 w-6 object-contain" />
              {!collapsed && (
                <span className="text-xs font-bold tracking-wider uppercase text-primary">
                  {t('app.title')}
                </span>
              )}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-sidebar-accent/80"
                      activeClassName="bg-sidebar-primary/15 text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
