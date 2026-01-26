import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Users, ArrowRightLeft, Layers, Grid3X3, Link2, RefreshCw, X,
    Building, TrendingUp, Eye, Database, BarChart3, Shield, Zap, Activity
} from 'lucide-react';
import { db } from '../services/api';
import type { DatabaseRecord } from '../types';

interface ReportConfig {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    joinType: string;
    fetchFn: () => Promise<DatabaseRecord[] | DatabaseRecord>;
    isSingleRow?: boolean;
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
    // LAB 9: MATERIALIZED VIEWS
    {
        id: 'mv-dashboard',
        name: 'Statystyki keszowane',
        description: 'Szybkie statystyki z MV',
        icon: <Zap size={18} />,
        gradient: 'from-yellow-500 to-amber-600',
        joinType: 'MATERIALIZED VIEW',
        fetchFn: async () => {
            const data = await db.getDashboardStats();
            return [data]; // wrap single row as array
        },
        isSingleRow: true,
    },
    {
        id: 'mv-zuzycie',
        name: 'Zużycie wg budynków',
        description: 'Media per budynek (keszowane)',
        icon: <Activity size={18} />,
        gradient: 'from-emerald-500 to-green-600',
        joinType: 'MATERIALIZED VIEW',
        fetchFn: db.getZuzyciePerBudynek,
    },
    // LAB 9: INVISIBLE VIEW
    {
        id: 'invisible',
        name: 'Bezpieczne dane członków',
        description: 'Ukryte PESEL i telefon',
        icon: <Shield size={18} />,
        gradient: 'from-rose-500 to-pink-600',
        joinType: 'INVISIBLE VIEW',
        fetchFn: db.getCzlonekBezpieczny,
    },
];

export const JoinViews: React.FC = () => {
    const [selectedReport, setSelectedReport] = useState<ReportConfig | null>(null);
    const [reportData, setReportData] = useState<DatabaseRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadReportData = async (report: ReportConfig) => {
        setIsLoading(true);
        setSelectedReport(report);
        try {
            const data = await report.fetchFn();
            setReportData(Array.isArray(data) ? data : [data]);
        } catch (error) {
            console.error('Error loading report:', error);
            setReportData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedReport(null);
        setReportData([]);
    };

    const getColumns = (): string[] => {
        if (reportData.length === 0) return [];
        return Object.keys(reportData[0]);
    };

    const formatColumnName = (col: string): string => {
        return col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                        <TrendingUp size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Raporty zaawansowane</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Złożone analizy danych z wielu tabel</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <Database size={14} />
                        <span>8 raportów</span>
                    </div>
                </div>
            </div>

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

            {/* Modal with Report Data */}
            {selectedReport && createPortal(
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                    onClick={closeModal}
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
                                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                                    </button>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="overflow-auto max-h-[60vh]">
                            {isLoading ? (
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
                                            {getColumns().map(col => (
                                                <th key={col} className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">
                                                    {formatColumnName(col)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {reportData.slice(0, 100).map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                {getColumns().map(col => (
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
                                onClick={closeModal}
                                className={`px-6 py-2.5 text-white text-sm font-bold rounded-lg transition-all hover:shadow-lg bg-gradient-to-r ${selectedReport.gradient}`}
                            >
                                Zamknij
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
