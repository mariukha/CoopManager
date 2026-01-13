import React, { useState } from 'react';
import {
  LayoutDashboard, Users, Home, Building, Hammer,
  Wallet, FileText, Settings, Database, LogOut, Sun, Moon, Menu, X,
  FileSignature, CreditCard, CalendarDays,
} from 'lucide-react';
import type { UserRole } from '../hooks/useAuth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: string[];
}

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  userRole: UserRole;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Pulpit Główny', icon: LayoutDashboard, roles: ['admin'] },
  { id: 'budynek', label: 'Budynki', icon: Building, roles: ['admin'] },
  { id: 'mieszkanie', label: 'Mieszkania', icon: Home, roles: ['admin'] },
  { id: 'czlonek', label: 'Członkowie', icon: Users, roles: ['admin'] },
  { id: 'pracownik', label: 'Pracownicy', icon: Users, roles: ['admin'] },
  { id: 'naprawa', label: 'Naprawy', icon: Hammer, roles: ['admin', 'resident'] },
  { id: 'oplata', label: 'Opłaty', icon: Wallet, roles: ['admin', 'resident'] },
  { id: 'uslugi', label: 'Usługi', icon: Settings, roles: ['admin'] },
  { id: 'umowa', label: 'Umowy', icon: FileSignature, roles: ['admin'] },
  { id: 'konto_bankowe', label: 'Konta Bankowe', icon: CreditCard, roles: ['admin'] },
  { id: 'spotkanie_mieszkancow', label: 'Spotkania', icon: CalendarDays, roles: ['admin'] },
  { id: 'reports', label: 'Raporty Systemowe', icon: FileText, roles: ['admin'] },
  { id: 'system', label: 'Procedury PL/SQL', icon: Database, roles: ['admin'] },
];

const VIEWS_WITH_TITLE = ['dashboard', 'reports', 'system'];

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onNavigate,
  onLogout,
  isDarkMode,
  toggleDarkMode,
  userRole,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredNavItems = NAV_ITEMS.filter(item => item.roles.includes(userRole || 'resident'));

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  const getNavLabel = (item: NavItem): string => {
    if (userRole === 'resident') {
      if (item.id === 'oplata') return 'Moje Opłaty';
      if (item.id === 'naprawa') return 'Moje Naprawy';
    }
    return item.label;
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col shadow-xl 
          transition-transform duration-300 ease-in-out md:relative md:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Database className="text-blue-400" size={28} />
            <h1 className="text-xs font-bold tracking-tight uppercase leading-tight text-slate-100">
              System zarządzania<br />spółdzielnią mieszkaniową
            </h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
            aria-label="Zamknij menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4" aria-label="Główna nawigacja">
          <ul className="space-y-1 px-3">
            {filteredNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon size={18} />
                    {getNavLabel(item)}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 
              hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all group"
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            Wyloguj się
          </button>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 overflow-auto relative flex flex-col">
        <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10 px-4 md:px-8 py-5 flex items-center justify-between border-b dark:border-slate-800 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
              aria-label="Otwórz menu"
            >
              <Menu size={24} />
            </button>

            {VIEWS_WITH_TITLE.includes(currentView) && (
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white uppercase tracking-wide truncate">
                {NAV_ITEMS.find(n => n.id === currentView)?.label}
              </h2>
            )}
          </div>

          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-blue-400 
              hover:ring-2 ring-blue-500/50 transition-all active:scale-95"
            aria-label={isDarkMode ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
