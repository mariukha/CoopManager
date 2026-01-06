import React, { useState, useEffect } from 'react';
import {
  FileBarChart, Users, Wallet, AlertCircle, RefreshCw,
  Home, Clock, ArrowRight,
} from 'lucide-react';
import { db } from '../services/api';
import type { SummaryReport } from '../types';

export const Reports: React.FC = () => {
  const [data, setData] = useState<SummaryReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await db.getSummaryReport();
      setData(response);
    } catch {
      setHasError(true);
      console.error('Błąd podczas pobierania raportów');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-[10px] tracking-widest">
          Odświeżanie statystyk...
        </p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-100 dark:border-red-900/30 p-10 rounded-[2.5rem] text-center">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
        <h3 className="text-red-900 dark:text-red-400 font-black uppercase text-sm mb-2">
          Błąd synchronizacji
        </h3>
        <p className="text-red-600 dark:text-red-500 text-xs mb-6">
          Nie udało się połączyć z serwerem bazy danych.
        </p>
        <button
          onClick={loadData}
          className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-red-700 transition-colors"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative group transition-colors">
          <div className="absolute -right-4 -top-4 bg-green-50 dark:bg-green-900/20 w-24 h-24 rounded-full transition-transform group-hover:scale-110" />
          <Wallet className="text-green-500 mb-4 relative" size={32} />
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest relative">
            Przychód całkowity
          </p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 relative">
            {data?.total_revenue?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}{' '}
            <span className="text-sm">PLN</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative group transition-colors">
          <div className="absolute -right-4 -top-4 bg-blue-50 dark:bg-blue-900/20 w-24 h-24 rounded-full transition-transform group-hover:scale-110" />
          <Users className="text-blue-500 mb-4 relative" size={32} />
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest relative">
            Mieszkańcy
          </p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 relative">
            {data?.members_count}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative group transition-colors">
          <div className="absolute -right-4 -top-4 bg-red-50 dark:bg-red-900/20 w-24 h-24 rounded-full transition-transform group-hover:scale-110" />
          <AlertCircle className="text-red-500 mb-4 relative" size={32} />
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest relative">
            Zaległe faktury
          </p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 relative">
            {data?.arrears_count}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200 flex items-center gap-3">
              <FileBarChart size={20} className="text-blue-600" />
              Podsumowanie finansowe
            </h3>
            <button
              onClick={loadData}
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500"
              title="Odśwież raport"
              aria-label="Odśwież raport"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="space-y-6">
            {data?.services_summary && data.services_summary.length > 0 ? (
              data.services_summary.map((service, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 group hover:border-blue-200 dark:hover:border-blue-900 transition-all"
                >
                  <div>
                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase">
                      {service.nazwa_uslugi}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 tracking-widest uppercase">
                      Zużycie: {service.total_zuzycie} {service.jednostka_miary}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {service.total_kwota?.toFixed(2)} PLN
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 dark:text-slate-600 text-xs font-bold py-10 uppercase tracking-widest">
                Brak danych o usługach
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-red-600 mb-10 flex items-center gap-3">
            <Home size={20} />
            Zaległości wg Lokali
          </h3>

          <div className="space-y-4">
            {data?.unpaid_details && data.unpaid_details.length > 0 ? (
              data.unpaid_details.map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-red-50/30 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 relative group overflow-hidden hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Home size={16} className="text-red-400" />
                        <p className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase">
                          {item.adres}, m. {item.numer_mieszkania}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 ml-6">
                        <ArrowRight size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {item.nazwa_uslugi}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-red-600 dark:text-red-400">
                        {item.kwota?.toFixed(2)}
                      </p>
                      <p className="text-[10px] font-black text-red-300 dark:text-red-900 uppercase">
                        PLN
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-5 ml-6">
                    <Clock size={14} className="text-red-300 dark:text-red-800" />
                    <span className="text-[10px] font-black text-red-400 dark:text-red-600 uppercase tracking-widest">
                      Termin minął: {item.data_platnosci ? new Date(item.data_platnosci).toLocaleDateString('pl-PL') : 'Brak terminu'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-green-600 dark:text-green-400">
                <p className="font-black uppercase text-sm">Brak zaległości</p>
                <p className="text-[10px] uppercase tracking-widest mt-1">
                  Wszystkie opłaty uregulowane
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
