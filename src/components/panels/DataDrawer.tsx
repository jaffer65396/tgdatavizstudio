import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Database,
  Hash,
  Type,
  Calendar,
  Calculator,
  Plus,
  CheckCircle,
  Upload,
  Sliders,
  Zap,
  Maximize2,
  Minimize2,
  Table as TableIcon,
  ListFilter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  Activity,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { Dataset, ColumnSchema } from '../../types/dashboard';
import { DataEngine } from '../../services/dataEngine';
import { computeColumnStatistics, ColumnStatistics, formatStatValue } from '../../services/columnStats';
import { ColumnHeaderTooltip } from './ColumnHeaderTooltip';

interface DataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset;
  datasets?: Dataset[];
  onSelectDataset?: (id: string) => void;
  onOpenImportData: () => void;
  onAddCalculatedField: (name: string, formula: string) => void;
  onOpenDataTypeModal?: (columnName?: string) => void;
}

export const DataDrawer: React.FC<DataDrawerProps> = ({
  isOpen,
  onClose,
  dataset,
  datasets = [],
  onSelectDataset,
  onOpenImportData,
  onAddCalculatedField,
  onOpenDataTypeModal
}) => {
  const [calcName, setCalcName] = useState('');
  const [calcFormula, setCalcFormula] = useState('');
  const [calcSuccess, setCalcSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'schema' | 'table'>('schema');
  const [fieldSearch, setFieldSearch] = useState('');

  // Table preview sorting and pagination state
  const [previewSortCol, setPreviewSortCol] = useState<string | null>(null);
  const [previewSortOrder, setPreviewSortOrder] = useState<'asc' | 'desc'>('asc');
  const [previewPage, setPreviewPage] = useState(1);
  const previewPageSize = 12;

  // Tooltip hover state
  const [hoveredColName, setHoveredColName] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Precompute statistical summaries for all columns in active dataset
  const statsMap = useMemo(() => {
    const map = new Map<string, ColumnStatistics>();
    if (!dataset || !dataset.columns) return map;
    for (const col of dataset.columns) {
      map.set(col.name, computeColumnStatistics(dataset, col.name));
    }
    return map;
  }, [dataset]);

  // Check if any column contains numeric dates
  const numericDateColumn = dataset.columns.find((c) => {
    if (c.type === 'date') return false;
    const sampleVals = dataset.data.slice(0, 10).map((r) => r[c.name]);
    return DataEngine.detectNumericDateType(sampleVals) !== 'none';
  });

  if (!isOpen) return null;

  const handleMouseEnterHeader = (colName: string, e: React.MouseEvent<HTMLElement>) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setAnchorRect(rect);
    setHoveredColName(colName);
  };

  const handleMouseLeaveHeader = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredColName(null);
      setAnchorRect(null);
    }, 120);
  };

  const handleCreateCalculated = () => {
    if (!calcName || !calcFormula) return;
    onAddCalculatedField(calcName, calcFormula);
    setCalcName('');
    setCalcFormula('');
    setCalcSuccess(true);
    setTimeout(() => setCalcSuccess(false), 2000);
  };

  // Filtered columns list
  const filteredColumns = dataset.columns.filter((c) =>
    c.name.toLowerCase().includes(fieldSearch.toLowerCase())
  );

  // Table preview sorted & paginated data
  const sortedPreviewData = useMemo(() => {
    if (!previewSortCol) return dataset.data;
    const sorted = [...dataset.data].sort((a, b) => {
      const valA = a[previewSortCol];
      const valB = b[previewSortCol];
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return previewSortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return previewSortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return sorted;
  }, [dataset.data, previewSortCol, previewSortOrder]);

  const totalPreviewPages = Math.max(1, Math.ceil(sortedPreviewData.length / previewPageSize));
  const currentPreviewRows = sortedPreviewData.slice(
    (previewPage - 1) * previewPageSize,
    previewPage * previewPageSize
  );

  const handleToggleSort = (colName: string) => {
    if (previewSortCol === colName) {
      if (previewSortOrder === 'asc') {
        setPreviewSortOrder('desc');
      } else {
        setPreviewSortCol(null);
      }
    } else {
      setPreviewSortCol(colName);
      setPreviewSortOrder('asc');
    }
    setPreviewPage(1);
  };

  const activeStats = hoveredColName ? statsMap.get(hoveredColName) : undefined;

  return (
    <>
      <aside
        className={`${
          isExpanded ? 'w-[640px]' : 'w-80'
        } bg-[#0f131c] border-r border-[#1e293b] flex flex-col h-full z-30 select-none text-[12px] transition-all duration-200 relative`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#1e293b] bg-[#111827]">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[#10b981]" />
            <span className="font-semibold text-[#f8fafc]">Datasets & Schema</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Expand / Collapse drawer width toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee] rounded-[3px] transition-colors"
              title={isExpanded ? 'Collapse drawer width' : 'Expand drawer width'}
            >
              {isExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1 hover:bg-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee] rounded-[3px] transition-colors"
              title="Close Data Drawer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Mode Segmented Switch: Schema Fields vs Table Preview */}
        <div className="px-3.5 pt-2.5 pb-1 flex items-center gap-1.5 border-b border-[#1e293b] bg-[#0b0f17]">
          <button
            type="button"
            onClick={() => setViewMode('schema')}
            className={`flex-1 py-1 px-2 rounded-[3px] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'schema'
                ? 'bg-[#1e293b] text-[#f8fafc] shadow-sm font-semibold border border-[#334155]'
                : 'text-[#8c909f] hover:text-[#dfe2ee] hover:bg-[#181c24]'
            }`}
          >
            <ListFilter className="w-3 h-3 text-[#38bdf8]" />
            <span>Schema Fields ({dataset.columns.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('table');
              if (!isExpanded) setIsExpanded(true);
            }}
            className={`flex-1 py-1 px-2 rounded-[3px] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'table'
                ? 'bg-[#1e293b] text-[#f8fafc] shadow-sm font-semibold border border-[#334155]'
                : 'text-[#8c909f] hover:text-[#dfe2ee] hover:bg-[#181c24]'
            }`}
          >
            <TableIcon className="w-3 h-3 text-[#10b981]" />
            <span>Data Preview ({dataset.rowCount.toLocaleString()} rows)</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto font-sans flex flex-col">
          {viewMode === 'schema' ? (
            /* SCHEMA & FIELDS VIEW */
            <div className="p-3.5 space-y-3.5 flex-1">
              {/* Quick Action: Import Data button */}
              <button
                onClick={onOpenImportData}
                className="w-full py-1.5 px-3 bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/40 text-[#4edea3] rounded-[4px] font-medium text-[11px] flex items-center justify-center gap-2 transition-all shadow-[0_1px_4px_rgba(16,185,129,0.1)]"
              >
                <Upload className="w-3 h-3" />
                <span>+ Import New Data (File / Paste / Samples)</span>
              </button>

              {/* Dataset selector / metadata badge */}
              <div className="p-2.5 bg-[#181c24] border border-[#1e293b] rounded-[4px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#8c909f] uppercase tracking-wider">
                    Active Dataset ({datasets.length} available)
                  </span>
                  <span className="text-[10px] font-mono text-[#4edea3]">
                    {dataset.rowCount >= 1000000
                      ? `${(dataset.rowCount / 1000000).toFixed(1)}M`
                      : dataset.rowCount.toLocaleString()}{' '}
                    rows
                  </span>
                </div>

                {datasets.length > 1 ? (
                  <select
                    value={dataset.id}
                    onChange={(e) => onSelectDataset?.(e.target.value)}
                    className="w-full h-7 px-2 bg-[#0b0f17] border border-[#334155] rounded-[3px] text-[#f8fafc] font-medium text-[11px] outline-none"
                  >
                    {datasets.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.rowCount.toLocaleString()} rows)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-[11px] font-semibold text-[#f8fafc] truncate">
                    {dataset.name}
                  </div>
                )}

                <div className="text-[10px] font-mono text-[#8c909f] flex items-center justify-between pt-1 border-t border-[#1e293b]">
                  <span>Engine: {dataset.sourceType.toUpperCase()}</span>
                  <span>Refreshed: {dataset.lastRefreshed}</span>
                </div>
              </div>

              {/* Notice if numeric dates detected */}
              {numericDateColumn && onOpenDataTypeModal && (
                <div className="p-2 bg-[#f59e0b]/15 border border-[#f59e0b]/40 rounded-[4px] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#fbbf24]">
                    <Zap className="w-3 h-3 flex-shrink-0" />
                    <span>
                      Dates stored as numbers in <strong>{numericDateColumn.name}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenDataTypeModal(numericDateColumn.name)}
                    className="px-2 py-0.5 bg-[#f59e0b] hover:bg-[#d97706] text-black font-semibold rounded text-[9px] whitespace-nowrap transition-colors"
                  >
                    Fix Format
                  </button>
                </div>
              )}

              {/* Column Search & Format Engine trigger */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-[#8c909f] uppercase tracking-wider">
                    <span>Columns</span>
                    <span className="text-[#38bdf8] font-bold">({dataset.columns.length})</span>
                    <span className="text-[9px] text-[#64748b] ml-1 font-sans">
                      (Hover for stats)
                    </span>
                  </div>

                  {onOpenDataTypeModal && (
                    <button
                      type="button"
                      onClick={() => onOpenDataTypeModal()}
                      className="text-[10px] font-mono text-[#38bdf8] hover:text-[#93c5fd] flex items-center gap-1 transition-colors"
                      title="Open Data Type & Format Engine"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Types & Formats</span>
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3 h-3 text-[#64748b] absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    placeholder="Search column headers..."
                    className="w-full h-7 pl-7 pr-2 bg-[#0b0f17] border border-[#1e293b] rounded-[3px] text-[#dfe2ee] text-[11px] font-mono outline-none focus:border-[#38bdf8]"
                  />
                </div>
              </div>

              {/* Column Headers List with Interactive Descriptive Hover Tooltips */}
              <div className="space-y-1">
                {filteredColumns.map((col) => {
                  const Icon = col.type === 'number' ? Hash : col.type === 'date' ? Calendar : Type;
                  const formatLabel = col.dateFormat || col.format;
                  const stats = statsMap.get(col.name);
                  const isHovered = hoveredColName === col.name;

                  return (
                    <div
                      key={col.name}
                      id={`col-header-${col.name.replace(/\s+/g, '-').toLowerCase()}`}
                      onMouseEnter={(e) => handleMouseEnterHeader(col.name, e)}
                      onMouseLeave={handleMouseLeaveHeader}
                      className={`group/col relative flex flex-col p-2 rounded-[4px] border transition-all cursor-help ${
                        isHovered
                          ? 'bg-[#181c24] border-[#38bdf8]/60 shadow-[0_2px_12px_rgba(56,189,248,0.1)]'
                          : 'bg-[#0b0f17] hover:bg-[#151922] border-[#1e293b]'
                      }`}
                    >
                      {/* Top Row: Icon, Column Name, Format, Badges */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-4 h-4 rounded bg-[#1e293b] flex items-center justify-center flex-shrink-0">
                            <Icon className="w-2.5 h-2.5 text-[#38bdf8]" />
                          </div>
                          <span className="text-[11px] font-mono font-medium text-[#dfe2ee] truncate group-hover/col:text-[#38bdf8]">
                            {col.name}
                          </span>
                          {formatLabel && (
                            <span className="text-[9px] font-mono text-[#64748b] truncate">
                              • {formatLabel}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className={`text-[9px] font-mono px-1 py-0.2 rounded font-medium ${
                              col.category === 'measure'
                                ? 'bg-[#10b981]/15 text-[#4edea3]'
                                : col.category === 'time'
                                ? 'bg-[#8b5cf6]/15 text-[#d0bcff]'
                                : 'bg-[#1e293b] text-[#8c909f]'
                            }`}
                          >
                            {col.type}
                          </span>

                          {/* Quick Stats Pill with Tooltip trigger */}
                          <button
                            type="button"
                            onMouseEnter={(e) => handleMouseEnterHeader(col.name, e)}
                            className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-[#111827] hover:bg-[#1e293b] text-[9px] font-mono text-[#38bdf8] border border-[#1e293b] transition-colors"
                            title={`Hover to inspect min/max, nulls & variance for ${col.name}`}
                          >
                            <Activity className="w-2.5 h-2.5 text-[#f59e0b]" />
                            <span>Stats</span>
                          </button>

                          {onOpenDataTypeModal && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDataTypeModal(col.name);
                              }}
                              title={`Format / Cast data type for ${col.name}`}
                              className="opacity-0 group-hover/col:opacity-100 p-0.5 hover:bg-[#334155] text-[#8c909f] hover:text-[#38bdf8] rounded transition-opacity"
                            >
                              <Sliders className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Inline Micro-Stats Preview (Min/Max, Nulls, Variance) */}
                      {stats && (
                        <div className="mt-1.5 pt-1 border-t border-[#1e293b]/70 flex items-center justify-between text-[9px] font-mono text-[#8c909f]">
                          <div className="flex items-center gap-1 truncate max-w-[140px]">
                            <span className="text-[#64748b]">Range:</span>
                            <span className="text-[#cbd5e1] truncate">
                              {stats.minFormatted} → {stats.maxFormatted}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Null count badge */}
                            <span
                              className={`flex items-center gap-0.5 ${
                                stats.nullCount === 0 ? 'text-[#4edea3]' : 'text-[#f59e0b]'
                              }`}
                            >
                              {stats.nullCount === 0 ? (
                                <ShieldCheck className="w-2.5 h-2.5" />
                              ) : (
                                <AlertTriangle className="w-2.5 h-2.5" />
                              )}
                              <span>{stats.nullCount} nulls</span>
                            </span>

                            {/* Variance snippet */}
                            {stats.isNumeric && stats.stdDevFormatted && (
                              <span className="text-[#f59e0b] hidden sm:inline">
                                σ: {stats.stdDevFormatted}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Formula / Calculated Column Engine */}
              <div className="pt-3 border-t border-[#1e293b] space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8c909f] uppercase">
                  <Calculator className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <span>Add Calculated Field</span>
                </div>

                <div>
                  <label className="block text-[10px] text-[#8c909f] mb-1 font-mono">Field Name</label>
                  <input
                    type="text"
                    placeholder="e.g. NetProfitMargin"
                    value={calcName}
                    onChange={(e) => setCalcName(e.target.value)}
                    className="w-full h-7 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[3px] text-[#dfe2ee] font-mono text-[11px] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#8c909f] mb-1 font-mono">
                    Formula Expression
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. (Profit / Revenue) * 100"
                    value={calcFormula}
                    onChange={(e) => setCalcFormula(e.target.value)}
                    className="w-full h-7 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[3px] text-[#dfe2ee] font-mono text-[11px] outline-none"
                  />
                </div>

                <button
                  onClick={handleCreateCalculated}
                  disabled={!calcName || !calcFormula}
                  className="w-full h-7 bg-[#1e293b] hover:bg-[#334155] disabled:opacity-40 text-[#dfe2ee] rounded-[3px] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3 h-3 text-[#3b82f6]" />
                  <span>Create Field</span>
                </button>

                {calcSuccess && (
                  <div className="text-[10px] text-[#4edea3] font-mono flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Field calculated and mapped to schema!</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* DATA PREVIEW TABLE VIEW WITH INTERACTIVE COLUMN HEADERS */
            <div className="flex-1 flex flex-col min-h-0 bg-[#0b0f17]">
              {/* Instruction banner */}
              <div className="p-2.5 bg-[#111827] border-b border-[#1e293b] flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-[#38bdf8]">
                  <Activity className="w-3.5 h-3.5 text-[#f59e0b]" />
                  <span className="font-medium text-[#dfe2ee]">
                    Hover over any column header below to inspect min/max, null count, and data variance statistics.
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#8c909f]">
                  {dataset.data.length.toLocaleString()} total rows
                </span>
              </div>

              {/* Scrollable Table Viewport */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse font-mono text-[11px]">
                  <thead className="sticky top-0 z-20 bg-[#0f131c] shadow-sm">
                    <tr className="border-b border-[#1e293b]">
                      <th className="px-2.5 py-2 text-[10px] text-[#64748b] uppercase tracking-wider font-semibold w-10 border-r border-[#1e293b]/50">
                        #
                      </th>
                      {dataset.columns.map((col) => {
                        const Icon =
                          col.type === 'number' ? Hash : col.type === 'date' ? Calendar : Type;
                        const isSorted = previewSortCol === col.name;
                        const isColHovered = hoveredColName === col.name;
                        const stats = statsMap.get(col.name);

                        return (
                          <th
                            key={col.name}
                            id={`th-header-${col.name.replace(/\s+/g, '-').toLowerCase()}`}
                            onMouseEnter={(e) => handleMouseEnterHeader(col.name, e)}
                            onMouseLeave={handleMouseLeaveHeader}
                            onClick={() => handleToggleSort(col.name)}
                            className={`px-3 py-2 cursor-pointer transition-all border-r border-[#1e293b]/50 whitespace-nowrap select-none group/th ${
                              isColHovered
                                ? 'bg-[#181c24] text-[#38bdf8]'
                                : 'hover:bg-[#151922] text-[#dfe2ee]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <Icon className="w-3 h-3 text-[#38bdf8]" />
                                <span className="font-semibold text-[11px]">{col.name}</span>

                                {/* Sorting Indicator */}
                                {isSorted ? (
                                  previewSortOrder === 'asc' ? (
                                    <ArrowUp className="w-3 h-3 text-[#38bdf8]" />
                                  ) : (
                                    <ArrowDown className="w-3 h-3 text-[#38bdf8]" />
                                  )
                                ) : (
                                  <ArrowUpDown className="w-2.5 h-2.5 opacity-20 group-hover/th:opacity-60" />
                                )}
                              </div>

                              {/* Null / Variance indicator pill */}
                              {stats && (
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      stats.nullCount === 0 ? 'bg-[#10b981]' : 'bg-[#f59e0b]'
                                    }`}
                                    title={`${stats.nullCount} nulls`}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Sub-label under column header with quick min/max snippet */}
                            {stats && (
                              <div className="text-[9px] font-normal text-[#64748b] mt-0.5 flex items-center justify-between font-mono">
                                <span>{stats.minFormatted}</span>
                                <span className="opacity-40">→</span>
                                <span>{stats.maxFormatted}</span>
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {currentPreviewRows.map((row, rIdx) => {
                      const absoluteRowIdx = (previewPage - 1) * previewPageSize + rIdx + 1;
                      return (
                        <tr
                          key={rIdx}
                          className={`border-b border-[#1e293b]/40 transition-colors ${
                            rIdx % 2 === 0 ? 'bg-[#0b0f17]' : 'bg-[#0f131c]'
                          } hover:bg-[#181c24]`}
                        >
                          <td className="px-2.5 py-1.5 text-[10px] text-[#64748b] border-r border-[#1e293b]/50">
                            {absoluteRowIdx}
                          </td>
                          {dataset.columns.map((col) => {
                            const val = row[col.name];
                            const isNull = val === null || val === undefined || val === '';
                            const isNumeric = col.type === 'number';

                            return (
                              <td
                                key={col.name}
                                className={`px-3 py-1.5 border-r border-[#1e293b]/50 whitespace-nowrap text-[11px] ${
                                  isNumeric ? 'text-right' : 'text-left'
                                }`}
                              >
                                {isNull ? (
                                  <span className="text-[#f59e0b]/60 italic text-[10px]">
                                    null
                                  </span>
                                ) : isNumeric ? (
                                  <span className="text-[#dfe2ee]">
                                    {formatStatValue(Number(val), col)}
                                  </span>
                                ) : (
                                  <span className="text-[#cbd5e1]">{String(val)}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Preview Pagination Footer */}
              <div className="p-2 border-t border-[#1e293b] bg-[#111827] flex items-center justify-between text-[10px] font-mono text-[#8c909f]">
                <div>
                  Showing {(previewPage - 1) * previewPageSize + 1}-
                  {Math.min(previewPage * previewPageSize, dataset.data.length)} of{' '}
                  {dataset.data.length.toLocaleString()} rows
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={previewPage <= 1}
                    onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded bg-[#0b0f17] border border-[#1e293b] disabled:opacity-30 hover:bg-[#1e293b] text-[#dfe2ee]"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span>
                    Page {previewPage} of {totalPreviewPages}
                  </span>
                  <button
                    disabled={previewPage >= totalPreviewPages}
                    onClick={() => setPreviewPage((p) => Math.min(totalPreviewPages, p + 1))}
                    className="p-1 rounded bg-[#0b0f17] border border-[#1e293b] disabled:opacity-30 hover:bg-[#1e293b] text-[#dfe2ee]"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Global High-Contrast Tooltip Portal for Column Headers */}
      {activeStats && (
        <ColumnHeaderTooltip
          stats={activeStats}
          anchorRect={anchorRect}
          visible={Boolean(hoveredColName && anchorRect)}
        />
      )}
    </>
  );
};
