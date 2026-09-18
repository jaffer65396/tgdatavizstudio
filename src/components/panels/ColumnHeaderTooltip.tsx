import React from 'react';
import { createPortal } from 'react-dom';
import {
  Hash,
  Calendar,
  Type,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Percent,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { ColumnStatistics } from '../../services/columnStats';

interface ColumnHeaderTooltipProps {
  stats: ColumnStatistics;
  anchorRect: DOMRect | null;
  visible: boolean;
}

export const ColumnHeaderTooltip: React.FC<ColumnHeaderTooltipProps> = ({
  stats,
  anchorRect,
  visible
}) => {
  if (!visible || !anchorRect) return null;

  // Calculate position with viewport boundary detection
  const tooltipWidth = 330;
  const padding = 12;
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Prefer rendering to the right of the anchor; flip to left if insufficient space
  let left = anchorRect.right + 10;
  if (left + tooltipWidth > windowWidth - padding) {
    left = Math.max(padding, anchorRect.left - tooltipWidth - 10);
  }

  // Vertically align with anchor top, clamped within viewport bounds
  let top = anchorRect.top;
  const estimatedHeight = stats.isNumeric ? 360 : 310;
  if (top + estimatedHeight > windowHeight - padding) {
    top = Math.max(padding, windowHeight - estimatedHeight - padding);
  }
  if (top < padding) top = padding;

  const Icon = stats.type === 'number' ? Hash : stats.type === 'date' ? Calendar : Type;
  const isZeroNulls = stats.nullCount === 0;

  return createPortal(
    <div
      id={`tooltip-column-${stats.columnName.replace(/\s+/g, '-').toLowerCase()}`}
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${tooltipWidth}px`,
        zIndex: 99999
      }}
      className="pointer-events-none select-none bg-[#0b0f17] border border-[#334155] rounded-[6px] shadow-[0_12px_36px_rgba(0,0,0,0.7)] p-3 text-[11px] font-sans text-[#dfe2ee] animate-in fade-in duration-150 backdrop-blur-md"
    >
      {/* Tooltip Header: Column name, type, and category */}
      <div className="flex items-start justify-between pb-2 mb-2.5 border-b border-[#1e293b]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-[#1e293b] flex items-center justify-center flex-shrink-0">
            <Icon className="w-3.5 h-3.5 text-[#38bdf8]" />
          </div>
          <div className="truncate">
            <div className="font-semibold text-[12px] text-[#f8fafc] truncate font-mono">
              {stats.columnName}
            </div>
            <div className="text-[10px] text-[#8c909f] flex items-center gap-1.5 font-mono">
              <span>{stats.totalRows.toLocaleString()} rows</span>
              <span>•</span>
              <span className="text-[#38bdf8] font-medium uppercase">{stats.type}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <span
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded-[3px] font-semibold uppercase ${
              stats.category === 'measure'
                ? 'bg-[#10b981]/15 text-[#4edea3] border border-[#10b981]/30'
                : stats.category === 'time'
                ? 'bg-[#8b5cf6]/15 text-[#d0bcff] border border-[#8b5cf6]/30'
                : 'bg-[#3b82f6]/15 text-[#93c5fd] border border-[#3b82f6]/30'
            }`}
          >
            {stats.category}
          </span>
        </div>
      </div>

      {/* Primary Highlights: Min/Max & Null Count Cards */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        {/* Min / Max Range Card */}
        <div className="p-2 rounded-[4px] bg-[#111827] border border-[#1e293b] flex flex-col justify-between">
          <div className="text-[9px] font-mono text-[#8c909f] uppercase tracking-wider flex items-center justify-between mb-1">
            <span>Range (Min / Max)</span>
            <ArrowRight className="w-2.5 h-2.5 text-[#64748b]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#64748b] font-mono text-[9px]">MIN</span>
              <span className="font-mono text-[#38bdf8] font-semibold truncate max-w-[90px]" title={String(stats.minRaw)}>
                {stats.minFormatted}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#64748b] font-mono text-[9px]">MAX</span>
              <span className="font-mono text-[#f59e0b] font-semibold truncate max-w-[90px]" title={String(stats.maxRaw)}>
                {stats.maxFormatted}
              </span>
            </div>
          </div>
          {stats.rangeFormatted && (
            <div className="mt-1 pt-1 border-t border-[#1e293b] flex items-center justify-between text-[9px] font-mono text-[#8c909f]">
              <span>Span:</span>
              <span className="text-[#cbd5e1]">{stats.rangeFormatted}</span>
            </div>
          )}
        </div>

        {/* Null Count & Data Quality Card */}
        <div className="p-2 rounded-[4px] bg-[#111827] border border-[#1e293b] flex flex-col justify-between">
          <div className="text-[9px] font-mono text-[#8c909f] uppercase tracking-wider flex items-center justify-between mb-1">
            <span>Null Count</span>
            {isZeroNulls ? (
              <ShieldCheck className="w-3 h-3 text-[#10b981]" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-[#f59e0b]" />
            )}
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-[15px] font-mono font-bold leading-tight ${
                  isZeroNulls ? 'text-[#4edea3]' : stats.nullCount > 5 ? 'text-[#f43f5e]' : 'text-[#fbbf24]'
                }`}
              >
                {stats.nullCount.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#8c909f] font-mono">
                ({stats.nullPercentage.toFixed(1)}%)
              </span>
            </div>

            {/* Completeness Bar */}
            <div className="mt-1.5 w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.max(2, 100 - stats.nullPercentage)}%` }}
                className={`h-full ${isZeroNulls ? 'bg-[#10b981]' : 'bg-[#38bdf8]'}`}
              />
              {stats.nullPercentage > 0 && (
                <div
                  style={{ width: `${stats.nullPercentage}%` }}
                  className="h-full bg-[#f43f5e]"
                />
              )}
            </div>
          </div>

          <div className="mt-1 pt-1 border-t border-[#1e293b] flex items-center justify-between text-[9px] font-mono text-[#8c909f]">
            <span>Populated:</span>
            <span className="text-[#cbd5e1]">
              {stats.validCount.toLocaleString()} ({((stats.validCount / Math.max(1, stats.totalRows)) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Data Variance & Dispersion Statistics Section */}
      <div className="p-2.5 rounded-[4px] bg-[#111827]/90 border border-[#1e293b] mb-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-[#f8fafc]">
            <Activity className="w-3 h-3 text-[#f59e0b]" />
            <span>DATA VARIANCE & DISPERSION</span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30">
            {stats.varianceEvaluation}
          </span>
        </div>

        {stats.isNumeric ? (
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
              <div className="flex items-center justify-between text-[#8c909f]">
                <span>Variance (σ²):</span>
                <span className="text-[#f8fafc] font-semibold">{stats.varianceFormatted}</span>
              </div>
              <div className="flex items-center justify-between text-[#8c909f]">
                <span>Std Dev (σ):</span>
                <span className="text-[#38bdf8] font-semibold">{stats.stdDevFormatted}</span>
              </div>
              <div className="flex items-center justify-between text-[#8c909f]">
                <span>Mean (μ):</span>
                <span className="text-[#dfe2ee]">{stats.meanFormatted}</span>
              </div>
              <div className="flex items-center justify-between text-[#8c909f]">
                <span>Coeff Var (CV):</span>
                <span className="text-[#f59e0b]">{stats.cvFormatted}</span>
              </div>
              {stats.medianFormatted && (
                <div className="flex items-center justify-between text-[#8c909f]">
                  <span>Median (Q2):</span>
                  <span className="text-[#dfe2ee]">{stats.medianFormatted}</span>
                </div>
              )}
              {stats.iqr !== undefined && (
                <div className="flex items-center justify-between text-[#8c909f]">
                  <span>IQR (Q3-Q1):</span>
                  <span className="text-[#dfe2ee]">{stats.iqr.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Mini Histogram Sparkline */}
            {stats.histogram && stats.histogram.length > 0 && (
              <div className="pt-1.5 border-t border-[#1e293b]">
                <div className="flex items-center justify-between text-[8px] font-mono text-[#64748b] mb-1">
                  <span>FREQUENCY DISTRIBUTION</span>
                  <span>{stats.minFormatted} → {stats.maxFormatted}</span>
                </div>
                <div className="flex items-end gap-1 h-7 bg-[#0b0f17] p-1 rounded-[3px] border border-[#1e293b]">
                  {stats.histogram.map((bin, bIdx) => {
                    const maxPct = Math.max(...stats.histogram!.map((h) => h.pct), 1);
                    const barHeight = Math.max(3, Math.round((bin.pct / maxPct) * 18));
                    return (
                      <div
                        key={bIdx}
                        className="flex-1 bg-[#3b82f6]/60 hover:bg-[#38bdf8] rounded-t-[1px] transition-all"
                        style={{ height: `${barHeight}px` }}
                        title={`${bin.binLabel}: ${bin.count} items (${bin.pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : stats.isDate ? (
          <div className="space-y-1 text-[10px] font-mono">
            <div className="flex items-center justify-between text-[#8c909f]">
              <span>Timespan Duration:</span>
              <span className="text-[#f8fafc] font-semibold">{stats.dateSpanDays} days</span>
            </div>
            <div className="flex items-center justify-between text-[#8c909f]">
              <span>Temporal Variance:</span>
              <span className="text-[#f59e0b] font-semibold">{stats.varianceFormatted}</span>
            </div>
            <div className="flex items-center justify-between text-[#8c909f]">
              <span>Std Dev Spread:</span>
              <span className="text-[#38bdf8] font-semibold">{stats.stdDevFormatted}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 text-[10px] font-mono">
            <div className="flex items-center justify-between text-[#8c909f]">
              <span>Distinct Values:</span>
              <span className="text-[#f8fafc] font-semibold">
                {stats.uniqueCount.toLocaleString()} ({((stats.cardinalityRatio) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-[#8c909f]">
              <span>Mode (Top Value):</span>
              <span className="text-[#38bdf8] font-semibold truncate max-w-[130px]" title={stats.topValue}>
                "{stats.topValue}"
              </span>
            </div>
            <div className="flex items-center justify-between text-[#8c909f]">
              <span>Mode Frequency:</span>
              <span className="text-[#dfe2ee]">
                {stats.topValueCount?.toLocaleString()} rows ({stats.topValuePct?.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-[#8c909f]">
              <span>Categorical IQV:</span>
              <span className="text-[#f59e0b] font-semibold">{stats.varianceFormatted}</span>
            </div>
          </div>
        )}
      </div>

      {/* Human-Readable Descriptive Summary */}
      <div className="p-2 rounded-[4px] bg-[#0b0f17] border border-[#1e293b] flex items-start gap-1.5">
        <Sparkles className="w-3 h-3 text-[#38bdf8] flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#94a3b8] leading-relaxed font-sans">
          {stats.descriptiveSummary}
        </p>
      </div>
    </div>,
    document.body
  );
};
