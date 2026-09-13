import React, { useState } from 'react';
import { X, Filter, Plus, Trash2, Check } from 'lucide-react';
import { FilterRule, Dataset } from '../../types/dashboard';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset;
  filters: FilterRule[];
  onAddFilter: (rule: FilterRule) => void;
  onRemoveFilter: (id: string) => void;
  onToggleFilter: (id: string) => void;
  onClearAll: () => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  dataset,
  filters,
  onAddFilter,
  onRemoveFilter,
  onToggleFilter,
  onClearAll
}) => {
  const [selectedColumn, setSelectedColumn] = useState(dataset.columns[0]?.name || 'Region');
  const [operator, setOperator] = useState<'equals' | 'contains' | 'greaterThan'>('equals');
  const [filterValue, setFilterValue] = useState('');

  if (!isOpen) return null;

  // Derive unique samples for the selected column
  const uniqueSamples = Array.from(new Set(dataset.data.map((r) => r[selectedColumn]))).slice(0, 8);

  const handleCreate = () => {
    if (!filterValue) return;
    const rule: FilterRule = {
      id: `filter-${Date.now()}`,
      column: selectedColumn,
      operator,
      value: filterValue,
      active: true
    };
    onAddFilter(rule);
    setFilterValue('');
  };

  return (
    <aside className="w-80 bg-[#0f131c] border-l border-[#1e293b] flex flex-col h-full z-30 select-none text-[12px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e293b] bg-[#111827]">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#3b82f6]" />
          <span className="font-semibold text-[#f8fafc]">Global Dashboard Filters</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee] rounded-[3px]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 font-sans">
        {/* Active Filters List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-[#8c909f] uppercase tracking-wider">
              Active Slice Rules ({filters.length})
            </span>
            {filters.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[10px] text-[#ffb4ab] hover:underline font-mono"
              >
                Clear All
              </button>
            )}
          </div>

          {filters.length === 0 ? (
            <div className="p-3 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[11px] text-[#64748b] text-center font-mono">
              No global filters active. All charts query the entire 1.2M row dataset.
            </div>
          ) : (
            <div className="space-y-1.5">
              {filters.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-2 bg-[#181c24] border border-[#1e293b] rounded-[4px] text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={f.active}
                      onChange={() => onToggleFilter(f.id)}
                      className="accent-[#3b82f6]"
                    />
                    <div>
                      <span className="font-semibold text-[#f8fafc] font-mono">{f.column}</span>{' '}
                      <span className="text-[#8c909f]">{f.operator}</span>{' '}
                      <span className="text-[#adc6ff] font-mono">"{String(f.value)}"</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveFilter(f.id)}
                    className="p-1 text-[#8c909f] hover:text-[#ffb4ab]"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Filter Form */}
        <div className="pt-3 border-t border-[#1e293b] space-y-3">
          <span className="block text-[11px] font-mono text-[#8c909f] uppercase tracking-wider">
            Add Filter Expression
          </span>

          <div>
            <label className="block text-[10px] text-[#8c909f] mb-1 font-mono">Column</label>
            <select
              value={selectedColumn}
              onChange={(e) => {
                setSelectedColumn(e.target.value);
                setFilterValue('');
              }}
              className="w-full h-7 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[3px] text-[#dfe2ee] font-mono text-[11px] outline-none"
            >
              {dataset.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[#8c909f] mb-1 font-mono">Condition</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as any)}
              className="w-full h-7 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[3px] text-[#dfe2ee] font-mono text-[11px] outline-none"
            >
              <option value="equals">Equals (=)</option>
              <option value="contains">Contains substring</option>
              <option value="greaterThan">Greater than (&gt;)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[#8c909f] mb-1 font-mono">Value</label>
            <input
              type="text"
              placeholder="Filter value..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="w-full h-7 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[3px] text-[#dfe2ee] font-mono text-[11px] outline-none"
            />
          </div>

          {/* Quick value suggestions */}
          <div>
            <span className="block text-[10px] text-[#64748b] mb-1 font-mono">Suggestions:</span>
            <div className="flex flex-wrap gap-1">
              {uniqueSamples.map((val, idx) => (
                <button
                  key={idx}
                  onClick={() => setFilterValue(String(val))}
                  className="px-1.5 py-0.5 bg-[#181c24] hover:bg-[#1e293b] border border-[#1e293b] rounded text-[10px] text-[#94a3b8] font-mono truncate max-w-[120px]"
                >
                  {String(val)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!filterValue}
            className="w-full h-8 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white rounded-[4px] font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors mt-2"
          >
            <Plus className="w-3 h-3" />
            <span>Apply Global Filter</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
