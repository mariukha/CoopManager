import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Plus, Search, Trash2 } from 'lucide-react';

import { Layout, NAV_ITEMS } from './components/Layout';
import { DataTable } from './components/DataTable';
import { Modal } from './components/Modal';
import { Notification } from './components/Notification';
import { LoginForm } from './components/LoginForm';

import { Dashboard } from './pages/Dashboard';
import { Procedures } from './pages/Procedures';
import { Reports } from './pages/Reports';
import { JoinViews } from './pages/JoinViews';
import ResidentDashboard from './pages/ResidentDashboard';

import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useNotification } from './hooks/useNotification';

import { db } from './services/api';
import { API_BASE_URL } from './config/constants';
import {
  TABLE_COLUMNS,
  FORM_FIELDS,
  DROPDOWN_FIELDS,
  NUMERIC_FIELDS,
  getPrimaryKeyField,
  formatDateForInput,
} from './config/tableConfig';
import {
  PAYMENT_STATUSES,
  REPAIR_STATUSES,
  MEASUREMENT_UNITS,
  CONTRACT_TYPES,
} from './config/constants';

import type { SortConfig, DatabaseRecord, Budynek, Mieszkanie, Pracownik, Uslugi, Czlonek } from './types';

const App: React.FC = () => {
  const { isLoggedIn, userRole, userData, isLoading: authLoading, loginAdmin, loginResident, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { notification, showNotification, hideNotification } = useNotification();

  const [currentView, setCurrentView] = useState(() => {
    const saved = localStorage.getItem('currentView');
    return saved || 'dashboard';
  });
  const [tableData, setTableData] = useState<DatabaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const [services, setServices] = useState<Uslugi[]>([]);
  const [employees, setEmployees] = useState<Pracownik[]>([]);
  const [apartments, setApartments] = useState<(Mieszkanie & { displayLabel: string })[]>([]);
  const [buildings, setBuildings] = useState<Budynek[]>([]);
  const [members, setMembers] = useState<Czlonek[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DatabaseRecord | null>(null);
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
    logout();
    localStorage.removeItem('currentView');
    setCurrentView('dashboard');
  }, [logout]);

  useEffect(() => {
    setSelectedIds([]);
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSortConfig(null);
  }, [currentView]);

  // LAB 8: Debounce dla wyszukiwania przez baze danych
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (isLoggedIn && userRole) {
      const saved = localStorage.getItem('currentView');
      const defaultView = userRole === 'admin' ? 'dashboard' : 'resident-dashboard';
      setCurrentView(saved || defaultView);
    }
  }, [isLoggedIn, userRole]);

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('currentView', currentView);
    }
  }, [currentView, isLoggedIn]);

  // LAB 8: SELECT z WHERE LIKE - wyszukiwanie przez baze danych
  const loadData = useCallback(async () => {
    const specialViews = ['dashboard', 'system', 'reports', 'join-views'];
    if (specialViews.includes(currentView)) return;
    if (!userRole) return;

    setIsLoading(true);
    try {
      let data: DatabaseRecord[];

      if (userRole === 'admin') {
        // LAB 8: Wyszukiwanie z WHERE LIKE przez baze danych
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 1) {
          data = await db.searchTableData(currentView, debouncedSearchTerm);
        } else {
          data = await db.getTableData(`${currentView}?t=${Date.now()}`);
        }
      } else {
        if (!userData?.apt_id || userData.apt_id <= 0) {
          setIsLoading(false);
          return;
        }
        const response = await axios.get(
          `${API_BASE_URL}/resident/my-data/${userData.apt_id}?t=${Date.now()}`
        );
        data = currentView === 'oplata' ? response.data.oplaty : response.data.naprawy;
      }

      setTableData(data || []);
    } catch (error) {
      console.error('loadData error:', { currentView, userRole, userData, error });
      showNotification('Blad ladowania danych.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentView, userRole, userData, debouncedSearchTerm, showNotification]);

  const loadDropdownData = useCallback(async () => {
    if (userRole !== 'admin') return;

    try {
      const [srvData, empData, aptData, bldData, memData] = await Promise.all([
        db.getTableData<Uslugi>('uslugi'),
        db.getTableData<Pracownik>('pracownik'),
        db.getTableData<Mieszkanie>('mieszkanie'),
        db.getTableData<Budynek>('budynek'),
        db.getTableData<Czlonek>('czlonek'),
      ]);

      setServices(srvData || []);
      setEmployees(empData || []);
      setBuildings(bldData || []);
      setMembers(memData || []);
      setApartments(
        (aptData || []).map(apt => ({
          ...apt,
          displayLabel: `${bldData?.find(b => b.id_budynku === apt.id_budynku)?.adres || `ID:${apt.id_budynku}`}, m. ${apt.numer}`,
        }))
      );
    } catch {
      console.error('Blad synchronizacji dropdownow');
    }
  }, [userRole]);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadData();
    loadDropdownData();
  }, [isLoggedIn, loadData, loadDropdownData]);

  // Przetwarzanie danych - sortowanie (filtrowanie jest teraz przez baze danych)
  const processedData = useMemo(() => {
    let result = [...tableData];

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal === bVal) return 0;

        const multiplier = sortConfig.direction === 'asc' ? 1 : -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * multiplier;
        }

        return String(aVal).localeCompare(String(bVal)) * multiplier;
      });
    }

    return result;
  }, [tableData, searchTerm, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSelectRow = (id: string | number) => {
    if (userRole !== 'admin') return;
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (userRole !== 'admin') return;

    if (selectedIds.length === processedData.length && processedData.length > 0) {
      setSelectedIds([]);
    } else {
      const idField = getPrimaryKeyField(tableData[0] || {});
      if (idField) {
        setSelectedIds(processedData.map(row => row[idField] as string | number));
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (userRole !== 'admin' || selectedIds.length === 0) return;
    if (!window.confirm(`Czy na pewno usunąć ${selectedIds.length} rekordów?`)) return;

    const idField = getPrimaryKeyField(tableData[0] || {});
    if (!idField) return;

    setIsLoading(true);
    try {
      for (const id of selectedIds) {
        await db.deleteRecord(currentView, idField, id);
      }
      showNotification('Usunięto pomyślnie.');
      setSelectedIds([]);
      await loadData();
    } catch {
      showNotification('Błąd usuwania.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (row: DatabaseRecord) => {
    if (userRole !== 'admin') return;
    if (!window.confirm('Usunąć ten rekord?')) return;

    const idField = getPrimaryKeyField(row);
    if (!idField) return;

    try {
      await db.deleteRecord(currentView, idField, row[idField] as string | number);
      showNotification('Pomyślnie usunięto.');
      await loadData();
    } catch {
      showNotification('Błąd usuwania.', 'error');
    }
  };

  const handleEdit = (item: DatabaseRecord) => {
    if (userRole !== 'admin') return;

    const formatted: Record<string, string | number> = {};
    Object.entries(item).forEach(([key, value]) => {
      if (key.includes('data') && value) {
        formatted[key] = formatDateForInput(String(value));
      } else {
        formatted[key] = value as string | number;
      }
    });

    setEditingItem(item);
    setFormData(formatted);
    setIsModalOpen(true);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [key]: value };

      if (currentView === 'oplata' && (key === 'zuzycie' || key === 'id_uslugi')) {
        const serviceId = key === 'id_uslugi' ? value : prev.id_uslugi;
        const consumption = parseFloat(key === 'zuzycie' ? value : String(prev.zuzycie || 0));
        const service = services.find(s => s.id_uslugi === Number(serviceId));

        if (service && !isNaN(consumption)) {
          newData.kwota = (service.cena_za_jednostke * consumption).toFixed(2);
        }
      }

      return newData;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const idField = editingItem ? getPrimaryKeyField(editingItem) : null;

      if (editingItem && idField) {
        await db.updateRecord(currentView, idField, editingItem[idField] as string | number, formData);
      } else {
        // Dodawanie nowej opłaty z automatycznym wyliczeniem kwoty
        if (currentView === 'oplata' && formData.id_mieszkania && formData.id_uslugi && formData.zuzycie) {
          const result = await db.callProcedureAddFee(
            Number(formData.id_mieszkania),
            Number(formData.id_uslugi),
            Number(formData.zuzycie)
          );
          showNotification(`Opłata została dodana: ${result}`, 'success');
        } else {
          await db.insertRecord(currentView, formData);
        }
      }

      setIsModalOpen(false);
      if (currentView !== 'oplata' || editingItem) {
        showNotification('Pomyślnie zapisano.');
      }
      await new Promise(resolve => setTimeout(resolve, 150));
      await loadData();
    } catch {
      showNotification('Błąd zapisu.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (credentials: { login: string; haslo: string }) => {
    setLoginError(null);
    const success = await loginAdmin(credentials);
    if (!success) {
      setLoginError('Błędne dane logowania');
    }
  };

  const handleResidentLogin = async (credentials: { email: string; numer: string }) => {
    setLoginError(null);
    const success = await loginResident(credentials);
    if (!success) {
      setLoginError('Błędne dane logowania');
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({});
    setIsModalOpen(true);
  };

  const renderFormInputs = () => {
    const fields = FORM_FIELDS[currentView] ||
      (tableData.length > 0 ? Object.keys(tableData[0]).filter(k => !k.startsWith('id_')) : []);

    return (
      <div className="grid grid-cols-1 gap-6">
        {fields.map(field => {
          const isDropdown = DROPDOWN_FIELDS.includes(field as typeof DROPDOWN_FIELDS[number]);
          const isNumeric = NUMERIC_FIELDS.includes(field as typeof NUMERIC_FIELDS[number]);
          const isDate = field.includes('data');
          const isReadOnly = field === 'kwota' && currentView === 'oplata';

          const inputType = isDate ? 'date' : (isNumeric ? 'number' : 'text');

          return (
            <div key={field} className="space-y-2 text-left">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                {field.replace(/_/g, ' ')}
              </label>

              {isDropdown ? (
                <select
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-600 dark:text-white"
                  value={formData[field] || ''}
                  onChange={e => handleInputChange(field, e.target.value)}
                  required={field !== 'id_pracownika'}
                >
                  <option value="">Wybierz...</option>
                  {field === 'id_budynku' && buildings.map(b => (
                    <option key={b.id_budynku} value={b.id_budynku}>{b.adres}</option>
                  ))}
                  {field === 'id_mieszkania' && apartments.map(a => (
                    <option key={a.id_mieszkania} value={a.id_mieszkania}>{a.displayLabel}</option>
                  ))}
                  {field === 'id_pracownika' && employees.map(p => (
                    <option key={p.id_pracownika} value={p.id_pracownika}>{p.imie} {p.nazwisko}</option>
                  ))}
                  {field === 'id_uslugi' && services.map(s => (
                    <option key={s.id_uslugi} value={s.id_uslugi}>{s.nazwa_uslugi}</option>
                  ))}
                  {field === 'id_czlonka' && members.map(m => (
                    <option key={m.id_czlonka} value={m.id_czlonka}>{m.imie} {m.nazwisko}</option>
                  ))}
                  {field === 'status' && REPAIR_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  {field === 'status_oplaty' && PAYMENT_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  {field === 'jednostka_miary' && MEASUREMENT_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                  {field === 'typ_umowy' && CONTRACT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={inputType}
                  className={`w-full rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 
                    px-4 py-4 text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 dark:text-white outline-none
                    ${isReadOnly ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                  value={formData[field] || ''}
                  onChange={e => handleInputChange(field, e.target.value)}
                  readOnly={isReadOnly}
                  required
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    // Resident dashboard
    if (userRole === 'resident' && currentView === 'resident-dashboard' && userData) {
      return <ResidentDashboard user={{
        id: userData.id,
        imie: userData.imie || '',
        nazwisko: userData.nazwisko || '',
        email: userData.email || '',
        apt_id: userData.apt_id || 0,
        apt_num: userData.apt_num || '',
        adres: userData.adres || ''
      }} />;
    }

    if (userRole === 'admin') {
      if (currentView === 'dashboard') return <Dashboard />;
      if (currentView === 'system') return <Procedures />;
      if (currentView === 'reports') return <Reports />;
      if (currentView === 'join-views') return <JoinViews />;
    }

    const columns = TABLE_COLUMNS[currentView] || [];

    const foundItem = NAV_ITEMS.find(n => n.id === currentView) ||
      NAV_ITEMS.flatMap(n => n.children || []).find(c => c.id === currentView);

    const pageTitle = userRole === 'resident'
      ? `Moje ${currentView === 'oplata' ? 'Opłaty' : 'Naprawy'}`
      : (foundItem?.label || currentView.replace(/_/g, ' '));

    return (
      <div className="animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {pageTitle}
            </h3>
            {userRole === 'resident' && (
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Portal Mieszkańca: Lok. {userData?.apt_num}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="relative group flex-grow md:flex-grow-0">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-600"
              />
              <input
                type="text"
                placeholder="Szukaj..."
                className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl 
                  py-3.5 pl-12 pr-6 text-sm font-bold outline-none focus:border-blue-600 dark:text-white w-full md:w-72 shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {userRole === 'admin' && (
              <button
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest 
                  shadow-xl flex items-center gap-3 active:scale-95 hover:bg-blue-700 transition-all"
              >
                <Plus size={18} /> Dodaj rekord
              </button>
            )}
          </div>
        </div>

        <DataTable
          loading={isLoading}
          data={processedData}
          columns={columns}
          onEdit={userRole === 'admin' ? handleEdit : undefined}
          onDelete={userRole === 'admin' ? handleDelete : undefined}
          selectedIds={userRole === 'admin' ? selectedIds : []}
          onSelectRow={userRole === 'admin' ? handleSelectRow : () => { }}
          onSelectAll={userRole === 'admin' ? handleSelectAll : () => { }}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <LoginForm
        onAdminLogin={handleAdminLogin}
        onResidentLogin={handleResidentLogin}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleTheme}
        isLoading={authLoading}
        error={loginError}
        onClearError={() => setLoginError(null)}
      />
    );
  }

  return (
    <Layout
      currentView={currentView}
      onNavigate={setCurrentView}
      onLogout={handleLogout}
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleTheme}
      userRole={userRole}
    >
      <div className="relative pb-24 min-h-[calc(100vh-10rem)] transition-colors duration-300">
        {renderContent()}
      </div>

      {userRole === 'admin' && selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-[19rem] z-[100] animate-in fade-in slide-in-from-bottom-5">
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-3 bg-red-600 text-white px-8 py-5 rounded-[2rem] font-black text-[11px] 
              uppercase tracking-widest shadow-2xl hover:bg-red-700 active:scale-95 transition-all"
          >
            <Trash2 size={18} />
            Usuń wybrane ({selectedIds.length})
          </button>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edytuj rekord' : 'Nowy wpis'}
      >
        <form onSubmit={handleSave} className="space-y-8">
          {renderFormInputs()}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[11px] 
              tracking-widest shadow-lg hover:bg-blue-700 transition-all"
          >
            Zapisz dane
          </button>
        </form>
      </Modal>

      {notification && (
        <Notification notification={notification} onClose={hideNotification} />
      )}
    </Layout>
  );
};

export default App;
