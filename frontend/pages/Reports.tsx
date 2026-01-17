import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    FileBarChart, Users, Wallet, AlertCircle, RefreshCw,
    Home, ArrowRight, Wrench, Building2, X, Eye, CheckCircle2, TrendingUp, PieChart,
} from 'lucide-react';
import { db } from '../services/api';
import type { SummaryReport } from '../types';

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
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-blue-600" />
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-12 rounded-2xl text-center">
                <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
                <p className="text-red-600 dark:text-red-400 font-bold text-lg mb-2">Nie udało się pobrać danych</p>
                <p className="text-red-500 dark:text-red-400/70 text-sm mb-6">Sprawdź połączenie z serwerem i spróbuj ponownie</p>
                <button onClick={loadData} className="bg-red-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                    Spróbuj ponownie
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <Wallet size={18} className="text-slate-600 dark:text-slate-300" />
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400">Łączny przychód</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {data?.total_revenue?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-500">PLN</span>
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <Users size={18} className="text-slate-600 dark:text-slate-300" />
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400">Liczba mieszkańców</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.members_count}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <AlertCircle size={18} className="text-slate-600 dark:text-slate-300" />
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400">Zaległe płatności</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.arrears_count}</p>
                </div>
            </div>

            {/* Quick View Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={() => setShowOplatyModal(true)}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                                <Building2 size={22} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white">Stan opłat wg mieszkań</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Podsumowanie naliczonych kwot i zaległości</p>
                            </div>
                        </div>
                        <Eye size={20} className="text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    </div>
                </button>
                <button
                    onClick={() => setShowNaprawyModal(true)}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 text-left hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                                <Wrench size={22} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white">Status zgłoszeń serwisowych</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Przegląd napraw w toku i zakończonych</p>
                            </div>
                        </div>
                        <Eye size={20} className="text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                    </div>
                </button>
            </div>

            {/* Side by side reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <TrendingUp size={18} className="text-blue-600" />
                            Przychody wg usług
                        </h3>
                    </div>
                    <div className="p-5 space-y-3 flex-1 overflow-y-auto max-h-80">
                        {data?.services_summary && data.services_summary.length > 0 ? (
                            data.services_summary.map((service, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">{service.nazwa_uslugi}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Zużycie: {service.total_zuzycie} {service.jednostka_miary}
                                        </p>
                                    </div>
                                    <p className="font-black text-blue-600 dark:text-blue-400">{service.total_kwota?.toFixed(2)} PLN</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-slate-400 py-8">Brak danych o przychodach</p>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-3">
                            <AlertCircle size={18} />
                            Zaległości wg lokali
                        </h3>
                    </div>
                    <div className="p-5 space-y-3 flex-1 overflow-y-auto max-h-80">
                        {data?.unpaid_details && data.unpaid_details.length > 0 ? (
                            data.unpaid_details.map((item, idx) => (
                                <div key={idx} className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                <Home size={14} className="text-red-400" />
                                                {item.adres}, m. {item.numer_mieszkania}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                <ArrowRight size={12} /> {item.nazwa_uslugi}
                                            </p>
                                        </div>
                                        <p className="font-black text-red-600 dark:text-red-400">{item.kwota?.toFixed(2)} PLN</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-green-600 dark:text-green-400">
                                <CheckCircle2 size={32} className="mx-auto mb-2" />
                                <p className="font-bold">Brak zaległości</p>
                                <p className="text-sm text-green-500 mt-1">Wszystkie płatności są aktualne</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: Stan opłat */}
            {
                showOplatyModal && createPortal(
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setShowOplatyModal(false)}>
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                            <Building2 size={22} className="text-slate-600 dark:text-slate-300" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Stan opłat wg mieszkań</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Podsumowanie naliczonych kwot i zaległości</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowOplatyModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto max-h-[55vh]">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Mieszkanie</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center uppercase">Liczba opłat</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 text-right uppercase">Suma opłat</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 text-right uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {data?.apartments_summary?.map((apt, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                                            <Home size={16} className="text-slate-600 dark:text-slate-400" />
                                                        </div>
                                                        <span className="font-medium text-slate-800 dark:text-white">{apt.numer}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                                                        {apt.liczba_oplat}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white text-lg">
                                                    {apt.suma_oplat?.toFixed(2)} PLN
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${apt.zaleglosci > 0
                                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                        }`}>
                                                        {apt.zaleglosci > 0 ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                                                        {apt.zaleglosci > 0 ? `${apt.zaleglosci?.toFixed(2)} PLN` : 'OK'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                                <button onClick={() => setShowOplatyModal(false)} className="px-6 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-lg transition-colors">
                                    Zamknij
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Modal: Status napraw */}
            {
                showNaprawyModal && createPortal(
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setShowNaprawyModal(false)}>
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                            <Wrench size={22} className="text-slate-600 dark:text-slate-300" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Status zgłoszeń serwisowych</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Przegląd napraw w toku i zakończonych</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowNaprawyModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 max-h-[55vh] overflow-y-auto space-y-3">
                                {data?.repairs_status?.map((repair, idx) => (
                                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg mt-0.5">
                                                        <Wrench size={16} className="text-slate-600 dark:text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800 dark:text-white">{repair.opis}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-2">
                                                            <Users size={14} /> {repair.pracownik || 'Nieprzypisany'}
                                                        </p>
                                                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1.5 italic">{repair.opis_statusu}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium ${repair.status === 'wykonana'
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

                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                                <button onClick={() => setShowNaprawyModal(false)} className="px-6 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-lg transition-colors">
                                    Zamknij
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
};
