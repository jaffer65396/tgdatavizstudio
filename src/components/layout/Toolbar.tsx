import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  Filter,
  SlidersHorizontal,
  Plus,
  Eye,
  Edit3,
  XCircle,
  ChevronDown,
  Upload,
  Database
} from 'lucide-react';
import { Dataset } from '../../types/dashboard';

interface ToolbarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  crossFilterEnabled: boolean;
  onToggleCrossFilter: () => void;
  onOpenFilterDrawer: () => void;
  onAddWidget: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  activeCrossFilterCount: number;
  onClearCrossFilters: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenImportData: () => void;
  activeDataset?: Dataset;
  datasets?: Dataset[];
  onSelectDataset?: (id: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  zoom,
  onZoomChange,
  crossFilterEnabled,
  onToggleCrossFilter,
  onOpenFilterDrawer,
  onAddWidget,
  isEditMode,
  onToggleEditMode,
  activeCrossFilterCount,
  onClearCrossFilters,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenImportData,
  activeDataset,
  datasets = [],
  onSelectDataset
}) => {
  const [zoomOpen, setZoomOpen] = useState(false);
  const [datasetDropdownOpen, setDatasetDropdownOpen] = useState(false);
  const zoomOptions = [50, 75, 90, 100, 110, 125, 150];

  return (
    <div className="h-9 bg-[#0b0f17] border-b border-[#1e293b] flex items-center justify-between px-3 text-[12px] select-none z-40 relative">
      {/* Left controls: Undo, Redo, Zoom, Filter, Cross-filter */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="flex items-center">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 text-[#8c909f] hover:text-[#f8fafc] disabled:opacity-30 hover:bg-[#181c24] rounded-[2px] transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 text-[#8c909f] hover:text-[#f8fafc] disabled:opacity-30 hover:bg-[#181c24] rounded-[2px] transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[#1e293b] mx-1" />

        {/* Zoom Selector dropdown */}
        <div className="relative">
          <button
            onClick={() => setZoomOpen(!zoomOpen)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-[#181c24] border border-[#1e293b] text-[#dfe2ee] hover:border-[#334155] font-mono text-[11px]"
          >
            <ZoomIn className="w-3 h-3 text-[#8c909f]" />
            <span>{zoom}%</span>
            <ChevronDown className="w-2.5 h-2.5 text-[#8c909f]" />
          </button>

          {zoomOpen && (
            <div
              className="absolute left-0 top-full mt-1 w-24 bg-[#181c24] border border-[#334155] rounded-[3px] shadow-xl py-1 z-50 font-mono text-[11px]"
              onMouseLeave={() => setZoomOpen(false)}
            >
              {zoomOptions.map((z) => (
                <button
                  key={z}
                  onClick={() => {
                    onZoomChange(z);
                    setZoomOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1 hover:bg-[#1e293b] ${
                    zoom === z ? 'text-[#3b82f6] font-semibold' : 'text-[#dfe2ee]'
                  }`}
                >
                  {z}%
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add Filter button */}
        <button
          onClick={onOpenFilterDrawer}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] text-[#dfe2ee] hover:bg-[#181c24] border border-transparent hover:border-[#1e293b] transition-colors"
        >
          <Filter className="w-3 h-3 text-[#8c909f]" />
          <span>Add Filter</span>
        </button>

        {/* Cross-Filter Enabled toggle */}
        <button
          onClick={onToggleCrossFilter}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-[3px] transition-colors text-[11px] font-medium font-sans ${
            crossFilterEnabled
              ? 'bg-[#10b981]/15 text-[#4edea3] border border-[#10b981]/30'
              : 'bg-[#181c24] text-[#8c909f] border border-[#1e293b]'
          }`}
          title="Click any chart category or slice to cross-filter all dashboard metrics"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>Cross-Filter Enabled</span>
        </button>

        {/* Clear active cross filters if any are set */}
        {activeCrossFilterCount > 0 && (
          <button
            onClick={onClearCrossFilters}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#181c24] border border-[#334155] rounded-[3px] text-[11px] text-[#adc6ff] hover:text-[#f8fafc] transition-colors font-mono"
          >
            <XCircle className="w-3 h-3 text-[#ffb4ab]" />
            <span>Reset {activeCrossFilterCount} Slice{activeCrossFilterCount > 1 ? 's' : ''}</span>
          </button>
        )}
      </div>

      {/* Right controls: Import Data, Dataset Switcher, Add Widget, Edit Mode Switch */}
      <div className="flex items-center gap-2">
        {/* Dataset Switcher & Import Data */}
        <div className="flex items-center gap-1.5">
          {activeDataset && (
            <div className="relative">
              <button
                onClick={() => setDatasetDropdownOpen(!datasetDropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-[#181c24] border border-[#1e293b] hover:border-[#334155] text-[#dfe2ee] text-[11px] font-medium"
                title="Active Data Source"
              >
                <Database className="w-3 h-3 text-[#10b981]" />
                <span className="max-w-[130px] truncate">{activeDataset.name}</span>
                <ChevronDown className="w-2.5 h-2.5 text-[#8c909f]" />
              </button>

              {datasetDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-60 bg-[#181c24] border border-[#334155] rounded-[4px] shadow-2xl py-1 z-50 text-[11px]"
                  onMouseLeave={() => setDatasetDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-mono text-[#8c909f] uppercase tracking-wider border-b border-[#1e293b]">
                    Active Datasets ({datasets.length})
                  </div>
                  {datasets.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        onSelectDataset?.(d.id);
                        setDatasetDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center justify-between ${
                        activeDataset.id === d.id ? 'text-[#4edea3] font-semibold bg-[#10b981]/10' : 'text-[#dfe2ee]'
                      }`}
                    >
                      <span className="truncate pr-2">{d.name}</span>
                      <span className="text-[10px] font-mono text-[#8c909f]">
                        {d.rowCount >= 1000000 ? `${(d.rowCount / 1000000).toFixed(1)}M` : d.rowCount.toLocaleString()}
                      </span>
                    </button>
                  ))}
                  <div className="my-1 border-t border-[#1e293b]" />
                  <button
                    onClick={() => {
                      setDatasetDropdownOpen(false);
                      onOpenImportData();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] text-[#4edea3] font-medium flex items-center gap-1.5"
                  >
                    <Upload className="w-3 h-3" />
                    <span>+ Import New Dataset...</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Import Data Button */}
          <button
            onClick={onOpenImportData}
            className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/40 text-[#4edea3] rounded-[3px] text-[11px] font-medium transition-all shadow-[0_1px_4px_rgba(16,185,129,0.15)]"
            title="Import data easily from CSV, Excel, Google Sheets, or web feeds"
          >
            <Upload className="w-3 h-3" />
            <span>Import Data</span>
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[#1e293b] mx-0.5" />

        {/* Add Widget */}
        <button
          onClick={onAddWidget}
          className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#181c24] hover:bg-[#1e293b] border border-[#334155] text-[#dfe2ee] rounded-[3px] text-[11px] transition-colors"
        >
          <Plus className="w-3 h-3 text-[#3b82f6]" />
          <span>Add Widget</span>
        </button>

        {/* Edit / View Mode Toggle */}
        <button
          onClick={onToggleEditMode}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-[3px] border transition-colors text-[11px] font-medium ${
            isEditMode
              ? 'bg-[#3b82f6]/15 border-[#3b82f6]/40 text-[#adc6ff]'
              : 'bg-[#181c24] border-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee]'
          }`}
        >
          {isEditMode ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          <span>{isEditMode ? 'Design Mode' : 'View Mode'}</span>
        </button>
      </div>
    </div>
  );
};
