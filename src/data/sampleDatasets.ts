import { Dataset } from '../types/dashboard';

// Generate comprehensive Global Sales & Margin analytical dataset
export function generateSalesDataset(): Dataset {
  const regions = ['North America', 'EMEA', 'Asia Pacific', 'Latin America', 'Japan'];
  const countriesByRegion: Record<string, string[]> = {
    'North America': ['United States', 'Canada'],
    'EMEA': ['Germany', 'United Kingdom', 'France', 'Netherlands', 'Nordics'],
    'Asia Pacific': ['Australia', 'Singapore', 'India', 'South Korea'],
    'Latin America': ['Brazil', 'Mexico', 'Chile'],
    'Japan': ['Japan']
  };

  const categories = [
    'Cloud Compute & Storage',
    'AI & Machine Learning',
    'Enterprise Cyber Security',
    'Modern Data Stack',
    'Developer Productivity'
  ];

  const segments = ['Enterprise', 'Strategic', 'Mid-Market', 'Commercial'];
  const quarters = ['2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4', '2026-Q1', '2026-Q2'];

  const rows: Record<string, any>[] = [];

  // Deterministic seed for reproducible analytical numbers
  let seed = 42;
  function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  quarters.forEach((quarter) => {
    regions.forEach((region) => {
      const countries = countriesByRegion[region];
      countries.forEach((country) => {
        categories.forEach((category) => {
          segments.forEach((segment) => {
            const baseVol = 
              category === 'Cloud Compute & Storage' ? 140 :
              category === 'AI & Machine Learning' ? 95 :
              category === 'Enterprise Cyber Security' ? 70 : 45;

            const regionMultiplier = 
              region === 'North America' ? 2.4 :
              region === 'EMEA' ? 1.8 :
              region === 'Asia Pacific' ? 1.4 :
              region === 'Japan' ? 0.9 : 0.6;

            const segmentMultiplier = 
              segment === 'Enterprise' ? 2.2 :
              segment === 'Strategic' ? 1.6 :
              segment === 'Mid-Market' ? 0.9 : 0.5;

            const timeGrowth = quarters.indexOf(quarter) * 0.08 + 1.0;
            const variance = 0.85 + random() * 0.3;

            const units = Math.round(baseVol * regionMultiplier * segmentMultiplier * timeGrowth * variance);
            const unitPrice = 
              category === 'AI & Machine Learning' ? 4800 :
              category === 'Enterprise Cyber Security' ? 3200 :
              category === 'Cloud Compute & Storage' ? 2400 : 1800;

            const revenue = Math.round(units * unitPrice * (0.92 + random() * 0.16));
            const costMarginBase = 
              category === 'AI & Machine Learning' ? 0.32 :
              category === 'Enterprise Cyber Security' ? 0.28 :
              category === 'Cloud Compute & Storage' ? 0.42 : 0.35;
            
            const cost = Math.round(revenue * (costMarginBase + (random() - 0.5) * 0.06));
            const profit = revenue - cost;
            const marginPct = Number(((profit / revenue) * 100).toFixed(1));
            const discountPct = Number((random() * 12 + 2).toFixed(1));

            rows.push({
              Quarter: quarter,
              Region: region,
              Country: country,
              Category: category,
              Segment: segment,
              Revenue: revenue,
              Cost: cost,
              Profit: profit,
              MarginPct: marginPct,
              UnitsSold: units,
              DiscountPct: discountPct,
            });
          });
        });
      });
    });
  });

  return {
    id: 'ds-sales-global',
    name: 'Global Sales & Margin Intelligence v3',
    sourceType: 'duckdb',
    rowCount: 1245320, // Represents 1.2M underlying vectorized records aggregated into high-speed OLAP cube
    lastRefreshed: 'Just now',
    columns: [
      { name: 'Quarter', type: 'string', category: 'time', nullable: false, uniqueCount: quarters.length },
      { name: 'Region', type: 'string', category: 'dimension', nullable: false, uniqueCount: regions.length },
      { name: 'Country', type: 'string', category: 'dimension', nullable: false, uniqueCount: 14 },
      { name: 'Category', type: 'string', category: 'dimension', nullable: false, uniqueCount: categories.length },
      { name: 'Segment', type: 'string', category: 'dimension', nullable: false, uniqueCount: segments.length },
      { name: 'Revenue', type: 'number', category: 'measure', format: 'currency', nullable: false, uniqueCount: rows.length },
      { name: 'Cost', type: 'number', category: 'measure', format: 'currency', nullable: false, uniqueCount: rows.length },
      { name: 'Profit', type: 'number', category: 'measure', format: 'currency', nullable: false, uniqueCount: rows.length },
      { name: 'MarginPct', type: 'number', category: 'measure', format: 'percent', nullable: false, uniqueCount: 180 },
      { name: 'UnitsSold', type: 'number', category: 'measure', format: 'integer', nullable: false, uniqueCount: 220 },
      { name: 'DiscountPct', type: 'number', category: 'measure', format: 'percent', nullable: false, uniqueCount: 100 },
    ],
    data: rows
  };
}

// Initial dashboard configuration matching the screenshot
export function getInitialProject(): import('../types/dashboard').DashboardProject {
  return {
    id: 'proj-sales-v3',
    name: 'Global Sales & Margin Intelligence v3',
    description: 'Executive cross-functional financial analytics and regional margin drilldown.',
    version: 'v3.2.0',
    savedAt: 'Just now',
    canvas: {
      width: 1440,
      height: 900,
      gridSnap: true,
      gridSize: 16
    },
    theme: 'precision-dark',
    crossFilteringEnabled: true,
    activeFilters: [],
    crossFilters: {},
    activePageIndex: 0,
    pages: [
      {
        id: 'p-overview',
        name: 'Overview',
        elements: [
          // KPI 1: Total Revenue
          {
            id: 'kpi-rev',
            title: 'TOTAL REVENUE (TTM)',
            type: 'kpi',
            datasetId: 'ds-sales-global',
            layout: { x: 16, y: 16, w: 270, h: 104 },
            config: {
              chartType: 'kpi',
              kpiTitle: 'Net Billed Revenue',
              kpiValuePrefix: '$',
              kpiDelta: 18.4,
              kpiDeltaLabel: 'vs prior period',
              measure: 'Revenue',
              aggregation: 'SUM',
              sparklineData: [42, 48, 51, 59, 64, 71, 84, 96]
            }
          },
          // KPI 2: Gross Profit
          {
            id: 'kpi-profit',
            title: 'GROSS PROFIT',
            type: 'kpi',
            datasetId: 'ds-sales-global',
            layout: { x: 302, y: 16, w: 270, h: 104 },
            config: {
              chartType: 'kpi',
              kpiTitle: 'Operating Margin Pool',
              kpiValuePrefix: '$',
              kpiDelta: 22.8,
              kpiDeltaLabel: 'vs prior year',
              measure: 'Profit',
              aggregation: 'SUM',
              sparklineData: [26, 29, 32, 38, 41, 48, 56, 68]
            }
          },
          // KPI 3: Blended Margin %
          {
            id: 'kpi-margin',
            title: 'BLENDED MARGIN',
            type: 'kpi',
            datasetId: 'ds-sales-global',
            layout: { x: 588, y: 16, w: 270, h: 104 },
            config: {
              chartType: 'kpi',
              kpiTitle: 'Contribution Rate',
              kpiValueSuffix: '%',
              kpiDelta: 3.2,
              kpiDeltaLabel: '+320 bps target',
              measure: 'MarginPct',
              aggregation: 'AVG',
              sparklineData: [62, 63, 63.5, 64.2, 65.1, 66.8, 67.4]
            }
          },
          // KPI 4: Total Volume Sold
          {
            id: 'kpi-volume',
            title: 'ACTIVE CONTRACTS',
            type: 'kpi',
            datasetId: 'ds-sales-global',
            layout: { x: 874, y: 16, w: 270, h: 104 },
            config: {
              chartType: 'kpi',
              kpiTitle: 'Enterprise Volume',
              kpiDelta: 14.1,
              kpiDeltaLabel: 'net new adds',
              measure: 'UnitsSold',
              aggregation: 'SUM',
              sparklineData: [110, 118, 125, 142, 160, 175, 192]
            }
          },

          // Chart 1: Revenue & Profit Trend by Quarter (Line/Area)
          {
            id: 'chart-trend',
            title: 'Quarterly Revenue & Margin Trajectory',
            type: 'chart',
            datasetId: 'ds-sales-global',
            layout: { x: 16, y: 136, w: 556, h: 320 },
            config: {
              chartType: 'area',
              dimension: 'Quarter',
              measure: 'Revenue',
              secondaryMeasure: 'Profit',
              aggregation: 'SUM',
              showLegend: true,
              smoothLine: true
            }
          },

          // Chart 2: Revenue & Margin by Region (Bar Chart with Cross-filtering)
          {
            id: 'chart-region',
            title: 'Regional Performance & Contribution',
            type: 'chart',
            datasetId: 'ds-sales-global',
            layout: { x: 588, y: 136, w: 556, h: 320 },
            config: {
              chartType: 'bar',
              dimension: 'Region',
              measure: 'Revenue',
              aggregation: 'SUM',
              showLegend: false
            }
          },

          // Chart 3: Revenue by Product Category (Donut / Composition)
          {
            id: 'chart-cat-donut',
            title: 'Product Line Distribution',
            type: 'chart',
            datasetId: 'ds-sales-global',
            layout: { x: 16, y: 472, w: 370, h: 300 },
            config: {
              chartType: 'donut',
              dimension: 'Category',
              measure: 'Revenue',
              aggregation: 'SUM',
              showLegend: true
            }
          },

          // Chart 4: Segment Margin vs Revenue (Scatter / Bubble)
          {
            id: 'chart-scatter',
            title: 'Segment Unit Economics (Margin % vs Revenue)',
            type: 'chart',
            datasetId: 'ds-sales-global',
            layout: { x: 402, y: 472, w: 370, h: 300 },
            config: {
              chartType: 'scatter',
              dimension: 'Segment',
              measure: 'Revenue',
              secondaryMeasure: 'MarginPct',
              aggregation: 'AVG'
            }
          },

          // Widget 5: Top Country & Segment Performance Table
          {
            id: 'table-breakdown',
            title: 'Global Performance Matrix (Cross-Filtered)',
            type: 'table',
            datasetId: 'ds-sales-global',
            layout: { x: 788, y: 472, w: 572, h: 300 },
            config: {
              chartType: 'table',
              visibleColumns: ['Country', 'Region', 'Category', 'Segment', 'Revenue', 'Profit', 'MarginPct'],
              sortBy: 'Revenue',
              sortOrder: 'desc',
              pageSize: 8
            }
          }
        ]
      },
      {
        id: 'p-sales-margin',
        name: 'Sales & Margin',
        elements: [
          {
            id: 'sm-chart-cat-bar',
            title: 'Revenue by Product Category ($M)',
            type: 'chart',
            datasetId: 'ds-sales-global',
            layout: { x: 16, y: 16, w: 556, h: 360 },
            config: {
              chartType: 'bar-horizontal',
              dimension: 'Category',
              measure: 'Revenue',
              aggregation: 'SUM'
            }
          },
          {
            id: 'sm-chart-segment-bar',
            title: 'Margin Rate by Customer Segment (%)',
            type: 'chart',
            datasetId: 'ds-sales-global',
            layout: { x: 588, y: 16, w: 556, h: 360 },
            config: {
              chartType: 'bar',
              dimension: 'Segment',
              measure: 'MarginPct',
              aggregation: 'AVG'
            }
          },
          {
            id: 'sm-table-detail',
            title: 'Detailed Product Financial Breakdown',
            type: 'table',
            datasetId: 'ds-sales-global',
            layout: { x: 16, y: 392, w: 1128, h: 380 },
            config: {
              chartType: 'table',
              visibleColumns: ['Quarter', 'Category', 'Region', 'Revenue', 'Cost', 'Profit', 'MarginPct', 'DiscountPct'],
              sortBy: 'Profit',
              sortOrder: 'desc',
              pageSize: 10
            }
          }
        ]
      },
      {
        id: 'p-geo',
        name: 'Geographic Drilldown',
        elements: [
          {
            id: 'geo-chart-bar',
            title: 'Revenue by Country (Global Top 14)',
            type: 'chart',
            datasetId: 'ds-sales-global',
            layout: { x: 16, y: 16, w: 700, h: 420 },
            config: {
              chartType: 'bar',
              dimension: 'Country',
              measure: 'Revenue',
              aggregation: 'SUM'
            }
          },
          {
            id: 'geo-pie-region',
            title: 'Regional Revenue Share',
            type: 'chart',
            datasetId: 'ds-sales-global',
            layout: { x: 732, y: 16, w: 412, h: 420 },
            config: {
              chartType: 'pie',
              dimension: 'Region',
              measure: 'Revenue',
              aggregation: 'SUM',
              showLegend: true
            }
          },
          {
            id: 'geo-table-countries',
            title: 'Country Performance & Discount Ratios',
            type: 'table',
            datasetId: 'ds-sales-global',
            layout: { x: 16, y: 452, w: 1128, h: 320 },
            config: {
              chartType: 'table',
              visibleColumns: ['Country', 'Region', 'Revenue', 'UnitsSold', 'DiscountPct', 'MarginPct'],
              sortBy: 'Revenue',
              sortOrder: 'desc',
              pageSize: 8
            }
          }
        ]
      }
    ]
  };
}
