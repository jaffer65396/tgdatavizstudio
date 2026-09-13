import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { AggregatedResult } from '../../services/dataEngine';
import { ChartConfig } from '../../types/dashboard';

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
        top: 24,
        left: 48,
        right: 20,
        bottom: showLegend ? 36 : 28,
        containLabel: false
      }
    };

    if (chartType === 'bar' || chartType === 'bar-stacked') {
      option = {
        ...option,
        xAxis: {
          type: 'category',
          data: data.categories,
          axisLine: { lineStyle: { color: '#1e293b' } },
          axisTick: { show: false },
          axisLabel: { color: '#8c909f', fontSize: 10, fontFamily: 'Inter' }
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
                borderRadius: [3, 3, 0, 0]
              }
            };
          }),
          barMaxWidth: 36
        }))
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
      option = {
        ...option,
        xAxis: {
          type: 'category',
          data: data.categories,
          axisLine: { lineStyle: { color: '#1e293b' } },
          axisLabel: { color: '#8c909f', fontSize: 10, fontFamily: 'Inter' }
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
        series: data.series.map((s, idx) => ({
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
          data: s.data
        }))
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
            formatter: (v: number) => `${(v / 1000000).toFixed(1)}M`
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
        series: [
          {
            type: 'scatter',
            symbolSize: 22,
            itemStyle: {
              color: '#adc6ff',
              shadowBlur: 8,
              shadowColor: 'rgba(173, 198, 255, 0.4)'
            },
            data: scatterPoints
          }
        ]
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
  }, [config, data, selectedValues, onSliceClick]);

  return <div ref={chartRef} className="w-full h-full min-h-[160px]" />;
};
