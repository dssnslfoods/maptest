import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useSignOut } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { AmbientBackground } from '@/components/ambient-background';
import { DeveloperFooter } from '@/components/developer-footer';
import { useAutoReplenisher } from '@/features/admin/use-auto-replenisher';
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
  // Admin browsers act as the Gemini worker for student replenishment.
  useAutoReplenisher();

  const links: { to: string; label: string; icon: React.ReactNode; roles?: string[] }[] = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
    { to: '/progress', label: 'Progress', icon: <LineChart className="h-4 w-4" />, roles: ['student'] },
    { to: '/students', label: 'Students', icon: <Users className="h-4 w-4" />, roles: ['teacher', 'admin'] },
    { to: '/reports', label: 'Reports', icon: <LineChart className="h-4 w-4" />, roles: ['teacher', 'admin'] },
    { to: '/admin/questions', label: 'Questions', icon: <BookOpen className="h-4 w-4" />, roles: ['admin'] },
    { to: '/admin/generator', label: 'AI', icon: <Sparkles className="h-4 w-4" />, roles: ['admin'] },
    { to: '/admin/drafts', label: 'Drafts', icon: <ShieldCheck className="h-4 w-4" />, roles: ['admin'] },
    { to: '/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const visible = links.filter((l) => !l.roles || (profile && l.roles.includes(profile.role)));
  const initials = (profile?.full_name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';

  return (
    <div className="flex min-h-screen flex-col">
      <AmbientBackground />

      <header className="sticky top-3 z-30 mx-3 md:mx-6">
        <div className="glass-strong mx-auto flex h-14 max-w-7xl items-center gap-3 rounded-2xl px-3 md:px-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-xl px-2 py-1 text-base font-semibold tracking-tight hover:bg-white/40"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]"
              style={{ backgroundImage: 'linear-gradient(135deg, hsl(235 88% 62%), hsl(280 80% 65%))' }}
            >
              <BookOpen className="h-4 w-4" />
            </span>
            MAP&nbsp;Test
          </Link>
          <nav className="hidden flex-1 md:flex">
            <ul className="flex items-center gap-0.5">
              {visible.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-white/85 text-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.9),0_6px_16px_-6px_rgba(70,80,160,0.25)]'
                          : 'text-foreground/70 hover:bg-white/45 hover:text-foreground',
                      )
                    }
                  >
                    {l.icon}
                    <span>{l.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl bg-white/40 px-2.5 py-1 backdrop-blur md:flex">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundImage: 'linear-gradient(135deg, hsl(235 88% 62%), hsl(330 80% 65%))' }}
              >
                {initials}
              </span>
              <div className="text-right">
                <div className="text-xs font-medium leading-none">{profile?.full_name}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {profile?.role}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <nav className="md:hidden">
          <div className="glass mx-auto mt-2 max-w-7xl rounded-2xl p-1.5">
            <ul className="flex gap-1 overflow-x-auto px-1 glass-scroll">
              {visible.map((l) => (
                <li key={l.to} className="shrink-0">
                  <NavLink
                    to={l.to}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium',
                        isActive
                          ? 'bg-white/85 text-foreground shadow'
                          : 'text-foreground/70 hover:bg-white/45',
                      )
                    }
                  >
                    {l.icon}
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      <main className="flex-1 pt-4">
        <Outlet />
      </main>
      <DeveloperFooter />
    </div>
  );
}
