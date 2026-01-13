import React, { useEffect, useState, useCallback } from 'react';
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
      const tableStats: Record<string, number> = {};
      
      for (const table of tables) {
        try {
          const result = await db.countRecords(table);
          tableStats[table] = result.count;
        } catch {
          tableStats[table] = 0;
        }
      }

      const [payments, buildings] = await Promise.all([
        db.getTableData('oplata'),
        db.getTableData<{ id_budynku: number; adres: string }>('budynek'),
      ]);

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Database size={20} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            Statystyki bazy danych
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lab 13 — funkcja policz_rekordy
          </p>
        </div>
      </div>

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
                <div className={`p-2 rounded-lg bg-gradient-to-br ${info.color} text-white`}>
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
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm mb-1">Suma wszystkich opłat</p>
            <p className="text-3xl font-bold">
              {stats.totalFees.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
            </p>
          </div>
          <div className="p-4 bg-white/10 rounded-xl">
            <Wallet size={32} />
          </div>
        </div>
      </div>

      {/* Buildings Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
            <Building2 size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              Budynki
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lab 11 — funkcja pobierz_czlonkow_budynku (CURSOR)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.buildings.map((building) => (
            <button
              key={building.id_budynku}
              onClick={() => handleShowBuildingMembers(building.id_budynku, building.adres)}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 
                text-left hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50 transition-colors">
                  <Building2 size={18} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-white truncate">
                    {building.adres}
                  </p>
                  <p className="text-xs text-violet-600 dark:text-violet-400">
                    Zobacz członków →
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Members Modal */}
      {isMembersModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
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
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-violet-600" />
                </div>
              ) : (
                <div className="space-y-2">
                  {buildingMembers.split(', ').map((member, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                    >
                      <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-md">
                        <Users size={14} className="text-violet-600 dark:text-violet-400" />
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
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
