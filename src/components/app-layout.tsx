import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useSignOut } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Home,
  LineChart,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useSignOut();
  const navigate = useNavigate();

  const links: { to: string; label: string; icon: React.ReactNode; roles?: string[] }[] = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
    { to: '/progress', label: 'My Progress', icon: <LineChart className="h-4 w-4" />, roles: ['student'] },
    { to: '/students', label: 'Students', icon: <Users className="h-4 w-4" />, roles: ['teacher', 'admin'] },
    { to: '/reports', label: 'Reports', icon: <LineChart className="h-4 w-4" />, roles: ['teacher', 'admin'] },
    { to: '/admin/questions', label: 'Question Bank', icon: <BookOpen className="h-4 w-4" />, roles: ['admin'] },
    { to: '/admin/generator', label: 'AI Generator', icon: <Sparkles className="h-4 w-4" />, roles: ['admin'] },
    { to: '/admin/drafts', label: 'Draft Review', icon: <ShieldCheck className="h-4 w-4" />, roles: ['admin'] },
    { to: '/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const visible = links.filter((l) => !l.roles || (profile && l.roles.includes(profile.role)));

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center gap-4 px-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-base font-semibold">
            <BookOpen className="h-5 w-5 text-primary" />
            MAP Test
          </Link>
          <nav className="hidden flex-1 md:flex">
            <ul className="flex items-center gap-1">
              {visible.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-secondary text-secondary-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )
                    }
                  >
                    {l.icon}
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right md:block">
              <div className="text-sm font-medium leading-none">{profile?.full_name}</div>
              <div className="text-xs capitalize text-muted-foreground">{profile?.role}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
        <nav className="border-t md:hidden">
          <ul className="container mx-auto flex flex-wrap gap-1 px-2 py-2">
            {visible.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium',
                      isActive
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )
                  }
                >
                  {l.icon}
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
