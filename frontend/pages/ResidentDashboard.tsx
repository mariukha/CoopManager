import React, { useState, useEffect, useCallback } from 'react';
import {
    Wallet, Wrench, Calendar, BarChart3, Send, Clock, CheckCircle,
    AlertTriangle, Droplets, Flame, Trash2, Home, PlusCircle
} from 'lucide-react';
import { db } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { Notification } from '../components/Notification';
import type { DatabaseRecord } from '../types';

interface ResidentUser {
    id: number;
    imie: string;
    nazwisko: string;
    email: string;
    apt_id: number;
    apt_num: string;
    adres: string;
}

interface ResidentDashboardProps {
    user: ResidentUser;
}

type TabType = 'oplaty' | 'naprawy' | 'spotkania' | 'zuzycie';

const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<TabType>('oplaty');
    const [payments, setPayments] = useState<DatabaseRecord[]>([]);
    const [repairs, setRepairs] = useState<DatabaseRecord[]>([]);
    const [meetings, setMeetings] = useState<DatabaseRecord[]>([]);
    const [consumption, setConsumption] = useState<DatabaseRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [repairDesc, setRepairDesc] = useState('');
    const { notification, showNotification, hideNotification } = useNotification();

    const loadData = useCallback(async () => {
        if (!user.apt_id || user.apt_id <= 0) {
            return;
        }
        setIsLoading(true);
        try {
            const [paymentsData, repairsData, meetingsData, consumptionData] = await Promise.all([
                db.getResidentPayments(user.apt_id),
                db.getResidentRepairs(user.apt_id),
                db.getUpcomingMeetings(),
                db.getResidentConsumption(user.apt_id)
            ]);
            setPayments(paymentsData);
            setRepairs(repairsData);
            setMeetings(meetingsData);
            setConsumption(consumptionData);
        } catch (error) {
            console.error('Error loading data:', error);
            showNotification('Błąd ładowania danych', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [user.apt_id, showNotification]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSubmitRepair = async () => {
        if (!repairDesc.trim()) {
            showNotification('Wprowadź opis zgłoszenia', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await db.submitRepair(user.apt_id, repairDesc);
            showNotification('Zgłoszenie przyjęte!', 'success');
            setRepairDesc('');
            loadData();
        } catch {
            showNotification('Błąd wysyłania zgłoszenia', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: 'oplaty' as TabType, label: 'Moje opłaty', icon: Wallet },
        { id: 'naprawy' as TabType, label: 'Zgłoszenia', icon: Wrench },
        { id: 'spotkania' as TabType, label: 'Spotkania', icon: Calendar },
        { id: 'zuzycie' as TabType, label: 'Zużycie', icon: BarChart3 },
    ];

    const getStatusBadge = (status: string) => {
        if (status === 'oplacone' || status === 'wykonana') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    <CheckCircle size={12} /> {status === 'oplacone' ? 'Opłacone' : 'Wykonana'}
                </span>
            );
        }
        if (status === 'nieoplacone' || status === 'zgloszona') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    <Clock size={12} /> {status === 'nieoplacone' ? 'Do zapłaty' : 'Zgłoszona'}
                </span>
            );
        }
        if (status === 'w trakcie') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    <Wrench size={12} /> W trakcie
                </span>
            );
        }
        return <span className="text-xs text-slate-500">{status}</span>;
    };

    const getConsumptionIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('woda')) return <Droplets size={20} className="text-blue-500" />;
        if (lower.includes('ogrzew') || lower.includes('ciep')) return <Flame size={20} className="text-orange-500" />;
        if (lower.includes('śmieci') || lower.includes('wywoz')) return <Trash2 size={20} className="text-green-500" />;
        return <Home size={20} className="text-slate-500" />;
    };

    const totalUnpaid = payments.filter(p => p.status_oplaty === 'nieoplacone').reduce((sum, p) => sum + (Number(p.kwota) || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 sm:p-6 text-white">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Home size={24} className="sm:w-7 sm:h-7" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-bold truncate">{user.imie} {user.nazwisko}</h1>
                        <p className="text-blue-100 text-sm truncate">Mieszkanie {user.apt_num} • {user.adres}</p>
                    </div>
                </div>
                {totalUnpaid > 0 && (
                    <div className="mt-4 bg-white/10 rounded-xl p-3 sm:p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={18} />
                            <span className="text-sm sm:text-base">Do zapłaty:</span>
                        </div>
                        <span className="text-xl sm:text-2xl font-bold">{totalUnpaid.toFixed(2)} PLN</span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0
              ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <tab.icon size={14} className="sm:w-4 sm:h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

                {/* Moje opłaty */}
                {activeTab === 'oplaty' && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-600 mx-auto" />
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">Brak opłat</div>
                        ) : (
                            payments.map((p, i) => (
                                <div key={i} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 dark:text-white truncate">{String(p.nazwa_uslugi)}</p>
                                        <p className="text-xs text-slate-500">{String(p.zuzycie)} {String(p.jednostka_miary)}</p>
                                    </div>
                                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1">
                                        <p className="font-bold text-slate-800 dark:text-white">{Number(p.kwota).toFixed(2)} PLN</p>
                                        {getStatusBadge(String(p.status_oplaty))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Moje zgłoszenia */}
                {activeTab === 'naprawy' && (
                    <div>
                        {/* Form */}
                        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-medium text-slate-800 dark:text-white mb-2 sm:mb-3 flex items-center gap-2 text-sm">
                                <PlusCircle size={14} /> Nowe zgłoszenie
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    placeholder="Opisz problem..."
                                    value={repairDesc}
                                    onChange={(e) => setRepairDesc(e.target.value)}
                                    className="flex-1 px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                                />
                                <button
                                    onClick={handleSubmitRepair}
                                    disabled={isLoading}
                                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Send size={14} /> Wyślij
                                </button>
                            </div>
                        </div>
                        {/* List */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {repairs.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">Brak zgłoszeń</div>
                            ) : (
                                repairs.map((r, i) => (
                                    <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-800 dark:text-white">{String(r.opis)}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Zgłoszono: {String(r.data_zgloszenia)}
                                                    {r.pracownik ? <span> • Przydzielono: {String(r.pracownik)}</span> : null}
                                                </p>
                                            </div>
                                            {getStatusBadge(String(r.status))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Spotkania */}
                {activeTab === 'spotkania' && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {meetings.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">Brak nadchodzących spotkań</div>
                        ) : (
                            meetings.map((m, i) => (
                                <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                        <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800 dark:text-white">{String(m.temat)}</p>
                                        <p className="text-xs text-slate-500">{String(m.miejsce)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-slate-800 dark:text-white">{String(m.data_spotkania)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Zużycie */}
                {activeTab === 'zuzycie' && (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {consumption.length === 0 ? (
                            <div className="col-span-full p-8 text-center text-slate-500">Brak danych o zużyciu</div>
                        ) : (
                            consumption.map((c, i) => (
                                <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        {getConsumptionIcon(String(c.nazwa_uslugi))}
                                        <span className="font-medium text-slate-800 dark:text-white">{String(c.nazwa_uslugi)}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                                {String(c.zuzycie)} <span className="text-sm font-normal text-slate-500">{String(c.jednostka_miary)}</span>
                                            </p>
                                        </div>
                                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                            {Number(c.suma_kwot).toFixed(2)} PLN
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {notification && <Notification notification={notification} onClose={hideNotification} />}
        </div>
    );
};

export default ResidentDashboard;
