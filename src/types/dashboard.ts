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

export interface ColumnSchema {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  category: 'dimension' | 'measure' | 'time';
  format?: 'currency' | 'percent' | 'integer' | 'decimal' | 'date';
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
}

export interface DashboardElement {
  id: string;
  title: string;
  type: 'chart' | 'kpi' | 'table' | 'text' | 'shape';
  datasetId: string;
  layout: WidgetLayout;
  config: ChartConfig;
  customText?: string;
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
