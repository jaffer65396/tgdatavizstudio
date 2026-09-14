import { Dataset, FilterRule, AggregationType, ColumnSchema, DashboardElement } from '../types/dashboard';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface QueryOptions {
  dimension?: string;
  secondaryDimension?: string;
  measure?: string;
  secondaryMeasure?: string;
  aggregation?: AggregationType;
  filters?: FilterRule[];
  crossFilters?: Record<string, string[]>;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AggregatedResult {
  categories: string[];
  series: {
    name: string;
    data: (number | null)[];
    type?: string;
  }[];
  rawRows: Record<string, any>[];
  totalValue?: number;
}

export class DataEngine {
  // Apply all active filters and cross-filters to dataset rows
  public static filterRows(
    rows: Record<string, any>[],
    filters: FilterRule[] = [],
    crossFilters: Record<string, string[]> = {}
  ): Record<string, any>[] {
    return rows.filter((row) => {
      // 1. Check explicit filters
      for (const filter of filters) {
        if (!filter.active) continue;
        const val = row[filter.column];
        if (filter.operator === 'equals' && String(val) !== String(filter.value)) {
          return false;
        }
        if (filter.operator === 'in' && Array.isArray(filter.value)) {
          if (!filter.value.includes(val)) return false;
        }
        if (filter.operator === 'greaterThan' && Number(val) <= Number(filter.value)) {
          return false;
        }
        if (filter.operator === 'lessThan' && Number(val) >= Number(filter.value)) {
          return false;
        }
        if (filter.operator === 'contains' && !String(val).toLowerCase().includes(String(filter.value).toLowerCase())) {
          return false;
        }
      }

      // 2. Check cross-filters from interactive chart clicks
      for (const [col, selectedVals] of Object.entries(crossFilters)) {
        if (selectedVals && selectedVals.length > 0) {
          const rowVal = String(row[col]);
          if (!selectedVals.includes(rowVal)) {
            return false;
          }
        }
      }

      return true;
    });
  }

  // Execute aggregated analytical query
  public static query(dataset: Dataset, options: QueryOptions): AggregatedResult {
    const {
      dimension,
      measure,
      secondaryMeasure,
      aggregation = 'SUM',
      filters = [],
      crossFilters = {},
      limit,
      sortBy,
      sortOrder = 'desc'
    } = options;

    const filteredRows = this.filterRows(dataset.data, filters, crossFilters);

    if (!dimension || !measure) {
      return {
        categories: [],
        series: [],
        rawRows: filteredRows,
        totalValue: 0
      };
    }

    // Group by primary dimension
    const groups = new Map<string, { total: number; count: number; min: number; max: number; secTotal: number; secCount: number }>();

    for (const row of filteredRows) {
      const dimKey = String(row[dimension] ?? 'N/A');
      const measureVal = Number(row[measure]) || 0;
      const secVal = secondaryMeasure ? (Number(row[secondaryMeasure]) || 0) : 0;

      if (!groups.has(dimKey)) {
        groups.set(dimKey, {
          total: measureVal,
          count: 1,
          min: measureVal,
          max: measureVal,
          secTotal: secVal,
          secCount: 1
        });
      } else {
        const item = groups.get(dimKey)!;
        item.total += measureVal;
        item.count += 1;
        item.min = Math.min(item.min, measureVal);
        item.max = Math.max(item.max, measureVal);
        item.secTotal += secVal;
        item.secCount += 1;
      }
    }

    let entries = Array.from(groups.entries()).map(([key, stats]) => {
      let val = stats.total;
      if (aggregation === 'AVG') val = stats.count > 0 ? stats.total / stats.count : 0;
      else if (aggregation === 'COUNT') val = stats.count;
      else if (aggregation === 'MIN') val = stats.min;
      else if (aggregation === 'MAX') val = stats.max;

      let secVal = stats.secTotal;
      if (secondaryMeasure) {
        if (aggregation === 'AVG') secVal = stats.secCount > 0 ? stats.secTotal / stats.secCount : 0;
        else if (aggregation === 'COUNT') secVal = stats.secCount;
      }

      return {
        category: key,
        value: Number(val.toFixed(2)),
        secValue: Number(secVal.toFixed(2))
      };
    });

    // Sorting
    if (sortBy === 'value' || !sortBy) {
      entries.sort((a, b) => sortOrder === 'desc' ? b.value - a.value : a.value - b.value);
    } else if (sortBy === 'category') {
      entries.sort((a, b) => sortOrder === 'desc' ? b.category.localeCompare(a.category) : a.category.localeCompare(b.category));
    }

    if (limit && limit > 0) {
      entries = entries.slice(0, limit);
    }

    const categories = entries.map((e) => e.category);
    const mainSeriesData = entries.map((e) => e.value);
    const totalVal = mainSeriesData.reduce((acc, curr) => acc + curr, 0);

    const series = [
      {
        name: measure,
        data: mainSeriesData
      }
    ];

    if (secondaryMeasure) {
      series.push({
        name: secondaryMeasure,
        data: entries.map((e) => e.secValue)
      });
    }

    return {
      categories,
      series,
      rawRows: filteredRows,
      totalValue: totalVal
    };
  }

  // Calculate single KPI summary across filtered dataset
  public static calculateKpi(dataset: Dataset, measure?: string, aggregation: AggregationType = 'SUM', filters: FilterRule[] = [], crossFilters: Record<string, string[]> = {}): number {
    if (!measure) return 0;
    const rows = this.filterRows(dataset.data, filters, crossFilters);
    if (rows.length === 0) return 0;

    let sum = 0;
    let min = Infinity;
    let max = -Infinity;

    for (const r of rows) {
      const val = Number(r[measure]) || 0;
      sum += val;
      if (val < min) min = val;
      if (val > max) max = val;
    }

    if (aggregation === 'AVG') return Number((sum / rows.length).toFixed(1));
    if (aggregation === 'COUNT') return rows.length;
    if (aggregation === 'MIN') return min === Infinity ? 0 : min;
    if (aggregation === 'MAX') return max === -Infinity ? 0 : max;
    return Math.round(sum);
  }

  // Number formatting helper
  public static formatNumber(num: number, format?: string, prefix: string = '', suffix: string = ''): string {
    if (isNaN(num) || num === null || num === undefined) return '0';

    let formatted = '';
    if (format === 'currency' || prefix === '$') {
      if (Math.abs(num) >= 1_000_000_000) {
        formatted = `$${(num / 1_000_000_000).toFixed(1)}B`;
      } else if (Math.abs(num) >= 1_000_000) {
        formatted = `$${(num / 1_000_000).toFixed(1)}M`;
      } else if (Math.abs(num) >= 1_000) {
        formatted = `$${(num / 1_000).toFixed(1)}K`;
      } else {
        formatted = `$${num.toLocaleString()}`;
      }
      return suffix ? `${formatted}${suffix}` : formatted;
    }

    if (format === 'percent' || suffix === '%') {
      return `${num.toFixed(1)}%`;
    }

    if (Math.abs(num) >= 1_000_000) {
      formatted = `${(num / 1_000_000).toFixed(1)}M`;
    } else if (Math.abs(num) >= 1_000) {
      formatted = `${(num / 1_000).toFixed(1)}K`;
    } else {
      formatted = num.toLocaleString();
    }

    return `${prefix}${formatted}${suffix}`;
  }

  // Parse uploaded CSV/XLSX/JSON into a Dataset structure
  public static async parseFile(file: File): Promise<Dataset> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv' || extension === 'tsv' || extension === 'txt') {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data as Record<string, any>[];
            const dataset = DataEngine.inferDatasetFromRows(file.name.replace(/\.[^/.]+$/, ""), data, 'csv');
            resolve(dataset);
          },
          error: (err) => reject(err)
        });
      });
    }

    if (extension === 'xlsx' || extension === 'xls') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];
      return DataEngine.inferDatasetFromRows(file.name.replace(/\.[^/.]+$/, ""), json, 'xlsx');
    }

    if (extension === 'json') {
      const text = await file.text();
      const json = JSON.parse(text);
      const rows = Array.isArray(json) ? json : [json];
      return DataEngine.inferDatasetFromRows(file.name.replace(/\.[^/.]+$/, ""), rows, 'rest_api');
    }

    throw new Error(`Unsupported file format: .${extension}`);
  }

  // Parse raw text (CSV, TSV, tab-delimited from Google Sheets/Excel, or JSON)
  public static parseText(text: string, name: string = 'Imported Data'): Dataset {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Please enter or paste tabular data or JSON.');
    }

    // Attempt JSON parsing if it appears to be JSON
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        const rows = Array.isArray(parsed) ? parsed : [parsed];
        return DataEngine.inferDatasetFromRows(name, rows, 'rest_api');
      } catch {
        // Fallback to tabular parser
      }
    }

    // PapaParse handles CSV, TSV, tab-delimited, semicolon-delimited automatically
    const parsed = Papa.parse(trimmed, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    if (parsed.errors && parsed.errors.length > 0 && (!parsed.data || parsed.data.length === 0)) {
      throw new Error(`Parse error: ${parsed.errors[0]?.message || 'Invalid format'}`);
    }

    const rows = (parsed.data as Record<string, any>[]).filter((r) => r && Object.keys(r).length > 0);
    if (!rows || rows.length === 0) {
      throw new Error('No valid tabular records found in pasted content.');
    }

    return DataEngine.inferDatasetFromRows(name, rows, 'csv');
  }

  // Fetch and parse remote dataset from a public URL (CSV or JSON)
  public static async parseUrl(url: string, name?: string): Promise<Dataset> {
    const trimmed = url.trim();
    if (!trimmed) {
      throw new Error('Please provide a valid URL.');
    }

    const defaultName = name || trimmed.split('/').pop()?.split('?')[0]?.replace(/\.[^/.]+$/, "") || 'Remote API Dataset';
    const response = await fetch(trimmed);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} while fetching ${trimmed}`);
    }

    const text = await response.text();
    return DataEngine.parseText(text, defaultName);
  }

  // Automatically generate a set of responsive dashboard widgets for any imported dataset
  public static generateWidgetsForDataset(dataset: Dataset): DashboardElement[] {
    const elements: DashboardElement[] = [];
    const measures = dataset.columns.filter((c) => c.category === 'measure');
    const dimensions = dataset.columns.filter((c) => c.category === 'dimension');
    const timeCols = dataset.columns.filter((c) => c.category === 'time');

    // 1. Top row KPI cards (up to 4)
    const kpiMeasures = measures.slice(0, 4);
    if (kpiMeasures.length === 0) {
      elements.push({
        id: `kpi-count-${Date.now()}`,
        title: 'TOTAL RECORDS',
        type: 'kpi',
        datasetId: dataset.id,
        layout: { x: 16, y: 16, w: 270, h: 104 },
        config: {
          chartType: 'kpi',
          kpiTitle: 'Ingested Records',
          kpiDelta: 0,
          kpiDeltaLabel: 'live imported',
          measure: dataset.columns[0]?.name,
          aggregation: 'COUNT',
          sparklineData: [20, 35, 45, 60, 80, 100]
        }
      });
    } else {
      kpiMeasures.forEach((m, idx) => {
        const prefix = m.format === 'currency' ? '$' : '';
        const suffix = m.format === 'percent' ? '%' : '';
        const agg: AggregationType = m.format === 'percent' ? 'AVG' : 'SUM';

        elements.push({
          id: `kpi-${m.name.toLowerCase()}-${Date.now()}-${idx}`,
          title: m.name.replace(/([A-Z])/g, ' $1').toUpperCase().trim(),
          type: 'kpi',
          datasetId: dataset.id,
          layout: { x: 16 + idx * 286, y: 16, w: 270, h: 104 },
          config: {
            chartType: 'kpi',
            kpiTitle: `${agg === 'AVG' ? 'Avg' : 'Total'} ${m.name}`,
            kpiValuePrefix: prefix,
            kpiValueSuffix: suffix,
            kpiDelta: Number((Math.random() * 15 + 2).toFixed(1)),
            kpiDeltaLabel: 'vs baseline',
            measure: m.name,
            aggregation: agg,
            sparklineData: [30, 42, 38, 55, 64, 72, 85]
          }
        });
      });
    }

    // 2. Primary Charts (Row 2, y = 136)
    const primaryMeasure = measures[0]?.name || dataset.columns[0]?.name;
    const secondaryMeasure = measures[1]?.name;
    const timeCol = timeCols[0]?.name;
    const primaryDim = dimensions[0]?.name || dataset.columns[0]?.name;
    const secondaryDim = dimensions[1]?.name || dimensions[0]?.name;

    // Trend / Timeline Chart
    if (timeCol) {
      elements.push({
        id: `chart-trend-${Date.now()}`,
        title: `${primaryMeasure} Over Time (${timeCol})`,
        type: 'chart',
        datasetId: dataset.id,
        layout: { x: 16, y: 136, w: 556, h: 320 },
        config: {
          chartType: 'area',
          dimension: timeCol,
          measure: primaryMeasure,
          secondaryMeasure: secondaryMeasure,
          aggregation: 'SUM',
          showLegend: Boolean(secondaryMeasure),
          smoothLine: true
        }
      });
    } else {
      elements.push({
        id: `chart-bar-prim-${Date.now()}`,
        title: `${primaryMeasure} by ${primaryDim}`,
        type: 'chart',
        datasetId: dataset.id,
        layout: { x: 16, y: 136, w: 556, h: 320 },
        config: {
          chartType: 'bar',
          dimension: primaryDim,
          measure: primaryMeasure,
          aggregation: 'SUM',
          showLegend: false
        }
      });
    }

    // Categorical Comparison Chart (Right of Row 2)
    elements.push({
      id: `chart-cat-${Date.now()}`,
      title: `${primaryMeasure} Breakdown by ${primaryDim}`,
      type: 'chart',
      datasetId: dataset.id,
      layout: { x: 588, y: 136, w: 556, h: 320 },
      config: {
        chartType: 'bar',
        dimension: primaryDim,
        measure: primaryMeasure,
        aggregation: 'SUM',
        showLegend: false
      }
    });

    // 3. Row 3: Donut breakdown + Data Table (y = 472)
    if (secondaryDim) {
      elements.push({
        id: `chart-donut-${Date.now()}`,
        title: `Share by ${secondaryDim}`,
        type: 'chart',
        datasetId: dataset.id,
        layout: { x: 16, y: 472, w: 368, h: 340 },
        config: {
          chartType: 'donut',
          dimension: secondaryDim,
          measure: primaryMeasure,
          aggregation: 'SUM',
          showLegend: true
        }
      });
    }

    const tableX = secondaryDim ? 400 : 16;
    const tableW = secondaryDim ? 744 : 1128;

    elements.push({
      id: `table-raw-${Date.now()}`,
      title: `${dataset.name} - Ingested Records`,
      type: 'table',
      datasetId: dataset.id,
      layout: { x: tableX, y: 472, w: tableW, h: 340 },
      config: {
        chartType: 'table',
        visibleColumns: dataset.columns.map((c) => c.name).slice(0, 7),
        pageSize: 10
      }
    });

    return elements;
  }

  // Automatic schema and column type detection
  public static inferDatasetFromRows(name: string, data: Record<string, any>[], sourceType: Dataset['sourceType']): Dataset {
    if (!data || data.length === 0) {
      return {
        id: `ds-${Date.now()}`,
        name,
        sourceType,
        rowCount: 0,
        columns: [],
        data: [],
        lastRefreshed: 'Just now'
      };
    }

    const firstRow = data[0];
    const columns: ColumnSchema[] = [];

    for (const key of Object.keys(firstRow)) {
      const nonNullSample = data.find((r) => r[key] !== null && r[key] !== undefined)?.[key];
      const jsType = typeof nonNullSample;
      const uniqueVals = new Set(data.map((r) => r[key])).size;

      let type: ColumnSchema['type'] = 'string';
      let category: ColumnSchema['category'] = 'dimension';
      let format: ColumnSchema['format'] = undefined;

      if (jsType === 'number') {
        type = 'number';
        category = 'measure';
        const keyLower = key.toLowerCase();
        if (keyLower.includes('revenue') || keyLower.includes('cost') || keyLower.includes('profit') || keyLower.includes('price')) {
          format = 'currency';
        } else if (keyLower.includes('pct') || keyLower.includes('percent') || keyLower.includes('rate') || keyLower.includes('margin')) {
          format = 'percent';
        } else {
          format = 'integer';
        }
      } else if (nonNullSample instanceof Date || (typeof nonNullSample === 'string' && !isNaN(Date.parse(nonNullSample)) && nonNullSample.length > 5 && (nonNullSample.includes('-') || nonNullSample.includes('/')))) {
        type = 'date';
        category = 'time';
        format = 'date';
      }

      columns.push({
        name: key,
        type,
        category,
        format,
        nullable: data.some((r) => r[key] === null || r[key] === undefined),
        uniqueCount: uniqueVals
      });
    }

    return {
      id: `ds-${Date.now()}`,
      name,
      sourceType,
      rowCount: data.length,
      columns,
      data,
      lastRefreshed: 'Just now'
    };
  }
}
