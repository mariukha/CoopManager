import React, { useState, useEffect, useCallback } from 'react';
import { Play, FileText, RefreshCw, Calculator, Package, Wrench } from 'lucide-react';
import { db } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { Notification } from '../components/Notification';
import type { LogAudit, Mieszkanie } from '../types';

export const Procedures: React.FC = () => {
  const [logs, setLogs] = useState<LogAudit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [procent, setProcent] = useState(10);
  
  const [mieszkania, setMieszkania] = useState<Mieszkanie[]>([]);
  const [pracownicy, setPracownicy] = useState<Array<{id_pracownika: number; imie: string; nazwisko: string}>>([]);
  const [selectedMieszkanieForPkg, setSelectedMieszkanieForPkg] = useState<number>(0);
  const [selectedPracownikForPkg, setSelectedPracownikForPkg] = useState<number>(0);
  const [pkgResult, setPkgResult] = useState<string>('');
  
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
      const [m, p] = await Promise.all([
        db.getTableData<Mieszkanie>('mieszkanie'),
        db.getTableData<{id_pracownika: number; imie: string; nazwisko: string}>('pracownik'),
      ]);
      setMieszkania(m);
      setPracownicy(p);
      if (m.length > 0) setSelectedMieszkanieForPkg(m[0].id_mieszkania);
      if (p.length > 0) setSelectedPracownikForPkg(p[0].id_pracownika);
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    loadData();
  }, [fetchLogs, loadData]);

  const handleIncreaseFees = async () => {
    setIsLoading(true);
    try {
      await db.callProcedureIncreaseFees(procent);
      showNotification('Ceny usług zwiększone o ' + procent + '%', 'success');
      setTimeout(fetchLogs, 200);
    } catch {
      showNotification('Błąd podczas indeksacji opłat', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePackageSumaOplat = async () => {
    if (!selectedMieszkanieForPkg) return;
    setIsLoading(true);
    try {
      const result = await db.getApartmentFees(selectedMieszkanieForPkg);
      setPkgResult('Suma opłat: ' + (result.total_fees?.toFixed(2) || 0) + ' PLN');
      showNotification('Wywołano coop_pkg.suma_oplat_mieszkania', 'success');
    } catch {
      showNotification('Błąd wywołania funkcji', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePackagePoliczNaprawy = async () => {
    if (!selectedPracownikForPkg) return;
    setIsLoading(true);
    try {
      const result = await db.getWorkerRepairsCount(selectedPracownikForPkg);
      setPkgResult('Liczba napraw: ' + (result.repairs_count || 0));
      showNotification('Wywołano coop_pkg.policz_naprawy_pracownika', 'success');
    } catch {
      showNotification('Błąd wywołania funkcji', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationBadgeStyles = (operation: string): string => {
    if (operation === 'INSERT') return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    if (operation === 'UPDATE') return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Play size={20} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Procedury i Funkcje PL/SQL</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Lab 11, 12, 13</p>
        </div>
      </div>

      {/* Procedures Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Procedura zwieksz_oplaty - Lab 11 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Calculator size={18} className="text-blue-600" />
            <h3 className="font-medium text-slate-800 dark:text-white">zwieksz_oplaty</h3>
            <span className="text-[10px] text-slate-400 ml-auto">Lab 11</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Procedura zwiększa ceny wszystkich usług o podany procent
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={procent}
              onChange={(e) => setProcent(Number(e.target.value))}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
              min={1}
              max={100}
            />
            <span className="flex items-center text-slate-500 text-sm">%</span>
          </div>
          <button
            onClick={handleIncreaseFees}
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Play size={14} />
            Wykonaj
          </button>
        </div>

        {/* Package coop_pkg - Lab 12 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Package size={18} className="text-amber-600" />
            <h3 className="font-medium text-slate-800 dark:text-white">coop_pkg</h3>
            <span className="text-[10px] text-slate-400 ml-auto">Lab 12</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Pakiet z funkcjami: suma_oplat_mieszkania, policz_naprawy_pracownika
          </p>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                value={selectedMieszkanieForPkg}
                onChange={(e) => setSelectedMieszkanieForPkg(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
              >
                {mieszkania.map(m => (
                  <option key={m.id_mieszkania} value={m.id_mieszkania}>M. {m.numer}</option>
                ))}
              </select>
              <button
                onClick={handlePackageSumaOplat}
                disabled={isLoading}
                className="px-4 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                Suma opłat
              </button>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedPracownikForPkg}
                onChange={(e) => setSelectedPracownikForPkg(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
              >
                {pracownicy.map(p => (
                  <option key={p.id_pracownika} value={p.id_pracownika}>{p.imie} {p.nazwisko}</option>
                ))}
              </select>
              <button
                onClick={handlePackagePoliczNaprawy}
                disabled={isLoading}
                className="px-4 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                <Wrench size={12} className="inline mr-1" />
                Naprawy
              </button>
            </div>
            
            {pkgResult && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-300 text-sm font-medium">
                {pkgResult}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Logs - Lab 13 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-violet-600" />
            <h3 className="font-medium text-slate-800 dark:text-white">Historia zmian (Trigger)</h3>
            <span className="text-[10px] text-slate-400">Lab 13 — trg_audit_czlonek</span>
          </div>
          <button onClick={fetchLogs} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <RefreshCw size={16} className="text-slate-400" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">ID</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Członek</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Operacja</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Brak logów — dodaj lub edytuj członka
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id_logu} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">#{log.id_logu}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-white">ID: {log.id_czlonka}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getOperationBadgeStyles(log.operacja)}`}>
                        {log.operacja}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {log.data_zmiany ? new Date(log.data_zmiany).toLocaleString('pl-PL') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {notification && <Notification notification={notification} onClose={hideNotification} />}
    </div>
  );
};
