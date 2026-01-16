import React, { useState } from 'react';
import {
  LayoutDashboard, Users, Home, Building, Hammer,
  Wallet, FileText, Settings, Database, LogOut, Sun, Moon, Menu, X,
  FileSignature, CreditCard, CalendarDays, ChevronDown, ChevronRight,
  Wrench, BarChart3, UserCog,
} from 'lucide-react';
import type { UserRole } from '../hooks/useAuth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: string[];
  children?: NavItem[];
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
  { id: 'dashboard', label: 'Pulpit główny', icon: LayoutDashboard, roles: ['admin'] },
  {
    id: 'nieruchomosci',
    label: 'Nieruchomości',
    icon: Building,
    roles: ['admin'],
    children: [
      { id: 'budynek', label: 'Budynki', icon: Building, roles: ['admin'] },
      { id: 'mieszkanie', label: 'Mieszkania', icon: Home, roles: ['admin'] },
    ]
  },
  {
    id: 'mieszkancy',
    label: 'Mieszkańcy',
    icon: Users,
    roles: ['admin'],
    children: [
      { id: 'czlonek', label: 'Członkowie', icon: Users, roles: ['admin'] },
      { id: 'umowa', label: 'Umowy', icon: FileSignature, roles: ['admin'] },
      { id: 'konto_bankowe', label: 'Konta bankowe', icon: CreditCard, roles: ['admin'] },
    ]
  },
  {
    id: 'finanse',
    label: 'Finanse',
    icon: Wallet,
    roles: ['admin', 'resident'],
    children: [
      { id: 'oplata', label: 'Opłaty', icon: Wallet, roles: ['admin', 'resident'] },
      { id: 'uslugi', label: 'Cennik usług', icon: Settings, roles: ['admin'] },
    ]
  },
  {
    id: 'serwis',
    label: 'Serwis techniczny',
    icon: Wrench,
    roles: ['admin', 'resident'],
    children: [
      { id: 'naprawa', label: 'Zgłoszenia napraw', icon: Hammer, roles: ['admin', 'resident'] },
      { id: 'pracownik', label: 'Pracownicy', icon: UserCog, roles: ['admin'] },
    ]
  },
  { id: 'spotkanie_mieszkancow', label: 'Spotkania', icon: CalendarDays, roles: ['admin'] },
  { id: 'reports', label: 'Podsumowania', icon: FileText, roles: ['admin'] },
  { id: 'system', label: 'Narzędzia administratora', icon: Database, roles: ['admin'] },
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['finanse', 'serwis']);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const filteredNavItems = NAV_ITEMS.filter(item => item.roles.includes(userRole || 'resident'));

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.id === currentView) return true;
    if (item.children) {
      return item.children.some(child => child.id === currentView);
    }
    return false;
  };

  const getNavLabel = (item: NavItem): string => {
    if (userRole === 'resident') {
      if (item.id === 'oplata' || item.id === 'finanse') return 'Moje Opłaty';
      if (item.id === 'naprawa' || item.id === 'serwis') return 'Moje Naprawy';
    }
    return item.label;
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const Icon = item.icon;
    const isActive = isItemActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.includes(item.id);
    const filteredChildren = item.children?.filter(child => child.roles.includes(userRole || 'resident'));

    if (hasChildren && filteredChildren && filteredChildren.length > 0) {
      return (
        <li key={item.id}>
          <button
            onClick={() => toggleGroup(item.id)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all
              ${isActive
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <div className="flex items-center gap-3">
              <Icon size={18} className={isActive ? 'text-blue-400' : ''} />
              {getNavLabel(item)}
            </div>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {isExpanded && (
            <ul className="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-3">
              {filteredChildren.map(child => {
                const ChildIcon = child.icon;
                const isChildActive = currentView === child.id;
                return (
                  <li key={child.id}>
                    <button
                      onClick={() => handleNavigate(child.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                        ${isChildActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      aria-current={isChildActive ? 'page' : undefined}
                    >
                      <ChildIcon size={16} />
                      {child.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }

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
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col shadow-xl 
          transition-transform duration-300 ease-in-out md:relative md:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Building className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">
                Spółdzielnia
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">System zarządzania</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
            aria-label="Zamknij menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin" aria-label="Główna nawigacja">
          <ul className="space-y-1 px-3">
            {filteredNavItems.map(item => renderNavItem(item))}
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
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white capitalize">
                {NAV_ITEMS.find(n => n.id === currentView)?.label ||
                  NAV_ITEMS.flatMap(n => n.children || []).find(c => c.id === currentView)?.label}
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
