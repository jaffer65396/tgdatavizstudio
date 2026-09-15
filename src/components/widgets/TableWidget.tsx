import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  X,
  Zap,
  SlidersHorizontal
} from 'lucide-react';
import { ChartConfig, SortClause, ColumnSchema } from '../../types/dashboard';
import { DataEngine } from '../../services/dataEngine';

interface TableWidgetProps {
  rows: Record<string, any>[];
  config: ChartConfig;
  columnsSchema?: ColumnSchema[];
  onExportCsv?: () => void;
  onOpenSequentialModal?: () => void;
  onUpdateSequentialSort?: (clauses: SortClause[]) => void;
}

export const TableWidget: React.FC<TableWidgetProps> = ({
  rows,
  config,
  columnsSchema = [],
  onExportCsv,
  onOpenSequentialModal,
  onUpdateSequentialSort
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSequentialSort, setLocalSequentialSort] = useState<SortClause[]>(
    config.sequentialSort || []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = config.pageSize || 7;

  // Sync with prop changes if updated externally
  React.useEffect(() => {
    if (config.sequentialSort) {
      setLocalSequentialSort(config.sequentialSort);
    }
  }, [config.sequentialSort]);

  const columns = useMemo(() => {
    if (config.visibleColumns && config.visibleColumns.length > 0) {
      return config.visibleColumns;
    }
    if (rows.length > 0) {
      return Object.keys(rows[0]).slice(0, 7);
    }
    return [];
  }, [config.visibleColumns, rows]);

  // Handle setting/clearing sequential sort
  const applySortClauses = (clauses: SortClause[]) => {
    setLocalSequentialSort(clauses);
    setCurrentPage(1);
    if (onUpdateSequentialSort) {
      onUpdateSequentialSort(clauses);
    }
  };

  // Instant one-click "Perfect Order" sequential query generator
  const handleAutoPerfectOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Build column schema fallback if not passed directly
    const schemas: ColumnSchema[] = columnsSchema.length > 0
      ? columnsSchema
      : columns.map((colName) => {
          const sample = rows[0]?.[colName];
          const isNum = typeof sample === 'number';
          return {
            name: colName,
            type: isNum ? 'number' : 'string',
            category: isNum ? 'measure' : ['date', 'quarter', 'month', 'year'].some((k) => colName.toLowerCase().includes(k)) ? 'time' : 'dimension',
            nullable: false,
            uniqueCount: 10
          };
        });

    const perfectClauses = DataEngine.getPerfectOrderClauses(schemas);
    applySortClauses(perfectClauses);
  };

  // Clear all sort stages
  const handleClearSort = () => {
    applySortClauses([]);
  };

  // Handle clicking column header:
  // - Shift+click: appends/toggles that column in the sequential sort chain
  // - Regular click: if already in sequential sort, flips its direction; if not, makes it the primary stage
  const handleHeaderClick = (col: string, e: React.MouseEvent) => {
    const isShift = e.shiftKey;
    const existingIdx = localSequentialSort.findIndex((c) => c.column === col);

    if (isShift) {
      // Append or toggle in sequential pipeline
      if (existingIdx !== -1) {
        // Toggle direction
        const updated = [...localSequentialSort];
        updated[existingIdx] = {
          ...updated[existingIdx],
          order: updated[existingIdx].order === 'asc' ? 'desc' : 'asc'
        };
        applySortClauses(updated);
      } else {
        // Add new stage
        const autoType = ['date', 'quarter', 'month', 'year'].some((k) => col.toLowerCase().includes(k))
          ? 'chronological'
          : typeof rows[0]?.[col] === 'number'
          ? 'numeric'
          : 'auto';
        const newClause: SortClause = {
          id: `clause-${Date.now()}-${localSequentialSort.length + 1}`,
          column: col,
          order: typeof rows[0]?.[col] === 'number' ? 'desc' : 'asc',
          type: autoType
        };
        applySortClauses([...localSequentialSort, newClause]);
      }
    } else {
      // Standard single/primary click
      if (existingIdx === 0 && localSequentialSort.length === 1) {
        // Toggle direction of single sort
        const updated = [{
          ...localSequentialSort[0],
          order: localSequentialSort[0].order === 'asc' ? 'desc' : 'asc'
        }];
        applySortClauses(updated);
      } else {
        // Set as single primary sort
        const autoType = ['date', 'quarter', 'month', 'year'].some((k) => col.toLowerCase().includes(k))
          ? 'chronological'
          : typeof rows[0]?.[col] === 'number'
          ? 'numeric'
          : 'auto';
        const newClause: SortClause = {
          id: `clause-${Date.now()}-1`,
          column: col,
          order: typeof rows[0]?.[col] === 'number' ? 'desc' : 'asc',
          type: autoType
        };
        applySortClauses([newClause]);
      }
    }
  };

  // Filter & Sequential Sort
  const processedRows = useMemo(() => {
    let result = [...rows];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((r) =>
        columns.some((c) => String(r[c] ?? '').toLowerCase().includes(lower))
      );
    }

    if (localSequentialSort && localSequentialSort.length > 0) {
      result = DataEngine.sequentialSort(result, localSequentialSort);
    } else if (config.sortBy) {
      // Fallback standard single sort
      const sortCol = config.sortBy;
      const sortOrder = config.sortOrder || 'desc';
      result.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        return DataEngine.compareValues(valA, valB, sortOrder, 'auto');
      });
    }

    return result;
  }, [rows, searchTerm, localSequentialSort, config.sortBy, config.sortOrder, columns]);

  const totalPages = Math.ceil(processedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, currentPage, pageSize]);

  // Find max revenue for data bar scale
  const maxRevenue = useMemo(() => {
    return Math.max(...rows.map((r) => Number(r.Revenue) || 0), 1);
  }, [rows]);

  return (
    <div className="flex flex-col h-full w-full select-none text-[12px] bg-[#111827]">
      {/* Table search and quick controls */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 border-b border-[#1e293b] bg-[#0f131c] gap-2">
        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="flex items-center gap-1.5 bg-[#181c24] border border-[#1e293b] rounded-[3px] px-2 py-0.5 w-44">
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

          {/* Sequential Query Button */}
          {onOpenSequentialModal && (
            <button
              onClick={onOpenSequentialModal}
              title="Open Sequential Query Multi-Stage Sorter"
              className="flex items-center gap-1 px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#93c5fd] border border-[#3b82f6]/30 rounded-[3px] text-[10px] font-mono transition-colors"
            >
              <ArrowUpDown className="w-3 h-3 text-[#60a5fa]" />
              <span>Sequential Query</span>
              {localSequentialSort.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-[9px] font-bold">
                  {localSequentialSort.length}
                </span>
              )}
            </button>
          )}

          {/* 1-Click Perfect Order Button */}
          <button
            onClick={handleAutoPerfectOrder}
            title="Auto-Sort unsorted data into Perfect Order (Chronological -> Categorical -> Measure)"
            className="flex items-center gap-1 px-2 py-1 bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#4edea3] border border-[#10b981]/40 rounded-[3px] text-[10px] font-mono transition-colors"
          >
            <Zap className="w-3 h-3 fill-current text-yellow-300" />
            <span>Perfect Order</span>
          </button>
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

      {/* Active Sequential Sort Pipeline Chips */}
      {localSequentialSort.length > 0 && (
        <div className="px-3 py-1 bg-[#0b0f17] border-b border-[#1e293b] flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono">
          <span className="text-[#64748b] flex items-center gap-1 flex-shrink-0">
            <Layers className="w-2.5 h-2.5 text-[#3b82f6]" />
            <span>Order Pipeline:</span>
          </span>

          {localSequentialSort.map((s, idx) => (
            <div
              key={s.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#1e293b] border border-[#334155] rounded text-[#adc6ff] flex-shrink-0"
            >
              <span className="text-[#60a5fa] font-bold">{idx + 1}.</span>
              <span>{s.column}</span>
              <span className="text-[#4edea3]">{s.order === 'asc' ? '▲' : '▼'}</span>
              {s.type && s.type !== 'auto' && (
                <span className="text-[8px] text-[#8c909f] uppercase">({s.type[0]})</span>
              )}
            </div>
          ))}

          <button
            onClick={handleClearSort}
            title="Reset sequential sort"
            className="p-0.5 hover:bg-[#334155] text-[#8c909f] hover:text-[#f87171] rounded flex-shrink-0 ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Table viewport */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0b0f17] border-b border-[#1e293b] text-[10px] uppercase font-mono tracking-wider text-[#64748b]">
              {columns.map((col) => {
                const sortIdx = localSequentialSort.findIndex((c) => c.column === col);
                const activeSort = sortIdx !== -1 ? localSequentialSort[sortIdx] : null;

                return (
                  <th
                    key={col}
                    onClick={(e) => handleHeaderClick(col, e)}
                    title="Click to sort, Shift+Click to add to Sequential Pipeline"
                    className="px-3 py-1.5 font-medium cursor-pointer hover:text-[#dfe2ee] transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col}</span>
                      {activeSort ? (
                        <div className="flex items-center text-[#3b82f6] font-bold">
                          {localSequentialSort.length > 1 && (
                            <span className="text-[9px] mr-0.5 bg-[#3b82f6]/20 px-1 rounded">
                              {sortIdx + 1}
                            </span>
                          )}
                          {activeSort.order === 'desc' ? (
                            <ArrowDown className="w-2.5 h-2.5" />
                          ) : (
                            <ArrowUp className="w-2.5 h-2.5" />
                          )}
                        </div>
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-25 hover:opacity-75" />
                      )}
                    </div>
                  </th>
                );
              })}
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
