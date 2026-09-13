import React from 'react';
import {
  X,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  BarChart2,
  Table as TableIcon,
  Hash
} from 'lucide-react';
import { DashboardElement } from '../../types/dashboard';

interface LayersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  elements: DashboardElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
}

export const LayersDrawer: React.FC<LayersDrawerProps> = ({
  isOpen,
  onClose,
  elements,
  selectedElementId,
  onSelectElement,
  onDeleteElement
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-72 bg-[#0f131c] border-r border-[#1e293b] flex flex-col h-full z-30 select-none text-[12px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e293b] bg-[#111827]">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#3b82f6]" />
          <span className="font-semibold text-[#f8fafc]">Layer Hierarchy</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee] rounded-[3px]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Layer List */}
      <div className="p-3 space-y-1.5 overflow-y-auto flex-1">
        {elements.map((el) => {
          const isSelected = el.id === selectedElementId;
          const Icon = el.type === 'kpi' ? Hash : el.type === 'table' ? TableIcon : BarChart2;

          return (
            <div
              key={el.id}
              onClick={() => onSelectElement(el.id)}
              className={`flex items-center justify-between px-2.5 py-2 rounded-[4px] border cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-[#1e293b] border-[#3b82f6] text-[#f8fafc]'
                  : 'bg-[#0b0f17] border-[#1e293b] text-[#8c909f] hover:border-[#334155]'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-[#adc6ff]' : 'text-[#64748b]'}`} />
                <span className="text-[11px] font-medium truncate font-sans">
                  {el.title}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteElement(el.id);
                  }}
                  className="p-1 text-[#64748b] hover:text-[#ffb4ab] rounded"
                  title="Remove Layer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
