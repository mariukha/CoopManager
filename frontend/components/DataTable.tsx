import React from 'react';
import { Edit2, Trash2, Calendar, Check, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import type { ColumnDefinition, SortConfig, DatabaseRecord } from '../types';
import { getPrimaryKeyField } from '../config/tableConfig';

interface DataTableProps {
  columns: ColumnDefinition[];
  data: DatabaseRecord[];
  loading: boolean;
  onEdit?: (item: DatabaseRecord) => void;
  onDelete?: (item: DatabaseRecord) => void;
  selectedIds: (string | number)[];
  onSelectRow: (id: string | number) => void;
  onSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: SortConfig | null;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading,
  onEdit,
  onDelete,
  selectedIds,
  onSelectRow,
  onSelectAll,
  onSort,
  sortConfig,
}) => {
  const renderSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) {
      return (
        <ArrowUpDown
          size={14}
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 dark:text-slate-500"
        />
      );
    }
    const Icon = sortConfig.direction === 'asc' ? ChevronUp : ChevronDown;
    return (
      <Icon
        size={16}
        className="ml-2 text-blue-600 dark:text-blue-400 animate-in zoom-in duration-300"
      />
    );
  };

  const formatCellValue = (key: string, value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return '-';

    if (key.includes('data') && typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold whitespace-nowrap">
            <Calendar size={14} className="text-blue-500 shrink-0" />
            {date.toLocaleDateString('pl-PL')}
          </div>
        );
      }
    }

    if (key === 'status_oplaty' || key === 'status') {
      const val = String(value).toLowerCase();
      let styles = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

      if (['zaplacono', 'wykonana', 'aktywna'].includes(val)) {
        styles = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      } else if (['oczekuje', 'w toku'].includes(val)) {
        styles = 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      } else if (['wystawiono', 'zgloszona'].includes(val)) {
        styles = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      } else if (['zaleglosc', 'anulowana', 'awaria'].includes(val)) {
        styles = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      }

      return (
        <span
          className={`px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase 
            tracking-widest border transition-colors whitespace-nowrap ${styles}`}
        >
          {String(value)}
        </span>
      );
    }

    return String(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
              <th className="px-4 md:px-6 py-5 w-10 md:w-12">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
                  checked={data.length > 0 && selectedIds.length === data.length}
                  onChange={onSelectAll}
                  aria-label="Zaznacz wszystkie"
                />
              </th>
              
              {columns.map((col, index) => (
                <th
                  key={col.key}
                  onClick={() => onSort(col.key)}
                  className={`px-4 md:px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 
                    uppercase tracking-[0.2em] cursor-pointer group select-none transition-colors 
                    hover:text-blue-600 dark:hover:text-blue-400 ${index > 1 ? 'hidden md:table-cell' : ''}`}
                >
                  <div className="flex items-center whitespace-nowrap">
                    {col.label}
                    {renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
              
              <th className="px-4 md:px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">
                Akcje
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-8 py-20 text-center text-slate-400 dark:text-slate-600 font-bold uppercase text-[10px] tracking-widest"
                >
                  Brak danych
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const idField = getPrimaryKeyField(row);
                const rowId = idField ? row[idField] : idx;
                const isSelected = selectedIds.includes(rowId as string | number);

                return (
                  <tr
                    key={String(rowId)}
                    className={`transition-colors group ${
                      isSelected
                        ? 'bg-blue-50/50 dark:bg-blue-900/20'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="px-4 md:px-6 py-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
                        checked={isSelected}
                        onChange={() => onSelectRow(rowId as string | number)}
                        aria-label={`Zaznacz rekord ${rowId}`}
                      />
                    </td>
                    
                    {columns.map((col, index) => (
                      <td
                        key={col.key}
                        className={`px-4 md:px-6 py-4 text-xs md:text-sm font-bold transition-colors ${
                          isSelected
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-slate-700 dark:text-slate-300'
                        } ${index > 1 ? 'hidden md:table-cell' : ''}`}
                      >
                        {formatCellValue(col.key, row[col.key])}
                      </td>
                    ))}
                    
                    <td className="px-4 md:px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 md:gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all active:scale-90"
                            aria-label="Edytuj"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all active:scale-90"
                            aria-label="Usuń"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-blue-600 dark:bg-blue-700 px-4 md:px-8 py-3 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2 transition-colors">
          <div className="flex items-center gap-3 text-white">
            <Check size={14} />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">
              Wybrano {selectedIds.length}
            </span>
          </div>
          <button
            onClick={onSelectAll}
            className="text-[9px] md:text-[10px] font-black text-white/70 hover:text-white uppercase tracking-widest transition-colors"
          >
            {selectedIds.length === data.length ? 'Odznacz' : 'Zaznacz'}
          </button>
        </div>
      )}
    </div>
  );
};
