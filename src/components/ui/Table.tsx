// src/components/ui/Table.tsx
// Enterprise data table with dark-mode zebra striping and sortable columns

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  compact?: boolean;
  className?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  onRowClick,
  loading = false,
  compact = false,
  className = '',
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDirection]);

  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className={`overflow-x-auto rounded-xl border border-zinc-800/60 ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800/60 bg-zinc-900/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  ${cellPadding} text-left text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500
                  ${col.sortable ? 'cursor-pointer hover:text-zinc-300 select-none' : ''}
                  ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}
                `}
                style={col.width ? { width: col.width } : undefined}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    sortKey === col.key ? (
                      sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    ) : (
                      <ChevronsUpDown size={12} className="opacity-30" />
                    )
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className={`${cellPadding} text-center text-zinc-500`}>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                  Loading...
                </div>
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={`${cellPadding} text-center text-zinc-600`}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, idx) => (
              <tr
                key={keyExtractor(row)}
                className={`
                  border-b border-zinc-800/30
                  ${idx % 2 === 0 ? 'bg-transparent' : 'bg-zinc-900/20'}
                  ${onRowClick ? 'cursor-pointer hover:bg-zinc-800/40 transition-colors' : ''}
                `}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`
                      ${cellPadding} text-zinc-300
                      ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}
                    `}
                  >
                    {col.render ? col.render(row, idx) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
