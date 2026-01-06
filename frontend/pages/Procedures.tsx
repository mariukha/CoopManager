import React, { useState, useEffect, useCallback } from 'react';
import { Play, FileText, RefreshCw } from 'lucide-react';
import { db } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { Notification } from '../components/Notification';
import type { LogAudit } from '../types';

export const Procedures: React.FC = () => {
  const [logs, setLogs] = useState<LogAudit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { notification, showNotification, hideNotification } = useNotification();

  const fetchLogs = useCallback(async () => {
    try {
      const data = await db.getAuditLogs();
      setLogs(data);
    } catch {
      console.error('Błąd pobierania logów');
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleIncreaseFees = async () => {
    setIsLoading(true);
    try {
      await db.callProcedureIncreaseFees();
      showNotification('Sukces: Zaktualizowano zużycie we wszystkich opłatach o 10%.', 'success');
      setTimeout(fetchLogs, 200);
    } catch {
      showNotification('Błąd podczas indeksacji opłat.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFee = async () => {
    setIsLoading(true);
    try {
      const result = await db.callProcedureAddFee();
      showNotification(result, 'success');
      await new Promise(resolve => setTimeout(resolve, 150));
      await fetchLogs();
    } catch {
      showNotification('Błąd podczas dodawania opłaty.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationBadgeStyles = (operation: string): string => {
    if (operation === 'INSERT') {
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
    }
    if (operation === 'UPDATE') {
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    }
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all">
        <div className="p-10 border-b border-slate-50 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-[0.2em]">
            <Play size={20} className="text-blue-600" />
            Zarządzanie Logiką PL/SQL
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-2 uppercase tracking-widest">
            Uruchom procedury składowane bezpośrednio w bazie Oracle
          </p>
        </div>

        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border-2 border-slate-50 dark:border-slate-800/50 rounded-[2rem] p-8 hover:border-blue-200 dark:hover:border-blue-900 transition-all group bg-slate-50/30 dark:bg-slate-800/20">
            <h4 className="font-black text-slate-800 dark:text-slate-200 mb-2 uppercase text-sm">
              Procedura: zwieksz_oplaty
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-6 font-bold leading-relaxed uppercase tracking-tight">
              Zwiększa zużycie we wszystkich istniejących opłatach o 10%. Automatyczna aktualizacja kwot.
            </p>
            <button
              onClick={handleIncreaseFees}
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white text-[10px] font-black rounded-2xl 
                hover:bg-blue-600 dark:hover:bg-blue-700 transition-all flex items-center justify-center gap-3 
                uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Play size={14} />
              {isLoading ? 'Przetwarzanie...' : 'Uruchom indeksację'}
            </button>
          </div>

          <div className="border-2 border-slate-50 dark:border-slate-800/50 rounded-[2rem] p-8 hover:border-blue-200 dark:hover:border-blue-900 transition-all group bg-slate-50/30 dark:bg-slate-800/20">
            <h4 className="font-black text-slate-800 dark:text-slate-200 mb-2 uppercase text-sm">
              Funkcja: dodaj_oplate_fn
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-6 font-bold leading-relaxed uppercase tracking-tight">
              Generuje automatyczną opłatę w wysokości{' '}
              <span className="text-blue-600 dark:text-blue-400 font-black">100.00 PLN</span>{' '}
              dla pierwszego dostępnego lokalu.
            </p>
            <button
              onClick={handleAddFee}
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white text-[10px] font-black rounded-2xl 
                hover:bg-blue-600 dark:hover:bg-blue-700 transition-all flex items-center justify-center gap-3 
                uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Play size={14} />
              {isLoading ? 'Generowanie...' : 'Wystaw 100 PLN'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all">
        <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-[0.2em]">
              <FileText size={20} className="text-amber-600" />
              Historia zmian (Oracle Triggers)
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-2 uppercase tracking-widest">
              Zapisy z tabeli <code className="text-amber-500">log_zmian_czlonka</code>
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
            aria-label="Odśwież logi"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">ID Logu</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">ID Członka</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Operacja</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Data</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Użytkownik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 dark:text-slate-600 italic font-bold uppercase text-[10px] tracking-widest">
                    Brak logów w systemie
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id_logu} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-5 text-sm font-bold text-slate-700 dark:text-slate-300">
                      #{log.id_logu}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-500 dark:text-slate-400">
                      Członek: {log.id_czlonka}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getOperationBadgeStyles(log.operacja)}`}>
                        {log.operacja}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                      {new Date(log.data_operacji).toLocaleString('pl-PL')}
                    </td>
                    <td className="px-8 py-5 font-mono text-[10px] text-slate-400 dark:text-slate-600">
                      {log.uzytkownik}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {notification && (
        <Notification notification={notification} onClose={hideNotification} />
      )}
    </div>
  );
};
