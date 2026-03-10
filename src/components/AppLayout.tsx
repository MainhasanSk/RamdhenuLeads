import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Users, BarChart3, Menu, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import logo from '@/assets/logo.png';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Add Lead', icon: UserPlus, path: '/add-lead' },
  { label: 'Leads', icon: Users, path: '/leads' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
          <img src={logo} alt="Junak Digital Dynamics" className="w-8 h-8 rounded-lg object-cover" />
          <div>
            <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">Junak Digital</h1>
            <p className="text-[10px] text-sidebar-muted tracking-wider uppercase">Dynamics CRM</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-sidebar-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
          
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" />
            Logout
          </button>
        </nav>

        <div className="p-4 mx-3 mb-4 rounded-lg bg-sidebar-accent">
          <p className="text-xs text-sidebar-muted">Lead Management System</p>
          <p className="text-[10px] text-sidebar-muted mt-0.5">v1.0 • Junak Digital Dynamics</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center gap-4 px-4 lg:px-8 border-b bg-card">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-medium text-foreground">{user?.email}</span>
              <span className="text-[10px] text-muted-foreground uppercase">Administrator</span>
            </div>
            <img src={logo} alt="User" className="w-9 h-9 rounded-full border border-border shadow-sm object-cover" />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
