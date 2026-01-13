import React, { useState, useEffect } from 'react';
import {
  FileBarChart, Users, Wallet, AlertCircle, RefreshCw,
  Home, Clock, ArrowRight, Wrench, Building2, X, Eye, CheckCircle2, Code,
} from 'lucide-react';
import { db } from '../services/api';
import type { SummaryReport } from '../types';

// Tabela funkcji z projektu
const FUNCTIONS_DATA = [
  { name: 'policz_rekordy(tabela)', lab: 13, description: 'Zlicza rekordy w podanej tabeli' },
  { name: 'pobierz_czlonkow_budynku(id)', lab: 11, description: 'Zwraca listę członków budynku (CURSOR)' },
  { name: 'dodaj_oplate_fn(mieszkanie, usluga, zuzycie)', lab: 11, description: 'Dodaje opłatę i oblicza kwotę automatycznie' },
  { name: 'zwieksz_oplaty(procent)', lab: 11, description: 'Procedura zwiększająca ceny usług' },
  { name: 'coop_pkg.suma_oplat_mieszkania(id)', lab: 12, description: 'Funkcja pakietu — suma opłat mieszkania' },
  { name: 'coop_pkg.policz_naprawy_pracownika(id)', lab: 12, description: 'Funkcja pakietu — liczba napraw pracownika' },
  { name: 'trg_audit_czlonek', lab: 13, description: 'Trigger logujący zmiany w tabeli czlonek' },
  { name: 'v_oplaty_summary', lab: 9, description: 'Widok z podsumowaniem opłat wg mieszkań' },
  { name: 'v_naprawy_status', lab: 9, description: 'Widok statusów napraw z CASE' },
];

export const Reports: React.FC = () => {
  const [data, setData] = useState<SummaryReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showOplatyModal, setShowOplatyModal] = useState(false);
  const [showNaprawyModal, setShowNaprawyModal] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await db.getSummaryReport();
      setData(response);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-8 rounded-xl text-center">
        <AlertCircle className="text-red-500 mx-auto mb-3" size={32} />
        <p className="text-red-600 dark:text-red-400 font-medium mb-4">Nie udało się pobrać danych</p>
        <button onClick={loadData} className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <FileBarChart size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Raporty systemowe</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Lab 8, 9 — JOIN, GROUP BY, VIEW</p>
          </div>
        </div>
        <button onClick={loadData} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Odśwież">
          <RefreshCw size={18} className="text-slate-400" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Wallet size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Przychód</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {data?.total_revenue?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} <span className="text-sm font-normal">PLN</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Mieszkańcy</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{data?.members_count}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Nieopłacone</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{data?.arrears_count}</p>
        </div>
      </div>

      {/* View Buttons - Lab 9 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setShowOplatyModal(true)}
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                <Building2 size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-white">Podsumowanie opłat wg mieszkań</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lab 9 — VIEW v_oplaty_summary</p>
              </div>
            </div>
            <Eye size={18} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          </div>
        </button>
        <button
          onClick={() => setShowNaprawyModal(true)}
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 text-left hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                <Wrench size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-white">Status napraw</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lab 9 — VIEW v_naprawy_status (CASE)</p>
              </div>
            </div>
            <Eye size={18} className="text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
          </div>
        </button>
      </div>

      {/* Podsumowanie finansowe + Zaległości - side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-medium text-slate-800 dark:text-white flex items-center gap-2 text-sm">
              <FileBarChart size={16} className="text-blue-600" />
              Podsumowanie finansowe
              <span className="text-[10px] text-slate-400 font-normal ml-auto">Lab 8</span>
            </h3>
          </div>
          <div className="p-4 space-y-2 flex-1 overflow-y-auto max-h-64">
            {data?.services_summary && data.services_summary.length > 0 ? (
              data.services_summary.map((service, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{service.nazwa_uslugi}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{service.total_zuzycie} {service.jednostka_miary}</p>
                  </div>
                  <p className="font-semibold text-blue-600 dark:text-blue-400 text-sm">{service.total_kwota?.toFixed(2)} PLN</p>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-4 text-sm">Brak danych</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-medium text-red-600 dark:text-red-400 flex items-center gap-2 text-sm">
              <Home size={16} />
              Zaległości wg lokali
              <span className="text-[10px] text-slate-400 font-normal ml-auto">Lab 8</span>
            </h3>
          </div>
          <div className="p-4 space-y-2 flex-1 overflow-y-auto max-h-64">
            {data?.unpaid_details && data.unpaid_details.length > 0 ? (
              data.unpaid_details.map((item, idx) => (
                <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white text-sm flex items-center gap-1">
                        <Home size={12} className="text-red-400" />
                        {item.adres}, m. {item.numer_mieszkania}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <ArrowRight size={10} /> {item.nazwa_uslugi}
                      </p>
                    </div>
                    <p className="font-semibold text-red-600 dark:text-red-400 text-sm">{item.kwota?.toFixed(2)} PLN</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-green-600 dark:text-green-400">
                <CheckCircle2 size={24} className="mx-auto mb-1" />
                <p className="font-medium text-sm">Brak zaległości</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela funkcji */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-medium text-slate-800 dark:text-white flex items-center gap-2 text-sm">
            <Code size={16} className="text-violet-600" />
            Funkcje zrealizowane w projekcie
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Lab</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Nazwa funkcji</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Opis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {FUNCTIONS_DATA.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold text-xs">
                      {item.lab}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-800 dark:text-white">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: v_oplaty_summary */}
      {showOplatyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowOplatyModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Podsumowanie opłat wg mieszkań</h3>
                    <p className="text-indigo-200 text-sm">VIEW v_oplaty_summary (Lab 9)</p>
                  </div>
                </div>
                <button onClick={() => setShowOplatyModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[50vh]">
              <table className="w-full text-left">
                <thead className="bg-indigo-50 dark:bg-indigo-900/20 sticky top-0">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold text-indigo-800 dark:text-indigo-300">Mieszkanie</th>
                    <th className="px-5 py-4 text-xs font-semibold text-indigo-800 dark:text-indigo-300 text-center">Liczba opłat</th>
                    <th className="px-5 py-4 text-xs font-semibold text-indigo-800 dark:text-indigo-300 text-right">Suma opłat</th>
                    <th className="px-5 py-4 text-xs font-semibold text-indigo-800 dark:text-indigo-300 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {data?.apartments_summary?.map((apt, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Home size={16} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <span className="font-medium text-slate-800 dark:text-white">{apt.numer}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                          {apt.liczba_oplat}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                        {apt.suma_oplat?.toFixed(2)} PLN
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                          apt.zaleglosci > 0 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}>
                          {apt.zaleglosci > 0 ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                          {apt.zaleglosci > 0 ? `${apt.zaleglosci?.toFixed(2)} PLN` : 'OK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-end">
              <button onClick={() => setShowOplatyModal(false)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: v_naprawy_status */}
      {showNaprawyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNaprawyModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Wrench size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Status napraw</h3>
                    <p className="text-amber-100 text-sm">VIEW v_naprawy_status z CASE (Lab 9)</p>
                  </div>
                </div>
                <button onClick={() => setShowNaprawyModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-5 max-h-[50vh] overflow-y-auto space-y-3">
              {data?.repairs_status?.map((repair, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-200 dark:border-slate-600 hover:border-amber-200 dark:hover:border-amber-800 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg mt-0.5">
                          <Wrench size={16} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{repair.opis}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                            <Users size={12} /> {repair.pracownik || 'Nieprzypisany'}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 italic">{repair.opis_statusu}</p>
                        </div>
                      </div>
                    </div>
                    <span className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${
                      repair.status === 'wykonana' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : repair.status === 'w trakcie'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}>
                      {repair.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-end">
              <button onClick={() => setShowNaprawyModal(false)} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors">
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
