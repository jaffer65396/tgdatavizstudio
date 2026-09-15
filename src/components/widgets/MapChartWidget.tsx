import React, { useState, useMemo, useRef } from 'react';
import { Globe, ZoomIn, ZoomOut, RotateCcw, Layers, MapPin, Check, Info } from 'lucide-react';
import { AggregatedResult } from '../../services/dataEngine';
import { ChartConfig } from '../../types/dashboard';

interface MapChartWidgetProps {
  config: ChartConfig;
  data: AggregatedResult;
  onSliceClick?: (dimensionValue: string) => void;
  selectedValues?: string[];
}

interface GeoEntity {
  id: string;
  name: string;
  region: string;
  path: string; // SVG path
  center: [number, number]; // [x, y] in viewBox coordinates (0..1000, 0..520)
  aliases: string[];
}

// Precision SVG geographic definitions for major global economic territories and countries
const GEO_ENTITIES: GeoEntity[] = [
  // NORTH AMERICA
  {
    id: 'usa',
    name: 'United States',
    region: 'North America',
    aliases: ['united states', 'usa', 'us', 'u.s.', 'north america'],
    center: [230, 200],
    path: 'M 140 130 L 290 120 L 330 160 L 330 200 L 290 250 L 240 260 L 190 230 L 150 200 Z M 100 80 L 140 70 L 150 110 L 110 110 Z' // includes Alaska approx
  },
  {
    id: 'canada',
    name: 'Canada',
    region: 'North America',
    aliases: ['canada', 'ca', 'can', 'north america'],
    center: [230, 95],
    path: 'M 140 125 L 180 70 L 260 50 L 340 70 L 350 115 L 290 120 L 140 125 Z'
  },
  {
    id: 'mexico',
    name: 'Mexico',
    region: 'Latin America',
    aliases: ['mexico', 'mx', 'latin america', 'latam'],
    center: [205, 275],
    path: 'M 180 235 L 230 255 L 250 295 L 210 305 L 170 260 Z'
  },

  // LATIN AMERICA
  {
    id: 'brazil',
    name: 'Brazil',
    region: 'Latin America',
    aliases: ['brazil', 'brasil', 'br', 'latin america', 'latam'],
    center: [360, 375],
    path: 'M 310 330 L 370 320 L 420 350 L 410 420 L 350 440 L 320 380 Z'
  },
  {
    id: 'chile',
    name: 'Chile',
    region: 'Latin America',
    aliases: ['chile', 'cl', 'latin america', 'latam'],
    center: [305, 435],
    path: 'M 305 380 L 315 385 L 305 480 L 295 475 Z'
  },
  {
    id: 'argentina',
    name: 'Argentina',
    region: 'Latin America',
    aliases: ['argentina', 'ar', 'latin america', 'latam'],
    center: [330, 440],
    path: 'M 315 390 L 345 395 L 340 470 L 310 470 Z'
  },

  // EMEA / EUROPE
  {
    id: 'uk',
    name: 'United Kingdom',
    region: 'EMEA',
    aliases: ['united kingdom', 'uk', 'great britain', 'britain', 'emea', 'europe'],
    center: [480, 140],
    path: 'M 470 125 L 488 120 L 490 150 L 475 160 Z'
  },
  {
    id: 'germany',
    name: 'Germany',
    region: 'EMEA',
    aliases: ['germany', 'de', 'deutschland', 'emea', 'europe'],
    center: [530, 150],
    path: 'M 515 135 L 545 135 L 545 165 L 520 165 Z'
  },
  {
    id: 'france',
    name: 'France',
    region: 'EMEA',
    aliases: ['france', 'fr', 'emea', 'europe'],
    center: [505, 175],
    path: 'M 490 160 L 520 160 L 520 195 L 490 195 Z'
  },
  {
    id: 'netherlands',
    name: 'Netherlands',
    region: 'EMEA',
    aliases: ['netherlands', 'nl', 'holland', 'emea', 'europe'],
    center: [512, 140],
    path: 'M 508 135 L 520 135 L 518 148 L 507 146 Z'
  },
  {
    id: 'nordics',
    name: 'Nordics',
    region: 'EMEA',
    aliases: ['nordics', 'sweden', 'norway', 'finland', 'denmark', 'emea', 'europe'],
    center: [545, 95],
    path: 'M 525 120 L 535 70 L 560 65 L 570 110 L 545 120 Z'
  },
  {
    id: 'italy',
    name: 'Italy',
    region: 'EMEA',
    aliases: ['italy', 'it', 'italia', 'emea', 'europe'],
    center: [535, 195],
    path: 'M 525 180 L 540 180 L 555 215 L 540 220 Z'
  },
  {
    id: 'spain',
    name: 'Spain',
    region: 'EMEA',
    aliases: ['spain', 'es', 'espana', 'emea', 'europe'],
    center: [480, 205],
    path: 'M 465 190 L 500 190 L 495 220 L 465 215 Z'
  },

  // ASIA PACIFIC & JAPAN
  {
    id: 'japan',
    name: 'Japan',
    region: 'Japan',
    aliases: ['japan', 'jp', 'nippon', 'asia pacific', 'apac'],
    center: [865, 195],
    path: 'M 855 175 L 875 180 L 870 215 L 850 205 Z'
  },
  {
    id: 'india',
    name: 'India',
    region: 'Asia Pacific',
    aliases: ['india', 'in', 'bharat', 'asia pacific', 'apac'],
    center: [695, 255],
    path: 'M 670 210 L 725 215 L 715 285 L 685 295 L 665 250 Z'
  },
  {
    id: 'singapore',
    name: 'Singapore',
    region: 'Asia Pacific',
    aliases: ['singapore', 'sg', 'asia pacific', 'apac'],
    center: [765, 335],
    path: 'M 758 330 L 772 330 L 772 342 L 758 342 Z'
  },
  {
    id: 'south-korea',
    name: 'South Korea',
    region: 'Asia Pacific',
    aliases: ['south korea', 'korea', 'kr', 'asia pacific', 'apac'],
    center: [830, 190],
    path: 'M 822 180 L 838 180 L 838 200 L 822 200 Z'
  },
  {
    id: 'australia',
    name: 'Australia',
    region: 'Asia Pacific',
    aliases: ['australia', 'au', 'aus', 'asia pacific', 'apac', 'oceania'],
    center: [825, 410],
    path: 'M 770 370 L 870 360 L 890 430 L 820 460 L 760 420 Z'
  }
];

// Continent outline backdrops for visual realism and geographic grounding
const CONTINENT_BACKGROUNDS = [
  // North America continental contour
  'M 100 60 L 260 40 L 370 70 L 330 180 L 280 250 L 210 300 L 170 260 L 130 190 L 90 120 Z',
  // South America continental contour
  'M 290 310 L 380 310 L 430 360 L 400 450 L 330 490 L 290 440 L 280 350 Z',
  // Europe & Northern Eurasia contour
  'M 460 80 L 620 50 L 880 70 L 910 150 L 820 180 L 750 160 L 630 180 L 510 140 L 460 120 Z',
  // Africa contour
  'M 470 230 L 560 220 L 600 290 L 570 390 L 520 420 L 470 350 L 450 270 Z',
  // Asia / Middle East contour
  'M 580 180 L 780 170 L 880 190 L 840 280 L 760 350 L 670 310 L 580 240 Z',
  // Australia contour
  'M 750 360 L 880 350 L 910 430 L 820 475 L 750 430 Z'
];

export const MapChartWidget: React.FC<MapChartWidgetProps> = ({
  config,
  data,
  onSliceClick,
  selectedValues = []
}) => {
  const [mapMode, setMapMode] = useState<'choropleth' | 'bubble'>(config.mapMode || 'choropleth');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredEntity, setHoveredEntity] = useState<{
    name: string;
    region: string;
    value: number;
    formatted: string;
    rank: number;
    pctOfTotal: string;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Map category data to normalized lookup map
  const { dataMap, totalVal, maxVal, minVal, rankedList } = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    let max = 0;
    let min = Infinity;

    const list: { name: string; value: number }[] = [];

    data.categories.forEach((cat, idx) => {
      const val = data.series[0]?.data[idx] || 0;
      const cleanKey = cat.trim().toLowerCase();
      map.set(cleanKey, val);
      total += val;
      if (val > max) max = val;
      if (val < min) min = val;
      list.push({ name: cat, value: val });
    });

    list.sort((a, b) => b.value - a.value);

    return {
      dataMap: map,
      totalVal: total > 0 ? total : 1,
      maxVal: max > 0 ? max : 1,
      minVal: min === Infinity ? 0 : min,
      rankedList: list
    };
  }, [data]);

  // Helper to find data value for a geo entity
  const getEntityValue = (entity: GeoEntity): number => {
    // 1. Direct match by name
    const directVal = dataMap.get(entity.name.toLowerCase());
    if (directVal !== undefined) return directVal;

    // 2. Direct match by aliases
    for (const alias of entity.aliases) {
      const val = dataMap.get(alias);
      if (val !== undefined) return val;
    }

    // 3. Fallback: match by Region (e.g., if dataset is grouped by Region: 'North America', 'EMEA', etc.)
    const regionVal = dataMap.get(entity.region.toLowerCase());
    if (regionVal !== undefined) return regionVal;

    return 0;
  };

  // Helper to format currency/metric numbers
  const formatMetric = (val: number): string => {
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    if (val < 100 && val > 0 && String(val).includes('.')) return `${val.toFixed(1)}%`;
    return String(Math.round(val));
  };

  // Color generator for Choropleth based on value
  const getFillColor = (val: number, isSelected: boolean, isAnySelected: boolean): string => {
    if (val === 0) return '#151b26'; // Empty / unmapped territory

    const ratio = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal || 1)));

    if (isAnySelected && !isSelected) {
      // Dimmed out when another slice is cross-filtered
      return '#1a2233';
    }

    // Modern emerald to cyan / blue precision gradient
    if (ratio < 0.25) return '#0d3d38';
    if (ratio < 0.5) return '#065f46';
    if (ratio < 0.75) return '#059669';
    if (ratio < 0.9) return '#10b981';
    return '#34d399';
  };

  const isAnyFilterActive = selectedValues.length > 0;

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative flex flex-col bg-[#0b0f17] select-none overflow-hidden rounded-[4px]"
    >
      {/* Top Map Header & Controls Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e293b]/60 bg-[#0f141f]/80 backdrop-blur-sm z-10 text-[11px]">
        {/* Metric summary */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[3px] bg-[#10b981]/20 flex items-center justify-center text-[#4edea3]">
            <Globe className="w-2.5 h-2.5" />
          </div>
          <span className="font-mono text-[#8c909f] uppercase tracking-wider text-[10px]">
            {config.dimension || 'Territory'}: {data.categories.length} Nodes Active
          </span>
          <span className="text-[#334155]">|</span>
          <span className="font-mono text-[#f8fafc] font-medium">
            Total: {formatMetric(totalVal)}
          </span>
        </div>

        {/* View mode toggle (Choropleth vs Bubbles) + Zoom Controls */}
        <div className="flex items-center gap-1.5">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#181c24] border border-[#1e293b] rounded-[3px] p-0.5">
            <button
              onClick={() => setMapMode('choropleth')}
              className={`px-2 py-0.5 rounded-[2px] text-[10px] font-medium transition-colors flex items-center gap-1 ${
                mapMode === 'choropleth'
                  ? 'bg-[#10b981]/20 text-[#4edea3] font-semibold'
                  : 'text-[#8c909f] hover:text-[#dfe2ee]'
              }`}
              title="Heatmap gradient fill across countries/regions"
            >
              <Layers className="w-2.5 h-2.5" />
              <span>Choropleth</span>
            </button>
            <button
              onClick={() => setMapMode('bubble')}
              className={`px-2 py-0.5 rounded-[2px] text-[10px] font-medium transition-colors flex items-center gap-1 ${
                mapMode === 'bubble'
                  ? 'bg-[#3b82f6]/20 text-[#adc6ff] font-semibold'
                  : 'text-[#8c909f] hover:text-[#dfe2ee]'
              }`}
              title="Geospatial proportional pins & bubbles"
            >
              <MapPin className="w-2.5 h-2.5" />
              <span>Bubbles</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-[#181c24] border border-[#1e293b] rounded-[3px]">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.2))}
              className="p-1 text-[#8c909f] hover:text-[#f8fafc] hover:bg-[#1e293b] rounded-l-[2px]"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.9, z - 0.2))}
              className="p-1 text-[#8c909f] hover:text-[#f8fafc] hover:bg-[#1e293b]"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 text-[#8c909f] hover:text-[#f8fafc] hover:bg-[#1e293b] rounded-r-[2px]"
              title="Reset Zoom"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Vector Stage */}
      <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center p-2">
        <svg
          viewBox="80 30 840 480"
          className="w-full h-full max-h-full transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Subtle world grid lat/long coordinate lines */}
          <g opacity="0.08" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="3 3">
            <line x1="80" y1="120" x2="920" y2="120" />
            <line x1="80" y1="240" x2="920" y2="240" />
            <line x1="80" y1="360" x2="920" y2="360" />
            <line x1="260" y1="30" x2="260" y2="510" />
            <line x1="520" y1="30" x2="520" y2="510" />
            <line x1="780" y1="30" x2="780" y2="510" />
          </g>

          {/* Continents Base Contours */}
          <g opacity="0.18" fill="#182234" stroke="#223249" strokeWidth="1">
            {CONTINENT_BACKGROUNDS.map((d, idx) => (
              <path key={`cont-${idx}`} d={d} />
            ))}
          </g>

          {/* Economic Country / Territory Geometries */}
          <g>
            {GEO_ENTITIES.map((entity) => {
              const val = getEntityValue(entity);
              const isSelected =
                selectedValues.includes(entity.name) ||
                selectedValues.includes(entity.region);
              const fillColor = getFillColor(val, isSelected, isAnyFilterActive);

              const isHovered = hoveredEntity?.name === entity.name;

              return (
                <path
                  key={entity.id}
                  d={entity.path}
                  fill={mapMode === 'choropleth' ? fillColor : '#151c28'}
                  stroke={
                    isSelected
                      ? '#4edea3'
                      : isHovered
                      ? '#38bdf8'
                      : val > 0
                      ? '#2a3b53'
                      : '#1e293b'
                  }
                  strokeWidth={isSelected ? 2.5 : isHovered ? 1.75 : 1}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    const rank = rankedList.findIndex(
                      (r) =>
                        r.name.toLowerCase() === entity.name.toLowerCase() ||
                        r.name.toLowerCase() === entity.region.toLowerCase()
                    );
                    setHoveredEntity({
                      name: entity.name,
                      region: entity.region,
                      value: val,
                      formatted: formatMetric(val),
                      rank: rank >= 0 ? rank + 1 : 1,
                      pctOfTotal: totalVal > 0 ? `${((val / totalVal) * 100).toFixed(1)}%` : '0%',
                      x: e.clientX - (rect?.left || 0),
                      y: e.clientY - (rect?.top || 0)
                    });
                  }}
                  onMouseMove={(e) => {
                    if (hoveredEntity) {
                      const rect = containerRef.current?.getBoundingClientRect();
                      setHoveredEntity((prev) =>
                        prev
                          ? {
                              ...prev,
                              x: e.clientX - (rect?.left || 0),
                              y: e.clientY - (rect?.top || 0)
                            }
                          : null
                      );
                    }
                  }}
                  onMouseLeave={() => setHoveredEntity(null)}
                  onClick={() => {
                    if (onSliceClick) {
                      // Determine whether to filter by Country or Region
                      const targetName =
                        config.dimension?.toLowerCase() === 'region'
                          ? entity.region
                          : entity.name;
                      onSliceClick(targetName);
                    }
                  }}
                />
              );
            })}
          </g>

          {/* Proportional Bubbles Mode */}
          {mapMode === 'bubble' && (
            <g>
              {GEO_ENTITIES.map((entity) => {
                const val = getEntityValue(entity);
                if (val <= 0) return null;

                const ratio = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal || 1)));
                const radius = 6 + ratio * 24;
                const isSelected =
                  selectedValues.includes(entity.name) ||
                  selectedValues.includes(entity.region);

                return (
                  <g
                    key={`bubble-${entity.id}`}
                    className="cursor-pointer"
                    onClick={() => {
                      if (onSliceClick) {
                        const targetName =
                          config.dimension?.toLowerCase() === 'region'
                            ? entity.region
                            : entity.name;
                        onSliceClick(targetName);
                      }
                    }}
                  >
                    {/* Pulsing outer ring for high performers or selected */}
                    {(ratio > 0.5 || isSelected) && (
                      <circle
                        cx={entity.center[0]}
                        cy={entity.center[1]}
                        r={radius + 4}
                        fill="none"
                        stroke={isSelected ? '#4edea3' : '#38bdf8'}
                        strokeWidth="1.5"
                        opacity="0.4"
                        className="animate-pulse"
                      />
                    )}
                    {/* Main bubble */}
                    <circle
                      cx={entity.center[0]}
                      cy={entity.center[1]}
                      r={radius}
                      fill={isSelected ? '#10b981' : '#3b82f6'}
                      fillOpacity={isSelected ? 0.75 : 0.6}
                      stroke={isSelected ? '#4edea3' : '#93c5fd'}
                      strokeWidth="1.5"
                    />
                    {/* Centroid dot */}
                    <circle
                      cx={entity.center[0]}
                      cy={entity.center[1]}
                      r="2"
                      fill="#ffffff"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Territory Labels for Top Nodes */}
          <g pointerEvents="none">
            {GEO_ENTITIES.map((entity) => {
              const val = getEntityValue(entity);
              if (val <= 0) return null;

              const isSelected =
                selectedValues.includes(entity.name) ||
                selectedValues.includes(entity.region);

              return (
                <text
                  key={`label-${entity.id}`}
                  x={entity.center[0]}
                  y={entity.center[1] + (mapMode === 'bubble' ? 18 : 3)}
                  textAnchor="middle"
                  fill={isSelected ? '#4edea3' : '#94a3b8'}
                  fontSize="9"
                  fontFamily="Inter, sans-serif"
                  fontWeight={isSelected ? '700' : '500'}
                  className="select-none"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                >
                  {entity.name.length > 12 ? entity.name.slice(0, 10) + '..' : entity.name}
                </text>
              );
            })}
          </g>
        </svg>

        {/* Floating Tooltip */}
        {hoveredEntity && (
          <div
            className="absolute pointer-events-none z-50 bg-[#141b27]/95 border border-[#334155] rounded-[4px] px-3 py-2 text-[11px] shadow-2xl backdrop-blur-md min-w-[170px]"
            style={{
              left: Math.min(hoveredEntity.x + 15, (containerRef.current?.clientWidth || 300) - 190),
              top: Math.max(10, hoveredEntity.y - 45)
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#1e293b] pb-1 mb-1">
              <span className="font-semibold text-[#f8fafc]">{hoveredEntity.name}</span>
              <span className="text-[10px] font-mono px-1 rounded bg-[#1e293b] text-[#94a3b8]">
                {hoveredEntity.region}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="text-[#8c909f] text-[10px]">
                {config.measure || 'Value'}:
              </span>
              <span className="font-mono font-bold text-[#4edea3] text-[13px]">
                {hoveredEntity.formatted}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#8c909f] mt-1 font-mono">
              <span>Contribution:</span>
              <span className="text-[#dfe2ee] font-semibold">{hoveredEntity.pctOfTotal}</span>
            </div>

            <div className="mt-1.5 pt-1 border-t border-[#1e293b] flex items-center gap-1 text-[9px] text-[#38bdf8]">
              <Check className="w-2.5 h-2.5" />
              <span>Click to cross-filter dashboard</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Territory Quick-Selector Chips & Heat Legend */}
      <div className="px-3 py-1.5 border-t border-[#1e293b]/60 bg-[#0f141f]/90 flex items-center justify-between gap-3 text-[11px]">
        {/* Quick Filter Chips for Top Territories */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-mono text-[#8c909f] uppercase mr-1">Top:</span>
          {rankedList.slice(0, 5).map((item) => {
            const isSelected = selectedValues.includes(item.name);
            return (
              <button
                key={item.name}
                onClick={() => onSliceClick?.(item.name)}
                className={`px-2 py-0.5 rounded-[3px] text-[10px] font-medium whitespace-nowrap transition-colors border ${
                  isSelected
                    ? 'bg-[#10b981]/25 border-[#10b981]/50 text-[#4edea3] font-semibold'
                    : 'bg-[#181c24] border-[#1e293b] text-[#dfe2ee] hover:border-[#334155]'
                }`}
              >
                <span>{item.name}</span>
                <span className="ml-1 text-[9px] font-mono text-[#8c909f]">
                  {formatMetric(item.value)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Choropleth Continuous Gradient Legend */}
        {mapMode === 'choropleth' && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8c909f]">
            <span>{formatMetric(minVal)}</span>
            <div className="w-20 h-2 rounded-[2px] bg-gradient-to-r from-[#0d3d38] via-[#059669] to-[#34d399] border border-[#1e293b]" />
            <span className="text-[#4edea3] font-semibold">{formatMetric(maxVal)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
