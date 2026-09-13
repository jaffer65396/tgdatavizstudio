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
  ChevronRight
} from 'lucide-react';
import { DashboardElement, ChartType, AggregationType, Dataset } from '../../types/dashboard';

interface PropertiesDrawerProps {
  element: DashboardElement | null;
  dataset: Dataset;
  onClose: () => void;
  onUpdateElement: (updated: DashboardElement) => void;
}

export const PropertiesDrawer: React.FC<PropertiesDrawerProps> = ({
  element,
  dataset,
  onClose,
  onUpdateElement
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

        {/* Primary Dimension (X-Axis / Category) */}
        {element.config.chartType !== 'kpi' && (
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8c909f] mb-1">
              Dimension (X-Axis)
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
