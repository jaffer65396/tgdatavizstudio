import React from 'react';
import {
  X,
  Sliders,
  BarChart2,
  PieChart,
  TrendingUp,
  Table as TableIcon,
  Palette,
  Hash,
  Layers,
  ChevronRight,
  Globe,
  ArrowUpDown,
  Zap,
  Sparkles
} from 'lucide-react';
import { DashboardElement, ChartType, AggregationType, Dataset, SortClause } from '../../types/dashboard';
import { DataEngine } from '../../services/dataEngine';

interface PropertiesDrawerProps {
  element: DashboardElement | null;
  dataset: Dataset;
  onClose: () => void;
  onUpdateElement: (updated: DashboardElement) => void;
  onOpenSequentialModal?: () => void;
}

export const PropertiesDrawer: React.FC<PropertiesDrawerProps> = ({
  element,
  dataset,
  onClose,
  onUpdateElement,
  onOpenSequentialModal
}) => {
  if (!element) return null;

  const chartTypes: { id: ChartType; label: string; icon: any }[] = [
    { id: 'bar', label: 'Vertical Bar', icon: BarChart2 },
    { id: 'bar-horizontal', label: 'Horizontal Bar', icon: BarChart2 },
    { id: 'line', label: 'Line Chart', icon: TrendingUp },
    { id: 'area', label: 'Area Chart', icon: TrendingUp },
    { id: 'donut', label: 'Donut Chart', icon: PieChart },
    { id: 'pie', label: 'Pie Chart', icon: PieChart },
    { id: 'scatter', label: 'Scatter Plot', icon: Hash },
    { id: 'map', label: 'Geographic Map', icon: Globe },
    { id: 'kpi', label: 'KPI Card', icon: Hash },
    { id: 'table', label: 'Data Table', icon: TableIcon }
  ];

  const dimensions = dataset.columns.filter((c) => c.category === 'dimension' || c.category === 'time');
  const measures = dataset.columns.filter((c) => c.category === 'measure');

  const handleChangeType = (type: ChartType) => {
    onUpdateElement({
      ...element,
      config: {
        ...element.config,
        chartType: type
      }
    });
  };

  const handleChangeField = (field: string, value: any) => {
    onUpdateElement({
      ...element,
      config: {
        ...element.config,
        [field]: value
      }
    });
  };

  return (
    <aside className="w-72 bg-[#0f131c] border-l border-[#1e293b] flex flex-col h-full z-30 select-none text-[12px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#1e293b] bg-[#111827]">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[#3b82f6]" />
          <span className="font-semibold text-[#f8fafc] text-[12px]">
            Widget Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee] rounded-[3px]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-4 overflow-y-auto flex-1 font-sans">
        {/* Widget Title */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8c909f] mb-1">
            Widget Title
          </label>
          <input
            type="text"
            value={element.title}
            onChange={(e) => onUpdateElement({ ...element, title: e.target.value })}
            className="w-full h-7 px-2 bg-[#0b0f17] border border-[#1e293b] focus:border-[#3b82f6] rounded-[3px] text-[#f8fafc] outline-none text-[11px]"
          />
        </div>

        {/* Chart Type Selection */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8c909f] mb-1.5">
            Visualization Type
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {chartTypes.map((t) => {
              const Icon = t.icon;
              const isSelected = element.config.chartType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleChangeType(t.id)}
                  className={`p-1.5 rounded-[3px] border flex flex-col items-center gap-1 text-center transition-colors ${
                    isSelected
                      ? 'bg-[#1e293b] border-[#3b82f6] text-[#adc6ff]'
                      : 'bg-[#0b0f17] border-[#1e293b] text-[#8c909f] hover:border-[#334155]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono leading-tight">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Map Specific Configuration */}
        {element.config.chartType === 'map' && (
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8c909f] mb-1">
              Map Visualization Style
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleChangeField('mapMode', 'choropleth')}
                className={`py-1 px-2 rounded-[3px] text-[11px] font-medium border text-center transition-colors ${
                  (element.config.mapMode || 'choropleth') === 'choropleth'
                    ? 'bg-[#10b981]/20 border-[#10b981]/50 text-[#4edea3]'
                    : 'bg-[#181c24] border-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee]'
                }`}
              >
                Choropleth (Heat)
              </button>
              <button
                type="button"
                onClick={() => handleChangeField('mapMode', 'bubble')}
                className={`py-1 px-2 rounded-[3px] text-[11px] font-medium border text-center transition-colors ${
                  element.config.mapMode === 'bubble'
                    ? 'bg-[#3b82f6]/20 border-[#3b82f6]/50 text-[#adc6ff]'
                    : 'bg-[#181c24] border-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee]'
                }`}
              >
                Bubbles (Pins)
              </button>
            </div>
          </div>
        )}

        {/* Primary Dimension (X-Axis / Category) */}
        {element.config.chartType !== 'kpi' && (
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8c909f] mb-1">
              {element.config.chartType === 'map' ? 'Geographic Dimension (Country / Region)' : 'Dimension (X-Axis)'}
            </label>
            <select
              value={element.config.dimension || ''}
              onChange={(e) => handleChangeField('dimension', e.target.value)}
              className="w-full h-7 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[3px] text-[#dfe2ee] outline-none text-[11px] font-mono"
            >
              <option value="">-- None / Default --</option>
              {dimensions.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} ({d.category})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Primary Measure (Y-Axis / Metric) */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8c909f] mb-1">
            Measure (Y-Axis Metric)
          </label>
          <select
            value={element.config.measure || ''}
            onChange={(e) => handleChangeField('measure', e.target.value)}
            className="w-full h-7 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[3px] text-[#dfe2ee] outline-none text-[11px] font-mono"
          >
            <option value="">-- Select Measure --</option>
            {measures.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} ({m.format || 'num'})
              </option>
            ))}
          </select>
        </div>

        {/* Secondary Measure (Optional) */}
        {element.config.chartType !== 'kpi' && element.config.chartType !== 'table' && (
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8c909f] mb-1">
              Secondary Measure (Dual-Series)
            </label>
            <select
              value={element.config.secondaryMeasure || ''}
              onChange={(e) => handleChangeField('secondaryMeasure', e.target.value)}
              className="w-full h-7 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[3px] text-[#dfe2ee] outline-none text-[11px] font-mono"
            >
              <option value="">-- None --</option>
              {measures.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Aggregation Method */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8c909f] mb-1">
            Aggregation Formula
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(['SUM', 'AVG', 'MIN', 'MAX'] as AggregationType[]).map((agg) => (
              <button
                key={agg}
                onClick={() => handleChangeField('aggregation', agg)}
                className={`py-1 rounded-[3px] border text-[10px] font-mono font-medium ${
                  element.config.aggregation === agg
                    ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
                    : 'bg-[#0b0f17] text-[#8c909f] border-[#1e293b]'
                }`}
              >
                {agg}
              </button>
            ))}
          </div>
        </div>

        {/* Sequential Query & Multi-Key Sorting Pipeline */}
        <div className="pt-2 border-t border-[#1e293b]">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#8c909f] flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-[#3b82f6]" />
              <span>Sequential Sort Pipeline</span>
            </label>
            {element.config.sequentialSort && element.config.sequentialSort.length > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#3b82f6]/20 text-[#93c5fd]">
                {element.config.sequentialSort.length} {element.config.sequentialSort.length === 1 ? 'stage' : 'stages'}
              </span>
            )}
          </div>

          {/* Quick Auto-Detect or Configure buttons */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const perfectClauses = DataEngine.getPerfectOrderClauses(dataset.columns);
                  onUpdateElement({
                    ...element,
                    config: {
                      ...element.config,
                      sequentialSort: perfectClauses,
                      sequentialSortMode: 'pipeline'
                    }
                  });
                }}
                className="py-1.5 px-2 bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/40 rounded-[3px] text-[10px] font-mono font-medium text-[#4edea3] flex items-center justify-center gap-1 transition-colors"
                title="Automatically sort by Chronological Date -> Region -> Measure DESC"
              >
                <Zap className="w-3 h-3 fill-current text-yellow-300" />
                <span>⚡ Perfect Order</span>
              </button>

              {onOpenSequentialModal && (
                <button
                  type="button"
                  onClick={onOpenSequentialModal}
                  className="py-1.5 px-2 bg-[#1e293b] hover:bg-[#334155] border border-[#3b82f6]/30 rounded-[3px] text-[10px] font-mono font-medium text-[#93c5fd] flex items-center justify-center gap-1 transition-colors"
                >
                  <ArrowUpDown className="w-3 h-3 text-[#60a5fa]" />
                  <span>Pipeline Editor</span>
                </button>
              )}
            </div>

            {/* Display active stages summary if present */}
            {element.config.sequentialSort && element.config.sequentialSort.length > 0 && (
              <div className="p-2 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] space-y-1 text-[10px] font-mono">
                {element.config.sequentialSort.map((stage, idx) => (
                  <div key={stage.id || idx} className="flex items-center justify-between text-[#adc6ff]">
                    <span className="flex items-center gap-1">
                      <span className="text-[#64748b]">{idx + 1}.</span>
                      <span className="text-[#f8fafc] font-medium">{stage.column}</span>
                    </span>
                    <span className="text-[#60a5fa] font-bold">
                      {stage.order.toUpperCase()}
                      {stage.type === 'chronological' && ' ⏱'}
                    </span>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    onUpdateElement({
                      ...element,
                      config: {
                        ...element.config,
                        sequentialSort: [],
                        sequentialSortMode: undefined
                      }
                    });
                  }}
                  className="text-[9px] text-[#ef4444] hover:underline pt-1 block"
                >
                  Clear Sequential Pipeline
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Presentation Toggles */}
        <div className="pt-2 border-t border-[#1e293b] space-y-2">
          <label className="flex items-center justify-between text-[11px] text-[#dfe2ee] cursor-pointer">
            <span>Show Legend</span>
            <input
              type="checkbox"
              checked={element.config.showLegend || false}
              onChange={(e) => handleChangeField('showLegend', e.target.checked)}
              className="rounded accent-[#3b82f6]"
            />
          </label>

          {(element.config.chartType === 'line' || element.config.chartType === 'area') && (
            <label className="flex items-center justify-between text-[11px] text-[#dfe2ee] cursor-pointer">
              <span>Smooth Curves (Cubic Spline)</span>
              <input
                type="checkbox"
                checked={element.config.smoothLine || false}
                onChange={(e) => handleChangeField('smoothLine', e.target.checked)}
                className="rounded accent-[#3b82f6]"
              />
            </label>
          )}
        </div>

        {/* Layout coordinates readout */}
        <div className="pt-2 border-t border-[#1e293b] text-[10px] font-mono text-[#64748b]">
          <div>Position: X={element.layout.x}px, Y={element.layout.y}px</div>
          <div>Dimensions: W={element.layout.w}px, H={element.layout.h}px</div>
        </div>
      </div>
    </aside>
  );
};
