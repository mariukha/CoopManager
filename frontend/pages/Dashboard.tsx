import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Users, AlertTriangle, Wallet, Building2 } from 'lucide-react';
import { db } from '../services/api';

const STATUS_COLORS: Record<string, string> = {
  'Wykonana': '#22c55e',
  'Zakonczona': '#22c55e',
  'W toku': '#f59e0b',
  'Oczekuje': '#f59e0b',
  'Zgłoszona': '#2563eb',
  'Aktywna': '#2563eb',
  'Anulowana': '#ef4444',
  'Awaria': '#ef4444',
};

const DEFAULT_COLOR = '#94a3b8';

interface DashboardStats {
  members: number;
  repairs: number;
  totalFees: number;
  buildings: number;
  repairStatusData: Array<{ name: string; value: number }>;
  feesData: Array<{ name: string; kwota: number }>;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    members: 0,
    repairs: 0,
    totalFees: 0,
    buildings: 0,
    repairStatusData: [],
    feesData: [],
  });
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const loadStats = async () => {
      try {
        const [members, repairs, payments, buildings] = await Promise.all([
          db.getTableData('czlonek'),
          db.getTableData('naprawa'),
          db.getTableData('oplata'),
          db.getTableData('budynek'),
        ]);

        const statusCounts = repairs.reduce<Record<string, number>>((acc, curr) => {
          const status = curr.status as string;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const repairStatusData = Object.entries(statusCounts).map(([name, value]) => ({
          name,
          value,
        }));

        const totalFees = payments.reduce((sum, payment) => {
          return sum + (Number(payment.kwota) || 0);
        }, 0);

        const feesData = payments.map((payment) => ({
          name: `Opłata #${payment.id_oplaty}`,
          kwota: Number(payment.kwota) || 0,
        }));

        setStats({
          members: members.length,
          repairs: repairs.length,
          totalFees,
          buildings: buildings.length,
          repairStatusData,
          feesData,
        });
      } catch (error) {
        console.error('Błąd ładowania statystyk:', error);
      }
    };

    loadStats();
    return () => observer.disconnect();
  }, []);

  const chartTheme = useMemo(() => ({
    grid: isDark ? '#1e293b' : '#f1f5f9',
    text: isDark ? '#94a3b8' : '#64748b',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
    tooltipBorder: isDark ? '#1e293b' : '#e2e8f0',
  }), [isDark]);

  const kpiCards = [
    { label: 'Liczba Członków', value: stats.members, icon: Users, color: 'blue' },
    { label: 'Aktywne Zgłoszenia', value: stats.repairs, icon: AlertTriangle, color: 'amber' },
    { label: 'Suma Opłat (PLN)', value: `${stats.totalFees.toLocaleString('pl-PL')} zł`, icon: Wallet, color: 'green' },
    { label: 'Zarządzane Budynki', value: stats.buildings, icon: Building2, color: 'purple' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-all"
            >
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {kpi.label}
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {kpi.value}
                </h3>
              </div>
              <div className={`p-4 rounded-2xl bg-${kpi.color}-50 dark:bg-${kpi.color}-900/20 text-${kpi.color}-600 dark:text-${kpi.color}-400`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-8 uppercase tracking-[0.15em]">
            Status Zgłoszeń (Naprawy)
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.repairStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.repairStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || DEFAULT_COLOR} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    border: `1px solid ${chartTheme.tooltipBorder}`,
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#fff' : '#000',
                  }}
                  itemStyle={{ color: isDark ? '#cbd5e1' : '#1e293b', fontWeight: 'bold' }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-8 uppercase tracking-[0.15em]">
            Analiza Finansowa Opłat
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.feesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis dataKey="name" hide />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip
                  cursor={{ fill: isDark ? '#1e293b' : '#f8fafc' }}
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    border: `1px solid ${chartTheme.tooltipBorder}`,
                    borderRadius: '16px',
                    color: isDark ? '#fff' : '#000',
                  }}
                />
                <Bar dataKey="kwota" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
