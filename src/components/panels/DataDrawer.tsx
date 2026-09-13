import React, { useState } from 'react';
import {
  X,
  Database,
  Hash,
  Type,
  Calendar,
  Calculator,
  Plus,
  Play,
  CheckCircle
} from 'lucide-react';
import { Dataset, ColumnSchema } from '../../types/dashboard';

interface DataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset;
  onAddCalculatedField: (name: string, formula: string) => void;
}

export const DataDrawer: React.FC<DataDrawerProps> = ({
  isOpen,
  onClose,
  dataset,
  onAddCalculatedField
}) => {
  const [calcName, setCalcName] = useState('');
  const [calcFormula, setCalcFormula] = useState('');
  const [calcSuccess, setCalcSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCreateCalculated = () => {
    if (!calcName || !calcFormula) return;
    onAddCalculatedField(calcName, calcFormula);
    setCalcName('');
    setCalcFormula('');
    setCalcSuccess(true);
    setTimeout(() => setCalcSuccess(false), 2000);
  };

  return (
    <aside className="w-80 bg-[#0f131c] border-r border-[#1e293b] flex flex-col h-full z-30 select-none text-[12px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e293b] bg-[#111827]">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#10b981]" />
          <span className="font-semibold text-[#f8fafc]">Datasets & Schema</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee] rounded-[3px]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-5 overflow-y-auto flex-1 font-sans">
        {/* Dataset metadata badge */}
        <div className="p-3 bg-[#181c24] border border-[#1e293b] rounded-[4px]">
          <div className="text-[12px] font-semibold text-[#f8fafc] truncate">
            {dataset.name}
          </div>
          <div className="text-[11px] font-mono text-[#8c909f] mt-1 flex items-center justify-between">
            <span>{dataset.sourceType.toUpperCase()} Engine</span>
            <span className="text-[#4edea3]">{(dataset.rowCount / 1000000).toFixed(1)}M rows</span>
          </div>
        </div>

        {/* Schema Tree */}
        <div>
          <span className="block text-[11px] font-mono text-[#8c909f] uppercase tracking-wider mb-2">
            Fields ({dataset.columns.length})
          </span>

          <div className="space-y-1">
            {dataset.columns.map((col) => {
              const Icon = col.type === 'number' ? Hash : col.type === 'date' ? Calendar : Type;
              return (
                <div
                  key={col.name}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-[#0b0f17] hover:bg-[#181c24] border border-[#1e293b] rounded-[3px] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-[#3b82f6]" />
                    <span className="text-[11px] font-mono text-[#dfe2ee]">{col.name}</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                      col.category === 'measure'
                        ? 'bg-[#10b981]/15 text-[#4edea3]'
                        : col.category === 'time'
                        ? 'bg-[#8b5cf6]/15 text-[#d0bcff]'
                        : 'bg-[#1e293b] text-[#8c909f]'
                    }`}
                  >
                    {col.category}
                  </span>
                </div>
              );
            })}
          </div>
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
    </aside>
  );
};
