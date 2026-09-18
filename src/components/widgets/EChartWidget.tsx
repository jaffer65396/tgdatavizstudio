import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { AggregatedResult, DataEngine } from '../../services/dataEngine';
import { ChartConfig, TrendlineResult } from '../../types/dashboard';

interface EChartWidgetProps {
  config: ChartConfig;
  data: AggregatedResult;
  onSliceClick?: (dimensionValue: string) => void;
  selectedValues?: string[];
}

export const EChartWidget: React.FC<EChartWidgetProps> = ({
  config,
  data,
  onSliceClick,
  selectedValues = []
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  // Derive active trendline result (from data or dynamically computed)
  const isTrendlineActive = Boolean(config.showTrendline);
  let activeTrendline: TrendlineResult | undefined = data.trendline;

  if (isTrendlineActive && !activeTrendline && data.categories.length >= 2) {
    if (config.chartType === 'scatter') {
      const pts = data.categories.map((cat, idx) => ({
        x: Number(data.series[0]?.data[idx]) || 0,
        y: Number(data.series[1]?.data[idx]) || 0,
        label: cat
      }));
      activeTrendline = DataEngine.generateScatterTrendline(pts, {
        model: config.trendlineModel || 'linear',
        polynomialDegree: config.polynomialDegree || 2,
        forecastPeriods: config.forecastPeriods || 0,
        showConfidenceInterval: config.showConfidenceInterval
      });
    } else {
      activeTrendline = DataEngine.generateTimeSeriesTrendline(data.categories, data.series[0]?.data || [], {
        model: config.trendlineModel || 'linear',
        polynomialDegree: config.polynomialDegree || 2,
        forecastPeriods: config.forecastPeriods || 0,
        showConfidenceInterval: config.showConfidenceInterval
      });
    }
  }

  useEffect(() => {
    if (!chartRef.current) return;

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current, 'dark', {
        renderer: 'canvas'
      });

      instanceRef.current.on('click', (params: any) => {
        if (params && params.name && onSliceClick) {
          onSliceClick(params.name);
        }
      });
    }

    const chart = instanceRef.current;
    const { chartType, showLegend = false, smoothLine = false } = config;

    // Palette matching precision dark design system
    const defaultColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'];
    const palette = config.colorPalette || defaultColors;

    let option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      color: palette,
      tooltip: {
        trigger: chartType === 'pie' || chartType === 'donut' ? 'item' : 'axis',
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: {
          color: '#f8fafc',
          fontFamily: 'JetBrains Mono',
          fontSize: 12
        },
        padding: [8, 12]
      },
      legend: showLegend
        ? {
            bottom: 0,
            icon: 'circle',
            textStyle: { color: '#94a3b8', fontSize: 11, fontFamily: 'Inter' },
            itemWidth: 8,
            itemHeight: 8
          }
        : undefined,
      grid: {
        top: isTrendlineActive ? 32 : 24,
        left: 48,
        right: 20,
        bottom: showLegend ? 36 : 28,
        containLabel: false
      }
    };

    if (chartType === 'bar' || chartType === 'bar-stacked') {
      const extendedCats = activeTrendline?.extendedCategories && activeTrendline.extendedCategories.length > 0
        ? activeTrendline.extendedCategories
        : data.categories;
      const forecastCount = Math.max(0, extendedCats.length - data.categories.length);

      const seriesList: any[] = data.series.map((s, idx) => ({
        name: s.name,
        type: 'bar',
        data: (forecastCount > 0 ? [...s.data, ...Array(forecastCount).fill(null)] : s.data).map((val, itemIdx) => {
          const catName = extendedCats[itemIdx];
          const isSelected = selectedValues.length === 0 || selectedValues.includes(catName);
          return {
            value: val,
            itemStyle: {
              color: isSelected ? palette[idx % palette.length] : '#262a33',
              borderRadius: [3, 3, 0, 0]
            }
          };
        }),
        barMaxWidth: 36
      }));

      // Overlay trendline if enabled
      if (isTrendlineActive && activeTrendline && activeTrendline.trendlineData.length > 0) {
        if (config.showConfidenceInterval && activeTrendline.lowerConfidence && activeTrendline.confidenceDifference) {
          seriesList.push({
            name: 'CI Lower',
            type: 'line',
            data: activeTrendline.lowerConfidence,
            lineStyle: { opacity: 0 },
            stack: 'trendline-confidence',
            symbol: 'none',
            silent: true
          });
          seriesList.push({
            name: '95% Confidence Band',
            type: 'line',
            data: activeTrendline.confidenceDifference,
            lineStyle: { opacity: 0 },
            areaStyle: { color: 'rgba(245, 158, 11, 0.12)' },
            stack: 'trendline-confidence',
            symbol: 'none',
            silent: true
          });
        }

        seriesList.push({
          name: `${(config.trendlineModel || 'Linear').toUpperCase()} Trendline`,
          type: 'line',
          smooth: config.trendlineModel === 'polynomial' || config.trendlineModel === 'exponential',
          showSymbol: false,
          lineStyle: { width: 2.2, type: 'dashed', color: '#f59e0b' },
          data: activeTrendline.trendlineData,
          z: 8
        });
      }

      option = {
        ...option,
        xAxis: {
          type: 'category',
          data: extendedCats,
          axisLine: { lineStyle: { color: '#1e293b' } },
          axisTick: { show: false },
          axisLabel: {
            color: '#8c909f',
            fontSize: 10,
            fontFamily: 'Inter',
            formatter: (val: string) => (val.includes('(Fcst)') ? `{fcst|${val}}` : val),
            rich: {
              fcst: {
                color: '#f59e0b',
                fontWeight: 'bold',
                fontSize: 10
              }
            }
          }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: '#181c24', type: 'dashed' } },
          axisLabel: {
            color: '#8c909f',
            fontSize: 10,
            fontFamily: 'JetBrains Mono',
            formatter: (val: number) => {
              if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
              if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
              return String(val);
            }
          }
        },
        series: seriesList
      };
    } else if (chartType === 'bar-horizontal') {
      option = {
        ...option,
        grid: { top: 12, left: 130, right: 30, bottom: 20 },
        yAxis: {
          type: 'category',
          data: data.categories,
          inverse: true,
          axisLine: { lineStyle: { color: '#1e293b' } },
          axisTick: { show: false },
          axisLabel: { color: '#dfe2ee', fontSize: 11, fontFamily: 'Inter' }
        },
        xAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: '#181c24', type: 'dashed' } },
          axisLabel: {
            color: '#8c909f',
            fontSize: 10,
            fontFamily: 'JetBrains Mono',
            formatter: (val: number) => `${(val / 1000000).toFixed(1)}M`
          }
        },
        series: data.series.map((s, idx) => ({
          name: s.name,
          type: 'bar',
          data: s.data.map((val, itemIdx) => {
            const catName = data.categories[itemIdx];
            const isSelected = selectedValues.length === 0 || selectedValues.includes(catName);
            return {
              value: val,
              itemStyle: {
                color: isSelected ? palette[idx % palette.length] : '#262a33',
                borderRadius: [0, 3, 3, 0]
              }
            };
          }),
          barMaxWidth: 20
        }))
      };
    } else if (chartType === 'line' || chartType === 'area') {
      const extendedCats = activeTrendline?.extendedCategories && activeTrendline.extendedCategories.length > 0
        ? activeTrendline.extendedCategories
        : data.categories;
      const forecastCount = Math.max(0, extendedCats.length - data.categories.length);

      const seriesList: any[] = [];

      // If confidence intervals are enabled, add confidence band first so it's behind
      if (isTrendlineActive && activeTrendline && config.showConfidenceInterval && activeTrendline.lowerConfidence && activeTrendline.confidenceDifference) {
        seriesList.push({
          name: 'CI Lower Base',
          type: 'line',
          data: activeTrendline.lowerConfidence,
          lineStyle: { opacity: 0 },
          stack: 'trendline-confidence',
          symbol: 'none',
          silent: true,
          z: 1
        });
        seriesList.push({
          name: '95% Confidence Band',
          type: 'line',
          data: activeTrendline.confidenceDifference,
          lineStyle: { opacity: 0 },
          areaStyle: {
            color: 'rgba(245, 158, 11, 0.15)'
          },
          stack: 'trendline-confidence',
          symbol: 'none',
          silent: true,
          z: 2
        });
      }

      // Historical data series (padded with nulls for forecast horizon)
      data.series.forEach((s, idx) => {
        const paddedValues = forecastCount > 0 ? [...s.data, ...Array(forecastCount).fill(null)] : s.data;
        seriesList.push({
          name: s.name,
          type: 'line',
          smooth: smoothLine,
          showSymbol: false,
          lineStyle: { width: 2, color: palette[idx % palette.length] },
          areaStyle: chartType === 'area' ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: idx === 0 ? 'rgba(59, 130, 246, 0.45)' : 'rgba(16, 185, 129, 0.35)' },
              { offset: 1, color: 'rgba(11, 15, 23, 0.0)' }
            ])
          } : undefined,
          data: paddedValues,
          z: 5
        });
      });

      // Add Trendline Series
      if (isTrendlineActive && activeTrendline && activeTrendline.trendlineData.length > 0) {
        seriesList.push({
          name: `${(config.trendlineModel || 'Linear').toUpperCase()} Trendline (R² = ${activeTrendline.rSquared})`,
          type: 'line',
          smooth: config.trendlineModel === 'polynomial' || config.trendlineModel === 'exponential' || smoothLine,
          showSymbol: false,
          lineStyle: {
            width: 2.2,
            type: 'dashed',
            color: '#f59e0b'
          },
          data: activeTrendline.trendlineData,
          z: 10
        });
      }

      option = {
        ...option,
        xAxis: {
          type: 'category',
          data: extendedCats,
          axisLine: { lineStyle: { color: '#1e293b' } },
          axisLabel: {
            color: '#8c909f',
            fontSize: 10,
            fontFamily: 'Inter',
            formatter: (val: string) => (val.includes('(Fcst)') ? `{fcst|${val}}` : val),
            rich: {
              fcst: {
                color: '#f59e0b',
                fontWeight: 'bold',
                fontSize: 10
              }
            }
          }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: '#181c24', type: 'dashed' } },
          axisLabel: {
            color: '#8c909f',
            fontSize: 10,
            fontFamily: 'JetBrains Mono',
            formatter: (val: number) => `${(val / 1000000).toFixed(0)}M`
          }
        },
        series: seriesList
      };
    } else if (chartType === 'pie' || chartType === 'donut') {
      option = {
        ...option,
        series: [
          {
            type: 'pie',
            radius: chartType === 'donut' ? ['50%', '76%'] : '74%',
            center: ['50%', '48%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 3,
              borderColor: '#111827',
              borderWidth: 2
            },
            label: {
              show: false
            },
            data: data.categories.map((cat, idx) => {
              const val = data.series[0]?.data[idx] || 0;
              const isSelected = selectedValues.length === 0 || selectedValues.includes(cat);
              return {
                name: cat,
                value: val,
                itemStyle: {
                  color: isSelected ? palette[idx % palette.length] : '#262a33'
                }
              };
            })
          }
        ]
      };
    } else if (chartType === 'scatter') {
      const scatterPoints = data.categories.map((cat, idx) => {
        const x = data.series[0]?.data[idx] || 0;
        const y = data.series[1]?.data[idx] || 0;
        return [x, y, cat];
      });

      const seriesList: any[] = [
        {
          name: 'Observations',
          type: 'scatter',
          symbolSize: 20,
          itemStyle: {
            color: '#adc6ff',
            shadowBlur: 8,
            shadowColor: 'rgba(173, 198, 255, 0.4)'
          },
          data: scatterPoints,
          z: 5
        }
      ];

      // Trendline for Scatter Plot
      if (isTrendlineActive && activeTrendline && activeTrendline.scatterTrendlineData) {
        if (config.showConfidenceInterval && activeTrendline.scatterUpperConfidence && activeTrendline.scatterLowerConfidence) {
          seriesList.push({
            name: 'Upper 95% CI',
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 1, type: 'dotted', color: 'rgba(245, 158, 11, 0.45)' },
            data: activeTrendline.scatterUpperConfidence,
            z: 8
          });
          seriesList.push({
            name: 'Lower 95% CI',
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 1, type: 'dotted', color: 'rgba(245, 158, 11, 0.45)' },
            data: activeTrendline.scatterLowerConfidence,
            z: 8
          });
        }

        seriesList.push({
          name: `${(config.trendlineModel || 'Linear').toUpperCase()} Trendline (R² = ${activeTrendline.rSquared})`,
          type: 'line',
          smooth: config.trendlineModel === 'polynomial' || config.trendlineModel === 'exponential',
          showSymbol: false,
          lineStyle: {
            color: '#f59e0b',
            width: 2.5,
            type: 'dashed'
          },
          data: activeTrendline.scatterTrendlineData,
          z: 10
        });
      }

      option = {
        ...option,
        xAxis: {
          name: config.measure,
          nameTextStyle: { color: '#8c909f', fontSize: 10 },
          splitLine: { lineStyle: { color: '#181c24' } },
          axisLabel: {
            color: '#8c909f',
            fontFamily: 'JetBrains Mono',
            fontSize: 10,
            formatter: (v: number) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${v}`)
          }
        },
        yAxis: {
          name: config.secondaryMeasure,
          nameTextStyle: { color: '#8c909f', fontSize: 10 },
          splitLine: { lineStyle: { color: '#181c24' } },
          axisLabel: {
            color: '#8c909f',
            fontFamily: 'JetBrains Mono',
            fontSize: 10,
            formatter: (v: number) => `${v}%`
          }
        },
        series: seriesList
      };
    }

    chart.setOption(option, true);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [config, data, selectedValues, onSliceClick, isTrendlineActive, activeTrendline]);

  return (
    <div className="relative w-full h-full min-h-[160px] overflow-hidden">
      <div ref={chartRef} className="w-full h-full min-h-[160px]" />

      {/* Floating Predictive Trendline Diagnostic Chip */}
      {isTrendlineActive && activeTrendline && (
        <div className="absolute top-2 right-2.5 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#0b0f17]/90 border border-[#f59e0b]/40 backdrop-blur-sm pointer-events-auto text-[10px] font-mono shadow-md group select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
          <span className="text-[#f59e0b] font-medium uppercase tracking-wider">
            {config.trendlineModel || 'Linear'}
            {config.trendlineModel === 'polynomial' && ` (deg ${config.polynomialDegree || 2})`}
          </span>
          <span className="text-[#64748b]">|</span>
          <span
            className={`font-semibold ${
              activeTrendline.rSquared >= 0.8
                ? 'text-[#4edea3]'
                : activeTrendline.rSquared >= 0.5
                ? 'text-[#60a5fa]'
                : 'text-[#f59e0b]'
            }`}
          >
            R²={activeTrendline.rSquared}
          </span>

          {/* Interactive Hover Tooltip detailing formula & statistical metrics */}
          <div className="hidden group-hover:block absolute right-0 top-full mt-1.5 p-2.5 bg-[#0f172a] border border-[#1e293b] rounded-[4px] shadow-2xl text-[10px] text-[#f8fafc] whitespace-nowrap z-30 font-mono space-y-1 min-w-[200px]">
            <div className="text-[9px] uppercase tracking-wider text-[#94a3b8] font-bold">Predictive Model</div>
            <div className="text-[#f59e0b] font-semibold text-[11px] pb-1 border-b border-[#1e293b]">
              {activeTrendline.equation}
            </div>
            <div className="text-[#94a3b8] flex items-center justify-between gap-4 pt-0.5">
              <span>Fit Quality (R²):</span>
              <span
                className={`font-bold ${
                  activeTrendline.rSquared >= 0.8
                    ? 'text-[#4edea3]'
                    : activeTrendline.rSquared >= 0.5
                    ? 'text-[#60a5fa]'
                    : 'text-[#f59e0b]'
                }`}
              >
                {activeTrendline.rSquared}
                {activeTrendline.rSquared >= 0.8 ? ' (High)' : activeTrendline.rSquared >= 0.5 ? ' (Moderate)' : ' (Low)'}
              </span>
            </div>
            <div className="text-[#94a3b8] flex items-center justify-between gap-4">
              <span>Std Error (RMSE):</span>
              <span className="text-[#dfe2ee]">{activeTrendline.rmse.toLocaleString()}</span>
            </div>
            {(config.forecastPeriods || 0) > 0 && (
              <div className="text-[#38bdf8] mt-1 pt-1 border-t border-[#1e293b] flex items-center gap-1">
                <span>⚡ Forecast:</span>
                <span className="font-bold">+{config.forecastPeriods} periods ahead</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
