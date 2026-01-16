import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Settings, RefreshCw, TrendingUp, UserPlus, CalendarPlus,
  CreditCard, Building, Hash, Wrench, Shield, Activity,
  Play, Package, FileText, Calculator, Users, Wallet,
  ArrowRightLeft, Layers, Grid3X3, Link2, X, Eye, Database, BarChart3
} from 'lucide-react';
import { db } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { Notification } from '../components/Notification';
import type { LogAudit, Mieszkanie, Budynek, DatabaseRecord } from '../types';

type TabType = 'tools' | 'members' | 'finance' | 'activity' | 'reports';

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  joinType: string;
  fetchFn: () => Promise<DatabaseRecord[]>;
}

const REPORTS: ReportConfig[] = [
  {
    id: 'right',
    name: 'Obciążenie pracowników',
    description: 'Wszystkie naprawy przypisane',
    icon: <ArrowRightLeft size={18} />,
    gradient: 'from-blue-500 to-blue-600',
    joinType: 'RIGHT JOIN',
    fetchFn: db.getPracownicyNaprawy,
  },
  {
    id: 'full',
    name: 'Zestawienie opłat',
    description: 'Pełna macierz usług i opłat',
    icon: <Layers size={18} />,
    gradient: 'from-purple-500 to-purple-600',
    joinType: 'FULL JOIN',
    fetchFn: db.getOplatyUslugiFull,
  },
  {
    id: 'cross',
    name: 'Matryca budynki-usługi',
    description: 'Wszystkie kombinacje',
    icon: <Grid3X3 size={18} />,
    gradient: 'from-orange-500 to-orange-600',
    joinType: 'CROSS JOIN',
    fetchFn: db.getBudynkiUslugiCross,
  },
  {
    id: 'self',
    name: 'Zespoły stanowiskowe',
    description: 'Pracownicy na tych samych stanowiskach',
    icon: <Link2 size={18} />,
    gradient: 'from-teal-500 to-teal-600',
    joinType: 'SELF JOIN',
    fetchFn: db.getPracownicyKoledzy,
  },
  {
    id: 'triple',
    name: 'Pełne dane mieszkańców',
    description: 'Członkowie + mieszkania + budynki',
    icon: <Users size={18} />,
    gradient: 'from-indigo-500 to-indigo-600',
    joinType: '3-TABLE JOIN',
    fetchFn: db.getCzlonkowiePelneInfo,
  },
];

export const Procedures: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('tools');
  const [logs, setLogs] = useState<LogAudit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [procent, setProcent] = useState(10);

  const [mieszkania, setMieszkania] = useState<Mieszkanie[]>([]);
  const [budynki, setBudynki] = useState<Budynek[]>([]);
  const [pracownicy, setPracownicy] = useState<Array<{ id_pracownika: number; imie: string; nazwisko: string }>>([]);
  const [kontoBank, setKontoBank] = useState<Array<{ id_konta: number; numer_konta: string; saldo: number }>>([]);

  const [selectedMieszkanieForPkg, setSelectedMieszkanieForPkg] = useState<number>(0);
  const [selectedPracownikForPkg, setSelectedPracownikForPkg] = useState<number>(0);
  const [selectedBudynekForPkg, setSelectedBudynekForPkg] = useState<number>(0);
  const [pkgResult, setPkgResult] = useState<string>('');

  const [czlonekForm, setCzlonekForm] = useState({ id_mieszkania: 0, imie: '', nazwisko: '', telefon: '', email: '' });
  const [spotkanieForm, setSpotkanieForm] = useState({ temat: '', miejsce: '', data: '' });
  const [kontaForm, setKontaForm] = useState({ id_konta: 0, nowe_saldo: 0 });

  const [dynamicTable, setDynamicTable] = useState('budynek');
  const [dynamicCount, setDynamicCount] = useState<number | null>(null);

  // Reports tab state
  const [selectedReport, setSelectedReport] = useState<ReportConfig | null>(null);
  const [reportData, setReportData] = useState<DatabaseRecord[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [showPkgResultModal, setShowPkgResultModal] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);

  const { notification, showNotification, hideNotification } = useNotification();

  const fetchLogs = useCallback(async () => {
    try {
      const data = await db.getAuditLogs();
      setLogs(data);
    } catch {
      console.error('Error fetching logs');
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [m, p, b, k] = await Promise.all([
        db.getTableData<Mieszkanie>('mieszkanie'),
        db.getTableData<{ id_pracownika: number; imie: string; nazwisko: string }>('pracownik'),
        db.getTableData<Budynek>('budynek'),
        db.getTableData<{ id_konta: number; numer_konta: string; saldo: number; id_czlonka: number }>('konto_bankowe'),
      ]);
      setMieszkania(m);
      setPracownicy(p);
      setBudynki(b);
      setKontoBank(k);
      if (m.length > 0) {
        setSelectedMieszkanieForPkg(m[0].id_mieszkania);
        setCzlonekForm(prev => ({ ...prev, id_mieszkania: m[0].id_mieszkania }));
      }
      if (p.length > 0) setSelectedPracownikForPkg(p[0].id_pracownika);
      if (b.length > 0) setSelectedBudynekForPkg(b[0].id_budynku);
      if (k.length > 0) setKontaForm(prev => ({ ...prev, id_konta: k[0].id_konta }));
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    loadData();
  }, [fetchLogs, loadData]);

  const handleIncreaseFees = async () => {
    if (!window.confirm(`Zwiększyć ceny usług o ${procent}%?`)) return;
    setIsLoading(true);
    try {
      await db.callProcedureIncreaseFees(procent);
      showNotification(`Ceny zwiększone o ${procent}%`, 'success');
    } catch {
      showNotification('Błąd indeksacji', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountRecords = async () => {
    setIsLoading(true);
    try {
      const result = await db.countRecords(dynamicTable);
      setDynamicCount(result.count);
      setShowCountModal(true);
    } catch {
      showNotification('Błąd zliczania', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePackageSumaOplat = async () => {
    if (!selectedMieszkanieForPkg) return;
    setIsLoading(true);
    try {
      const result = await db.getApartmentFees(selectedMieszkanieForPkg);
      setPkgResult(`Suma opłat: ${result.total_fees?.toFixed(2) || 0} PLN`);
      setShowPkgResultModal(true);
    } catch {
      showNotification('Błąd obliczania', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePackagePoliczNaprawy = async () => {
    if (!selectedPracownikForPkg) return;
    setIsLoading(true);
    try {
      const result = await db.getWorkerRepairsCount(selectedPracownikForPkg);
      setPkgResult(`Liczba napraw: ${result.repairs_count || 0}`);
      setShowPkgResultModal(true);
    } catch {
      showNotification('Błąd obliczania', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePackageStatystykiBudynku = async () => {
    if (!selectedBudynekForPkg) return;
    setIsLoading(true);
    try {
      const result = await db.pkgStatystykiBudynku(selectedBudynekForPkg);
      setPkgResult(result.statystyki || 'Brak danych');
      setShowPkgResultModal(true);
    } catch {
      showNotification('Błąd pobierania', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDodajCzlonka = async () => {
    if (!czlonekForm.imie || !czlonekForm.nazwisko) {
      showNotification('Uzupełnij imię i nazwisko', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const result = await db.procDodajCzlonka(czlonekForm);
      showNotification(`Dodano członka (ID: ${result.id_czlonka})`, 'success');
      setCzlonekForm({ id_mieszkania: mieszkania[0]?.id_mieszkania || 0, imie: '', nazwisko: '', telefon: '', email: '' });
      setTimeout(fetchLogs, 200);
    } catch {
      showNotification('Błąd dodawania', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDodajSpotkanie = async () => {
    if (!spotkanieForm.temat || !spotkanieForm.miejsce) {
      showNotification('Uzupełnij temat i miejsce', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const result = await db.funcDodajSpotkanie(spotkanieForm);
      showNotification(`Dodano spotkanie (nr: ${result.id_spotkania})`, 'success');
      setSpotkanieForm({ temat: '', miejsce: '', data: '' });
    } catch {
      showNotification('Błąd dodawania', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAktualizujSaldo = async () => {
    if (!kontaForm.id_konta) return;
    setIsLoading(true);
    try {
      await db.funcAktualizujSaldo(kontaForm.id_konta, kontaForm.nowe_saldo);
      showNotification('Saldo zaktualizowane', 'success');
      loadData();
    } catch {
      showNotification('Błąd aktualizacji', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationBadge = (op: string) => {
    if (op === 'INSERT') return 'bg-green-100 dark:bg-green-900/30 text-green-600';
    if (op === 'UPDATE') return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600';
    return 'bg-red-100 dark:bg-red-900/30 text-red-600';
  };

  // Reports tab functions
  const loadReportData = async (report: ReportConfig) => {
    setIsReportLoading(true);
    setSelectedReport(report);
    try {
      const data = await report.fetchFn();
      setReportData(data);
    } catch {
      setReportData([]);
    } finally {
      setIsReportLoading(false);
    }
  };

  const closeReportModal = () => {
    setSelectedReport(null);
    setReportData([]);
  };

  const getReportColumns = (): string[] => {
    if (reportData.length === 0) return [];
    return Object.keys(reportData[0]);
  };

  const formatColumnName = (col: string): string => {
    return col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const tabs = [
    { id: 'tools' as TabType, label: 'Narzędzia', icon: Settings },
    { id: 'members' as TabType, label: 'Dodawanie', icon: UserPlus },
    { id: 'finance' as TabType, label: 'Finanse', icon: TrendingUp },
    { id: 'activity' as TabType, label: 'Historia', icon: Activity },
    { id: 'reports' as TabType, label: 'Raporty', icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Narzędzia administratora</h2>
          <p className="text-xs text-slate-500">Procedury, funkcje, pakiety PL/SQL</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Indeksacja */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Calculator size={16} className="text-blue-600" />
              <span className="font-medium text-slate-800 dark:text-white text-sm">zwieksz_oplaty</span>
              <span className="text-[10px] text-slate-400 ml-auto">Procedura</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Zwiększa ceny usług o procent</p>
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={procent}
                onChange={(e) => setProcent(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm"
                min={1} max={100}
              />
              <span className="flex items-center text-slate-400 text-sm">%</span>
            </div>
            <button onClick={handleIncreaseFees} disabled={isLoading}
              className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Play size={14} /> Wykonaj
            </button>
          </div>

          {/* Dynamic SQL */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Hash size={16} className="text-violet-600" />
              <span className="font-medium text-slate-800 dark:text-white text-sm">policz_rekordy</span>
              <span className="text-[10px] text-slate-400 ml-auto">Dynamic SQL</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Zlicza rekordy w tabeli</p>
            <div className="flex gap-2 mb-3">
              <select value={dynamicTable} onChange={(e) => setDynamicTable(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm">
                {['budynek', 'mieszkanie', 'czlonek', 'pracownik', 'naprawa', 'oplata', 'uslugi'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button onClick={handleCountRecords} disabled={isLoading}
                className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50">
                Policz
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Dodaj Członka */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-green-600" />
              <span className="font-medium text-slate-800 dark:text-white text-sm">dodaj_czlonka</span>
              <span className="text-[10px] text-slate-400 ml-auto">Procedura</span>
            </div>
            <div className="space-y-2">
              <select value={czlonekForm.id_mieszkania} onChange={(e) => setCzlonekForm({ ...czlonekForm, id_mieszkania: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm">
                {mieszkania.map(m => (<option key={m.id_mieszkania} value={m.id_mieszkania}>Mieszkanie {m.numer}</option>))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Imię" value={czlonekForm.imie} onChange={(e) => setCzlonekForm({ ...czlonekForm, imie: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
                <input type="text" placeholder="Nazwisko" value={czlonekForm.nazwisko} onChange={(e) => setCzlonekForm({ ...czlonekForm, nazwisko: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
              </div>
              <input type="text" placeholder="Telefon" value={czlonekForm.telefon} onChange={(e) => setCzlonekForm({ ...czlonekForm, telefon: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
            </div>
            <button onClick={handleDodajCzlonka} disabled={isLoading}
              className="w-full mt-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <UserPlus size={14} /> Dodaj członka
            </button>
          </div>

          {/* Dodaj Spotkanie */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <CalendarPlus size={16} className="text-indigo-600" />
              <span className="font-medium text-slate-800 dark:text-white text-sm">dodaj_spotkanie</span>
              <span className="text-[10px] text-slate-400 ml-auto">Funkcja + Sequence</span>
            </div>
            <div className="space-y-2">
              <input type="text" placeholder="Temat spotkania" value={spotkanieForm.temat} onChange={(e) => setSpotkanieForm({ ...spotkanieForm, temat: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
              <input type="text" placeholder="Miejsce" value={spotkanieForm.miejsce} onChange={(e) => setSpotkanieForm({ ...spotkanieForm, miejsce: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
              <input type="date" value={spotkanieForm.data} onChange={(e) => setSpotkanieForm({ ...spotkanieForm, data: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
            </div>
            <button onClick={handleDodajSpotkanie} disabled={isLoading}
              className="w-full mt-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <CalendarPlus size={14} /> Zaplanuj spotkanie
            </button>
          </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="space-y-4">
          {/* Package Functions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Package size={16} className="text-amber-600" />
              <span className="font-medium text-slate-800 dark:text-white text-sm">coop_pkg</span>
              <span className="text-[10px] text-slate-400 ml-auto">Pakiet PL/SQL</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Suma opłat mieszkania</label>
                <div className="flex gap-2">
                  <select value={selectedMieszkanieForPkg} onChange={(e) => setSelectedMieszkanieForPkg(Number(e.target.value))}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm">
                    {mieszkania.map(m => (<option key={m.id_mieszkania} value={m.id_mieszkania}>M. {m.numer}</option>))}
                  </select>
                  <button onClick={handlePackageSumaOplat} disabled={isLoading}
                    className="px-3 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50">
                    <Wallet size={14} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Naprawy pracownika</label>
                <div className="flex gap-2">
                  <select value={selectedPracownikForPkg} onChange={(e) => setSelectedPracownikForPkg(Number(e.target.value))}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm">
                    {pracownicy.map(p => (<option key={p.id_pracownika} value={p.id_pracownika}>{p.imie}</option>))}
                  </select>
                  <button onClick={handlePackagePoliczNaprawy} disabled={isLoading}
                    className="px-3 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50">
                    <Wrench size={14} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Statystyki budynku</label>
                <div className="flex gap-2">
                  <select value={selectedBudynekForPkg} onChange={(e) => setSelectedBudynekForPkg(Number(e.target.value))}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm">
                    {budynki.map(b => (<option key={b.id_budynku} value={b.id_budynku}>{b.adres}</option>))}
                  </select>
                  <button onClick={handlePackageStatystykiBudynku} disabled={isLoading}
                    className="px-3 py-2 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50">
                    <Building size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Aktualizuj Saldo */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={16} className="text-emerald-600" />
              <span className="font-medium text-slate-800 dark:text-white text-sm">aktualizuj_saldo</span>
              <span className="text-[10px] text-slate-400 ml-auto">Procedura</span>
            </div>
            <div className="flex gap-2">
              <select value={kontaForm.id_konta} onChange={(e) => setKontaForm({ ...kontaForm, id_konta: Number(e.target.value) })}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm">
                {kontoBank.map(k => (<option key={k.id_konta} value={k.id_konta}>...{k.numer_konta.slice(-8)} ({k.saldo} PLN)</option>))}
              </select>
              <input type="number" step="0.01" placeholder="Nowe saldo" value={kontaForm.nowe_saldo}
                onChange={(e) => setKontaForm({ ...kontaForm, nowe_saldo: Number(e.target.value) })}
                className="w-32 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
              <button onClick={handleAktualizujSaldo} disabled={isLoading}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-violet-600" />
              <span className="font-medium text-slate-800 dark:text-white text-sm">Historia zmian (Trigger)</span>
              <span className="text-[10px] text-slate-400">trg_audit_czlonek</span>
            </div>
            <button onClick={fetchLogs} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              <RefreshCw size={14} className="text-slate-400" />
            </button>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500">ID</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500">Członek</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500">Operacja</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {logs.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">Brak logów</td></tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id_logu} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-slate-500">#{log.id_logu}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-white">ID: {log.id_czlonka}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getOperationBadge(log.operacja)}`}>
                          {log.operacja}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {log.data_zmiany ? new Date(log.data_zmiany).toLocaleString('pl-PL') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Reports Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {REPORTS.map((report) => (
              <button
                key={report.id}
                onClick={() => loadReportData(report)}
                className={`bg-gradient-to-br ${report.gradient} rounded-xl p-4 text-left text-white
                  hover:shadow-xl hover:scale-[1.02] transition-all duration-200 group relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                      {report.icon}
                    </div>
                    <Eye size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="font-semibold text-sm leading-tight mb-1">
                    {report.name}
                  </h4>
                  <p className="text-[10px] text-white/70 line-clamp-2 mb-2">
                    {report.description}
                  </p>
                  <span className="text-[9px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded">
                    {report.joinType}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Info Section */}
          <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                <Database size={16} className="text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Widoki łączące dane z wielu tabel</p>
                <p className="text-xs text-slate-500">Kliknij kartę aby wyświetlić dane z widoku</p>
              </div>
            </div>
            <div className="text-xs text-slate-400">
              RIGHT • FULL • CROSS • SELF • MULTI-TABLE JOIN
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {selectedReport && createPortal(
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={closeReportModal}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-5 text-white bg-gradient-to-r ${selectedReport.gradient}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur">
                    {selectedReport.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedReport.name}</h3>
                    <p className="text-white/70 text-xs">{selectedReport.joinType} • {selectedReport.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadReportData(selectedReport)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Odśwież"
                  >
                    <RefreshCw size={18} className={isReportLoading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={closeReportModal}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-auto max-h-[60vh]">
              {isReportLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-600" />
                </div>
              ) : reportData.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Building size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Brak danych</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                    <tr>
                      {getReportColumns().map(col => (
                        <th key={col} className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">
                          {formatColumnName(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {reportData.slice(0, 100).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        {getReportColumns().map(col => (
                          <td key={col} className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) :
                              <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {reportData.length > 0 && (
                  <>Wyświetlono <span className="font-semibold">{Math.min(reportData.length, 100)}</span> z <span className="font-semibold">{reportData.length}</span> rekordów</>
                )}
              </p>
              <button
                onClick={closeReportModal}
                className={`px-6 py-2.5 text-white text-sm font-bold rounded-lg transition-all hover:shadow-lg bg-gradient-to-r ${selectedReport.gradient}`}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Package Result Modal - Professional Design */}
      {showPkgResultModal && pkgResult && createPortal(
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowPkgResultModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                  <Package size={24} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Wynik operacji</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Pakiet PL/SQL • coop_pkg</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6">
                <p className="text-2xl font-bold text-slate-900 dark:text-white text-center">{pkgResult}</p>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Wykonano pomyślnie</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowPkgResultModal(false)}
                className="w-full px-4 py-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-lg transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Count Records Modal - Professional Design */}
      {showCountModal && dynamicCount !== null && createPortal(
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowCountModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-xl flex items-center justify-center">
                  <Hash size={24} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Wynik zapytania</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Dynamic SQL • policz_rekordy</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8">
                <div className="text-center">
                  <span className="text-5xl font-bold text-slate-900 dark:text-white">{dynamicCount}</span>
                  <p className="mt-2 text-slate-500 dark:text-slate-400">rekordów</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                <Database size={16} className="text-violet-600 dark:text-violet-400" />
                <span className="text-sm font-medium text-violet-700 dark:text-violet-300">Tabela: {dynamicTable}</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowCountModal(false)}
                className="w-full px-4 py-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-lg transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {notification && <Notification notification={notification} onClose={hideNotification} />}
    </div>
  );
};
