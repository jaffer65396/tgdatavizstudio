import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ChartConfig } from '../../types/dashboard';
import { DataEngine } from '../../services/dataEngine';

interface KpiCardWidgetProps {
  title: string;
  config: ChartConfig;
  currentValue: number;
}

export const KpiCardWidget: React.FC<KpiCardWidgetProps> = ({
  title,
  config,
  currentValue
}) => {
  const {
    kpiValuePrefix = '',
    kpiValueSuffix = '',
    kpiDelta = 12.5,
    kpiDeltaLabel = 'vs previous period',
    sparklineData = [30, 42, 38, 55, 62, 70, 85]
  } = config;

  const isPositive = kpiDelta >= 0;
  const formattedVal = DataEngine.formatNumber(
    currentValue,
    kpiValuePrefix === '$' ? 'currency' : kpiValueSuffix === '%' ? 'percent' : undefined,
    kpiValuePrefix,
    kpiValueSuffix
  );

  // Generate SVG sparkline path
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;
  const width = 84;
  const height = 28;

  const points = sparklineData
    .map((v, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - ((v - minVal) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col justify-between h-full w-full p-3 select-none">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider text-[#8c909f] uppercase font-mono">
          {title}
        </span>
        <div
          className={`flex items-center gap-1 text-[11px] font-mono font-medium px-1.5 py-0.5 rounded-[2px] ${
            isPositive
              ? 'bg-[#10b981]/10 text-[#4edea3] border border-[#10b981]/20'
              : 'bg-[#f43f5e]/10 text-[#ffb4ab] border border-[#f43f5e]/20'
          }`}
        >
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{isPositive ? `+${kpiDelta}%` : `${kpiDelta}%`}</span>
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="text-[24px] font-semibold text-[#f8fafc] tracking-tight font-mono">
          {formattedVal}
        </div>

        {/* Sparkline curve */}
        <div className="opacity-75 hover:opacity-100 transition-opacity">
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              fill="none"
              stroke={isPositive ? '#4edea3' : '#ffb4ab'}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      <div className="text-[11px] text-[#64748b] font-mono mt-0.5 flex items-center justify-between">
        <span>{kpiDeltaLabel}</span>
        <span className="text-[10px] text-[#424754]">Real-time index</span>
      </div>
    </div>
  );
};
