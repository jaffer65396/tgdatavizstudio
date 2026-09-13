import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChartConfig } from '../../types/dashboard';
import { DataEngine } from '../../services/dataEngine';

interface TableWidgetProps {
  rows: Record<string, any>[];
  config: ChartConfig;
  onExportCsv?: () => void;
}

export const TableWidget: React.FC<TableWidgetProps> = ({
  rows,
  config,
  onExportCsv
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string>(config.sortBy || 'Revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(config.sortOrder || 'desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = config.pageSize || 7;

  const columns = useMemo(() => {
    if (config.visibleColumns && config.visibleColumns.length > 0) {
      return config.visibleColumns;
    }
    if (rows.length > 0) {
      return Object.keys(rows[0]).slice(0, 7);
    }
    return [];
  }, [config.visibleColumns, rows]);

  // Filter & Sort
  const processedRows = useMemo(() => {
    let result = [...rows];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((r) =>
        columns.some((c) => String(r[c] ?? '').toLowerCase().includes(lower))
      );
    }

    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'desc' ? valB - valA : valA - valB;
        }
        return sortOrder === 'desc'
          ? String(valB).localeCompare(String(valA))
          : String(valA).localeCompare(String(valB));
      });
    }

    return result;
  }, [rows, searchTerm, sortCol, sortOrder, columns]);

  const totalPages = Math.ceil(processedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, currentPage, pageSize]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortOrder('desc');
    }
  };

  // Find max revenue for data bar scale
  const maxRevenue = useMemo(() => {
    return Math.max(...rows.map((r) => Number(r.Revenue) || 0), 1);
  }, [rows]);

  return (
    <div className="flex flex-col h-full w-full select-none text-[12px] bg-[#111827]">
      {/* Table search and quick controls */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e293b] bg-[#0f131c]">
        <div className="flex items-center gap-1.5 bg-[#181c24] border border-[#1e293b] rounded-[3px] px-2 py-0.5 w-48">
          <Search className="w-3 h-3 text-[#64748b]" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent text-[11px] text-[#dfe2ee] placeholder-[#64748b] outline-none font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8c909f] font-mono">
            {processedRows.length.toLocaleString()} rows
          </span>
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              title="Export Table CSV"
              className="p-1 hover:bg-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee] rounded-[3px] transition-colors"
            >
              <Download className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Table viewport */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0b0f17] border-b border-[#1e293b] text-[10px] uppercase font-mono tracking-wider text-[#64748b]">
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-3 py-1.5 font-medium cursor-pointer hover:text-[#dfe2ee] transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>{col}</span>
                    {sortCol === col ? (
                      sortOrder === 'desc' ? (
                        <ArrowDown className="w-2.5 h-2.5 text-[#3b82f6]" />
                      ) : (
                        <ArrowUp className="w-2.5 h-2.5 text-[#3b82f6]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181c24] font-mono text-[11px]">
            {paginatedRows.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-[#1e293b]/70 transition-colors group text-[#dfe2ee]"
              >
                {columns.map((col) => {
                  const val = row[col];
                  const isRevenue = col === 'Revenue' || col === 'Cost' || col === 'Profit';
                  const isMargin = col === 'MarginPct' || col === 'DiscountPct';

                  return (
                    <td key={col} className="px-3 py-1.5 whitespace-nowrap">
                      {isRevenue ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#f8fafc]">
                            {DataEngine.formatNumber(Number(val), 'currency')}
                          </span>
                          {col === 'Revenue' && (
                            <div className="w-12 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#3b82f6]"
                                style={{
                                  width: `${Math.min(100, Math.round((Number(val) / maxRevenue) * 100))}%`
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : isMargin ? (
                        <span
                          className={`font-medium ${
                            Number(val) > 60
                              ? 'text-[#4edea3]'
                              : Number(val) > 40
                              ? 'text-[#adc6ff]'
                              : 'text-[#ffb4ab]'
                          }`}
                        >
                          {val}%
                        </span>
                      ) : (
                        <span className="text-[#c2c6d6]">{String(val ?? '')}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-[#1e293b] bg-[#0f131c] text-[10px] font-mono text-[#64748b]">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1 disabled:opacity-30 hover:bg-[#1e293b] rounded-[2px] text-[#dfe2ee]"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1 disabled:opacity-30 hover:bg-[#1e293b] rounded-[2px] text-[#dfe2ee]"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
