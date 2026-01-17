import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Users, Wallet, Building2, X, Database, Home, FileText, Wrench, Zap, Briefcase } from 'lucide-react';
import { db } from '../services/api';

interface DashboardStats {
  tableStats: Record<string, number>;
  totalFees: number;
  buildings: Array<{ id_budynku: number; adres: string }>;
}

const TABLE_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  budynek: { label: 'Budynki', icon: <Building2 size={18} />, color: 'from-blue-500 to-blue-600' },
  mieszkanie: { label: 'Mieszkania', icon: <Home size={18} />, color: 'from-emerald-500 to-emerald-600' },
  czlonek: { label: 'Członkowie', icon: <Users size={18} />, color: 'from-violet-500 to-violet-600' },
  pracownik: { label: 'Pracownicy', icon: <Briefcase size={18} />, color: 'from-amber-500 to-amber-600' },
  naprawa: { label: 'Naprawy', icon: <Wrench size={18} />, color: 'from-rose-500 to-rose-600' },
  oplata: { label: 'Opłaty', icon: <Wallet size={18} />, color: 'from-cyan-500 to-cyan-600' },
  umowa: { label: 'Umowy', icon: <FileText size={18} />, color: 'from-indigo-500 to-indigo-600' },
  uslugi: { label: 'Usługi', icon: <Zap size={18} />, color: 'from-pink-500 to-pink-600' },
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    tableStats: {},
    totalFees: 0,
    buildings: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<{ id: number; adres: string } | null>(null);
  const [buildingMembers, setBuildingMembers] = useState<string>('');
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const tables = ['budynek', 'mieszkanie', 'czlonek', 'pracownik', 'naprawa', 'oplata', 'umowa', 'uslugi'];

      const [countsResults, payments, buildings] = await Promise.all([
        Promise.all(tables.map(async (table) => {
          try {
            const result = await db.countRecords(table);
            return { table, count: result.count };
          } catch {
            return { table, count: 0 };
          }
        })),
        db.getTableData('oplata'),
        db.getTableData<{ id_budynku: number; adres: string }>('budynek'),
      ]);

      const tableStats = countsResults.reduce((acc, { table, count }) => {
        acc[table] = count;
        return acc;
      }, {} as Record<string, number>);

      const totalFees = payments.reduce((sum, p) => sum + (Number(p.kwota) || 0), 0);

      setStats({ tableStats, totalFees, buildings });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleShowBuildingMembers = async (buildingId: number, adres: string) => {
    setSelectedBuilding({ id: buildingId, adres });
    setIsMembersModalOpen(true);
    setLoadingMembers(true);
    setBuildingMembers('');

    try {
      const result = await db.getMembersOfBuilding(buildingId);
      setBuildingMembers(result.members || 'Brak członków');
    } catch {
      setBuildingMembers('Błąd pobierania');
    } finally {
      setLoadingMembers(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(stats.tableStats).map(([table, count]) => {
          const info = TABLE_INFO[table];
          return (
            <div
              key={table}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {info.icon}
                </div>
                <span className="text-2xl font-bold text-slate-800 dark:text-white">
                  {count}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {info.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Summary Card */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Suma wszystkich opłat</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.totalFees.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
            </p>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl">
            <Wallet size={28} className="text-slate-500 dark:text-slate-400" />
          </div>
        </div>
      </div>

      {/* Buildings Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <Building2 size={20} className="text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              Budynki
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kliknij budynek by zobaczyć listę mieszkańców
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.buildings.map((building) => (
            <button
              key={building.id_budynku}
              onClick={() => handleShowBuildingMembers(building.id_budynku, building.adres)}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 
                text-left hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
                  <Building2 size={18} className="text-slate-600 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-white truncate">
                    {building.adres}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Zobacz członków →
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Members Modal */}
      {isMembersModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setIsMembersModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  {selectedBuilding?.adres}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lista członków budynku
                </p>
              </div>
              <button
                onClick={() => setIsMembersModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="p-5 max-h-80 overflow-y-auto">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600" />
                </div>
              ) : (
                <div className="space-y-2">
                  {buildingMembers.split('; ').filter(m => m.trim()).map((member, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                    >
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-600 rounded-md">
                        <Users size={14} className="text-slate-600 dark:text-slate-300" />
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {member}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setIsMembersModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-lg transition-colors"
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
