export type ChartType = 
  | 'bar'
  | 'bar-horizontal'
  | 'bar-stacked'
  | 'line'
  | 'area'
  | 'donut'
  | 'pie'
  | 'scatter'
  | 'heatmap'
  | 'gauge'
  | 'kpi'
  | 'table'
  | 'map';

export type AggregationType = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';

export type DataType = 'string' | 'number' | 'date' | 'boolean';

export interface ColumnSchema {
  name: string;
  type: DataType;
  category: 'dimension' | 'measure' | 'time';
  format?: 'currency' | 'percent' | 'integer' | 'decimal' | 'date' | string;
  dateFormat?: string;
  numberFormat?: string;
  currencySymbol?: string;
  decimalPlaces?: number;
  thousandSeparator?: string;
  sourceDataType?: 'excel_serial' | 'unix_ms' | 'unix_sec' | 'yyyymmdd' | 'iso_string' | 'auto';
  nullable: boolean;
  uniqueCount: number;
}

export interface Dataset {
  id: string;
  name: string;
  sourceType: 'duckdb' | 'csv' | 'xlsx' | 'postgresql' | 'sqlite' | 'rest_api';
  rowCount: number;
  columns: ColumnSchema[];
  data: Record<string, any>[];
  lastRefreshed: string;
}

export interface FilterRule {
  id: string;
  column: string;
  operator: 'equals' | 'in' | 'greaterThan' | 'lessThan' | 'between' | 'contains';
  value: any;
  active: boolean;
}

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type SortType = 'auto' | 'chronological' | 'numeric' | 'alphanumeric';

export interface SortClause {
  id: string;
  column: string;
  order: 'asc' | 'desc';
  type?: SortType;
}

export interface SequentialQueryConfig {
  enabled: boolean;
  clauses: SortClause[];
  generatedSql?: string;
  appliedAt?: string;
}

export type TrendlineModelType = 'linear' | 'exponential' | 'polynomial';

export interface TrendlineOptions {
  model?: TrendlineModelType;
  polynomialDegree?: number; // 2 or 3 (default 2)
  forecastPeriods?: number; // 0..10 periods forward
  showConfidenceInterval?: boolean; // 95% confidence bounds
}

export interface TrendlineResult {
  model: TrendlineModelType;
  equation: string;
  rSquared: number;
  rmse: number;
  // Predictions matching original data categories / coordinates
  predictedValues: (number | null)[];
  // Extended categories (including forecast periods if time-series)
  extendedCategories: string[];
  // Trendline data points across extended categories: [number | null] for category charts, or [x, y][] for scatter
  trendlineData: (number | null)[];
  scatterTrendlineData?: [number, number][];
  // Forecast specific slice
  forecastStartIndex: number;
  forecastData?: (number | null)[];
  // 95% Confidence bounds (upper and lower bounds)
  upperConfidence?: (number | null)[];
  lowerConfidence?: (number | null)[];
  confidenceDifference?: (number | null)[]; // upper - lower for stacked band fill
  scatterUpperConfidence?: [number, number][];
  scatterLowerConfidence?: [number, number][];
}

export interface ChartConfig {
  chartType: ChartType;
  dimension?: string;
  secondaryDimension?: string;
  measure?: string;
  secondaryMeasure?: string;
  aggregation?: AggregationType;
  colorPalette?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  smoothLine?: boolean;
  // Predictive Trendline specific
  showTrendline?: boolean;
  trendlineModel?: TrendlineModelType;
  polynomialDegree?: number; // 2 or 3
  forecastPeriods?: number; // 0..10
  showConfidenceInterval?: boolean;
  showTrendlineEquation?: boolean;
  // KPI specific
  kpiTitle?: string;
  kpiValuePrefix?: string;
  kpiValueSuffix?: string;
  kpiDelta?: number;
  kpiDeltaLabel?: string;
  kpiTarget?: number;
  sparklineData?: number[];
  // Table specific
  visibleColumns?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  sequentialSort?: SortClause[];
  sequentialSortMode?: 'disabled' | 'custom' | 'perfect-order';
  pageSize?: number;
  // Map specific
  mapMode?: 'choropleth' | 'bubble';
  mapScope?: 'world' | 'regions';
  // HTML Embed specific
  htmlCode?: string;
  htmlSandbox?: boolean;
  htmlAutoScroll?: boolean;
}

export interface DashboardElement {
  id: string;
  title: string;
  type: 'chart' | 'kpi' | 'table' | 'text' | 'shape' | 'html';
  datasetId: string;
  layout: WidgetLayout;
  config: ChartConfig;
  customText?: string;
  customHtml?: string;
}

export interface DashboardPage {
  id: string;
  name: string;
  elements: DashboardElement[];
}

export interface DashboardProject {
  id: string;
  name: string;
  description: string;
  version: string;
  savedAt: string;
  canvas: {
    width: number;
    height: number;
    gridSnap: boolean;
    gridSize: number;
  };
  pages: DashboardPage[];
  activePageIndex: number;
  theme: 'precision-dark' | 'light';
  crossFilteringEnabled: boolean;
  activeFilters: FilterRule[];
  crossFilters: Record<string, string[]>; // { [columnName]: [selectedValues] }
}
