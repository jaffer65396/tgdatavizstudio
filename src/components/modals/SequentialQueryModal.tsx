import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Database,
  Code2,
  Eye,
  CheckCircle,
  Copy,
  Check,
  Zap,
  Clock,
  Layers,
  Table as TableIcon
} from 'lucide-react';
import { Dataset, SortClause, SortType, DashboardElement } from '../../types/dashboard';
import { DataEngine } from '../../services/dataEngine';

interface SequentialQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset;
  element?: DashboardElement | null;
  onApplyWidgetSort?: (clauses: SortClause[]) => void;
  onSortDatasetPermanently?: (sortedDataset: Dataset) => void;
}

export const SequentialQueryModal: React.FC<SequentialQueryModalProps> = ({
  isOpen,
  onClose,
  dataset,
  element,
  onApplyWidgetSort,
  onSortDatasetPermanently
}) => {
  // Initialize clauses from existing widget config or auto-detect
  const [clauses, setClauses] = useState<SortClause[]>(() => {
    if (element?.config.sequentialSort && element.config.sequentialSort.length > 0) {
      return [...element.config.sequentialSort];
    }
    return DataEngine.getPerfectOrderClauses(dataset.columns);
  });

  const [activeTab, setActiveTab] = useState<'preview' | 'sql' | 'info'>('preview');
  const [copiedSql, setCopiedSql] = useState(false);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto detect perfect order
  const handleAutoDetectPerfectOrder = () => {
    const perfectClauses = DataEngine.getPerfectOrderClauses(dataset.columns);
    setClauses(perfectClauses);
    showNotice('Auto-detected perfect chronological and hierarchical sequential ordering!');
  };

  const showNotice = (msg: string) => {
    setAppliedNotification(msg);
    setTimeout(() => setAppliedNotification(null), 3500);
  };

  // Add new sort stage
  const handleAddStage = () => {
    const usedCols = new Set(clauses.map((c) => c.column));
    const nextCol = dataset.columns.find((c) => !usedCols.has(c.name)) || dataset.columns[0];
    if (!nextCol) return;

    const newClause: SortClause = {
      id: `clause-${Date.now()}-${clauses.length + 1}`,
      column: nextCol.name,
      order: nextCol.category === 'measure' ? 'desc' : 'asc',
      type: nextCol.category === 'time' ? 'chronological' : nextCol.category === 'measure' ? 'numeric' : 'auto'
    };
    setClauses([...clauses, newClause]);
  };

  // Update clause
  const handleUpdateClause = (id: string, updates: Partial<SortClause>) => {
    setClauses(clauses.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  // Remove clause
  const handleRemoveClause = (id: string) => {
    setClauses(clauses.filter((c) => c.id !== id));
  };

  // Move clause up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...clauses];
    const [moved] = next.splice(index, 1);
    next.splice(index - 1, 0, moved);
    setClauses(next);
  };

  // Move clause down
  const handleMoveDown = (index: number) => {
    if (index === clauses.length - 1) return;
    const next = [...clauses];
    const [moved] = next.splice(index, 1);
    next.splice(index + 1, 0, moved);
    setClauses(next);
  };

  // Clear all
  const handleClearAll = () => {
    setClauses([]);
  };

  // Sorted preview data
  const previewSortedRows = useMemo(() => {
    return DataEngine.sequentialSort(dataset.data, clauses).slice(0, 10);
  }, [dataset.data, clauses]);

  // Raw unsorted rows for comparison
  const rawUnsortedRows = useMemo(() => {
    return dataset.data.slice(0, 10);
  }, [dataset.data]);

  // Generated SQL Query
  const generatedSql = useMemo(() => {
    return DataEngine.generateSequentialSortSql(dataset.name, clauses, 100);
  }, [dataset.name, clauses]);

  // Copy SQL
  const handleCopySql = () => {
    navigator.clipboard.writeText(generatedSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Apply to current widget
  const handleApplyToWidget = () => {
    if (onApplyWidgetSort) {
      onApplyWidgetSort(clauses);
      showNotice('Sequential sorting query applied to active widget!');
    }
  };

  // Sort entire dataset
  const handleSortDataset = () => {
    if (onSortDatasetPermanently) {
      const sortedDataset = DataEngine.sortDatasetSequentially(dataset, clauses);
      onSortDatasetPermanently(sortedDataset);
      showNotice('Dataset permanently sequenced into perfect order!');
    }
  };

  const previewCols = dataset.columns.slice(0, 6);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f131c] border border-[#1e293b] rounded-[8px] w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[#dfe2ee] font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[6px] bg-[#3b82f6]/15 border border-[#3b82f6]/30 flex items-center justify-center text-[#60a5fa]">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold text-[#f8fafc]">
                  Sequential Query & Multi-Key Sorter
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#3b82f6]/20 text-[#93c5fd] border border-[#3b82f6]/40">
                  DuckDB Order Engine
                </span>
              </div>
              <p className="text-[12px] text-[#8c909f]">
                Order unsorted data into the perfect multi-stage sequence across chronological, hierarchical, and numeric keys.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee] rounded-[4px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notification pill if applied */}
        {appliedNotification && (
          <div className="bg-[#10b981]/20 border-b border-[#10b981]/40 px-6 py-2 flex items-center gap-2 text-[12px] font-mono text-[#4edea3] transition-all">
            <CheckCircle className="w-4 h-4" />
            <span>{appliedNotification}</span>
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Target & Auto-Detect Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#141923] border border-[#1e293b] rounded-[6px]">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-[#10b981]" />
              <div>
                <span className="text-[11px] font-mono uppercase text-[#8c909f] block">Target Source</span>
                <span className="text-[13px] font-semibold text-[#f8fafc]">
                  {dataset.name} ({dataset.rowCount.toLocaleString()} rows)
                  {element && ` • Widget: ${element.title}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleAutoDetectPerfectOrder}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-gradient-to-r from-[#2563eb] to-[#3b82f6] hover:from-[#1d4ed8] hover:to-[#2563eb] text-white rounded-[4px] text-[12px] font-medium flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-yellow-300" />
                <span>Auto-Detect Perfect Order</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-2 bg-[#1e293b] hover:bg-[#334155] text-[#8c909f] hover:text-[#dfe2ee] rounded-[4px] text-[12px] transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Sequential Clauses Pipeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c909f]">
                  Sequential Query Pipeline ({clauses.length} {clauses.length === 1 ? 'Stage' : 'Stages'})
                </span>
                <span className="text-[10px] text-[#64748b] font-mono">
                  (Evaluated in sequence from Step 1 to Step {clauses.length})
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddStage}
                className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#60a5fa] border border-[#3b82f6]/30 hover:border-[#3b82f6]/50 rounded-[4px] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Stage</span>
              </button>
            </div>

            {clauses.length === 0 ? (
              <div className="p-8 border border-dashed border-[#1e293b] rounded-[6px] text-center bg-[#0b0f17]">
                <ArrowUpDown className="w-8 h-8 text-[#334155] mx-auto mb-2" />
                <p className="text-[13px] text-[#8c909f] mb-2">No sort stages configured yet.</p>
                <button
                  type="button"
                  onClick={handleAutoDetectPerfectOrder}
                  className="text-[12px] text-[#60a5fa] hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Click to auto-generate the perfect chronological and hierarchical sequence
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {clauses.map((clause, idx) => {
                  const colSchema = dataset.columns.find((c) => c.name === clause.column);
                  return (
                    <div
                      key={clause.id}
                      className="flex flex-wrap md:flex-nowrap items-center gap-2.5 p-3 bg-[#111827] border border-[#1e293b] hover:border-[#334155] rounded-[6px] transition-colors"
                    >
                      {/* Step Indicator */}
                      <div className="w-6 h-6 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[10px] font-mono font-bold text-[#adc6ff]">
                        {idx + 1}
                      </div>

                      {/* Column Picker */}
                      <div className="flex-1 min-w-[160px]">
                        <label className="block text-[9px] font-mono text-[#64748b] uppercase mb-0.5">
                          Column Key
                        </label>
                        <select
                          value={clause.column}
                          onChange={(e) => {
                            const newColName = e.target.value;
                            const newCol = dataset.columns.find((c) => c.name === newColName);
                            const autoType: SortType =
                              newCol?.category === 'time'
                                ? 'chronological'
                                : newCol?.category === 'measure'
                                ? 'numeric'
                                : 'auto';
                            handleUpdateClause(clause.id, {
                              column: newColName,
                              type: autoType,
                              order: newCol?.category === 'measure' ? 'desc' : 'asc'
                            });
                          }}
                          className="w-full h-8 px-2.5 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[12px] font-mono text-[#f8fafc] outline-none focus:border-[#3b82f6]"
                        >
                          {dataset.columns.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name} ({c.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Direction */}
                      <div className="w-36">
                        <label className="block text-[9px] font-mono text-[#64748b] uppercase mb-0.5">
                          Order Direction
                        </label>
                        <div className="flex bg-[#0b0f17] border border-[#1e293b] rounded-[4px] p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateClause(clause.id, { order: 'asc' })}
                            className={`flex-1 py-1 px-1.5 rounded-[3px] text-[11px] font-mono flex items-center justify-center gap-1 transition-colors ${
                              clause.order === 'asc'
                                ? 'bg-[#3b82f6] text-white font-medium shadow-sm'
                                : 'text-[#8c909f] hover:text-[#dfe2ee]'
                            }`}
                          >
                            <ArrowUp className="w-3 h-3" />
                            <span>ASC</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateClause(clause.id, { order: 'desc' })}
                            className={`flex-1 py-1 px-1.5 rounded-[3px] text-[11px] font-mono flex items-center justify-center gap-1 transition-colors ${
                              clause.order === 'desc'
                                ? 'bg-[#3b82f6] text-white font-medium shadow-sm'
                                : 'text-[#8c909f] hover:text-[#dfe2ee]'
                            }`}
                          >
                            <ArrowDown className="w-3 h-3" />
                            <span>DESC</span>
                          </button>
                        </div>
                      </div>

                      {/* Sort Logic / Engine Comparator */}
                      <div className="w-48">
                        <label className="block text-[9px] font-mono text-[#64748b] uppercase mb-0.5">
                          Comparator Logic
                        </label>
                        <select
                          value={clause.type || 'auto'}
                          onChange={(e) => handleUpdateClause(clause.id, { type: e.target.value as SortType })}
                          className="w-full h-8 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[11px] font-mono text-[#dfe2ee] outline-none"
                        >
                          <option value="auto">Auto-Detect</option>
                          <option value="chronological">Chronological (Q1, Months, Dates)</option>
                          <option value="alphanumeric">Natural Alphanumeric</option>
                          <option value="numeric">Numeric Magnitude</option>
                        </select>
                      </div>

                      {/* Reorder & Remove Actions */}
                      <div className="flex items-center gap-1 pt-3.5">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          title="Move Up"
                          className="p-1 hover:bg-[#1e293b] disabled:opacity-25 text-[#8c909f] hover:text-[#dfe2ee] rounded-[3px]"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === clauses.length - 1}
                          title="Move Down"
                          className="p-1 hover:bg-[#1e293b] disabled:opacity-25 text-[#8c909f] hover:text-[#dfe2ee] rounded-[3px]"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveClause(clause.id)}
                          title="Delete Stage"
                          className="p-1 hover:bg-[#ef4444]/20 text-[#8c909f] hover:text-[#f87171] rounded-[3px] ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tab Switcher: Preview vs SQL vs Info */}
          <div>
            <div className="flex items-center gap-1 border-b border-[#1e293b] mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`pb-2 px-3 text-[12px] font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'border-[#3b82f6] text-[#60a5fa]'
                    : 'border-transparent text-[#8c909f] hover:text-[#dfe2ee]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Data Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sql')}
                className={`pb-2 px-3 text-[12px] font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'sql'
                    ? 'border-[#3b82f6] text-[#60a5fa]'
                    : 'border-transparent text-[#8c909f] hover:text-[#dfe2ee]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Generated Sequential SQL</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`pb-2 px-3 text-[12px] font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'info'
                    ? 'border-[#3b82f6] text-[#60a5fa]'
                    : 'border-transparent text-[#8c909f] hover:text-[#dfe2ee]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Engine Telemetry</span>
              </button>
            </div>

            {/* Preview Panel */}
            {activeTab === 'preview' && (
              <div className="bg-[#0b0f17] border border-[#1e293b] rounded-[6px] overflow-hidden">
                <div className="p-2.5 bg-[#111827] border-b border-[#1e293b] flex items-center justify-between text-[11px] font-mono text-[#8c909f]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span>Top 10 Sequenced Rows (Result of sequential sort pipeline)</span>
                  </div>
                  <span>Total rows evaluated: {dataset.rowCount.toLocaleString()}</span>
                </div>

                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#141923] border-b border-[#1e293b] font-mono text-[#64748b]">
                        <th className="py-1.5 px-3 w-12 text-center">#</th>
                        {previewCols.map((col) => {
                          const isSorted = clauses.find((c) => c.column === col.name);
                          return (
                            <th key={col.name} className="py-1.5 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <span>{col.name}</span>
                                {isSorted && (
                                  <span className="text-[#60a5fa] font-mono text-[10px]">
                                    {isSorted.order === 'asc' ? '▲' : '▼'}
                                  </span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b] font-mono">
                      {previewSortedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#181c24]/50 transition-colors">
                          <td className="py-1.5 px-3 text-center text-[#64748b] bg-[#0d111a]">{idx + 1}</td>
                          {previewCols.map((col) => (
                            <td key={col.name} className="py-1.5 px-3 whitespace-nowrap text-[#dfe2ee]">
                              {col.format === 'currency'
                                ? `$${Number(row[col.name] || 0).toLocaleString()}`
                                : String(row[col.name] ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SQL Tab */}
            {activeTab === 'sql' && (
              <div className="relative bg-[#0b0f17] border border-[#1e293b] rounded-[6px] p-4 font-mono text-[12px]">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="absolute top-3 right-3 px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#dfe2ee] rounded-[3px] text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
                </button>
                <pre className="text-[#60a5fa] overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {generatedSql}
                </pre>
              </div>
            )}

            {/* Telemetry / Info Tab */}
            {activeTab === 'info' && (
              <div className="bg-[#0b0f17] border border-[#1e293b] rounded-[6px] p-4 space-y-3 text-[12px] text-[#8c909f]">
                <div className="flex items-center gap-2 text-[#f8fafc] font-semibold">
                  <Sparkles className="w-4 h-4 text-[#3b82f6]" />
                  <span>Sequential Query & Perfect Order Principles</span>
                </div>
                <ul className="space-y-1.5 list-disc pl-5">
                  <li>
                    <strong className="text-[#dfe2ee]">Chronological Sequence:</strong> Intelligently parses quarterly identifiers (e.g. Q1 2024, Q2 2024), month abbreviations, and ISO 8601 dates to ensure true time ordering instead of basic alphabetical sorting.
                  </li>
                  <li>
                    <strong className="text-[#dfe2ee]">Natural Collation:</strong> Numeric substrings inside dimensions (e.g., "Region 1", "Region 2", "Region 10") are sorted by numerical value rather than ASCII code points.
                  </li>
                  <li>
                    <strong className="text-[#dfe2ee]">DuckDB Order Stability:</strong> Employs multi-pass stable quicksort semantics so records with identical primary keys preserve relative order during secondary and tertiary evaluation.
                  </li>
                </ul>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1e293b] bg-[#111827]">
          <span className="text-[11px] font-mono text-[#64748b]">
            {clauses.length} active sequential clauses
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-[#dfe2ee] rounded-[4px] text-[12px] font-medium transition-colors"
            >
              Cancel
            </button>

            {element && onApplyWidgetSort && (
              <button
                type="button"
                onClick={handleApplyToWidget}
                className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-[4px] text-[12px] font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Apply to Current Widget</span>
              </button>
            )}

            {onSortDatasetPermanently && (
              <button
                type="button"
                onClick={handleSortDataset}
                className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-[4px] text-[12px] font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Sort Dataset in Perfect Order</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
