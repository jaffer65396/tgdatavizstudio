import {
  Dataset,
  FilterRule,
  AggregationType,
  ColumnSchema,
  DashboardElement,
  SortClause,
  SortType,
  DataType,
  TrendlineModelType,
  TrendlineOptions,
  TrendlineResult
} from '../types/dashboard';
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
  sequentialSort?: SortClause[];
  // Trendline & Predictive Options
  showTrendline?: boolean;
  trendlineModel?: TrendlineModelType;
  polynomialDegree?: number;
  forecastPeriods?: number;
  showConfidenceInterval?: boolean;
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
  trendline?: TrendlineResult;
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
    if (options.sequentialSort && options.sequentialSort.length > 0) {
      // Apply multi-stage sequential query sorting to entries
      entries.sort((a, b) => {
        for (const clause of options.sequentialSort!) {
          let cmp = 0;
          if (clause.column === dimension || clause.column === 'category') {
            cmp = DataEngine.compareValues(a.category, b.category, clause.order, clause.type);
          } else if (clause.column === measure || clause.column === 'value') {
            cmp = DataEngine.compareValues(a.value, b.value, clause.order, clause.type || 'numeric');
          } else if (secondaryMeasure && (clause.column === secondaryMeasure || clause.column === 'secValue')) {
            cmp = DataEngine.compareValues(a.secValue, b.secValue, clause.order, clause.type || 'numeric');
          }
          if (cmp !== 0) return cmp;
        }
        return 0;
      });
    } else if (sortBy === 'value' || !sortBy) {
      entries.sort((a, b) => sortOrder === 'desc' ? b.value - a.value : a.value - b.value);
    } else if (sortBy === 'category') {
      entries.sort((a, b) => {
        return DataEngine.compareValues(a.category, b.category, sortOrder, 'auto');
      });
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

    // Automatic Predictive Trendline Generation
    let trendlineResult: TrendlineResult | undefined = undefined;
    if (options.showTrendline && entries.length >= 2) {
      if (secondaryMeasure) {
        // Scatter plot trendline where X = main measure, Y = secondary measure
        const scatterPoints = entries
          .map((e) => ({
            x: Number(e.value) || 0,
            y: Number(e.secValue) || 0,
            label: e.category
          }))
          .filter((pt) => !isNaN(pt.x) && !isNaN(pt.y) && isFinite(pt.x) && isFinite(pt.y));

        if (scatterPoints.length >= 2) {
          trendlineResult = this.generateScatterTrendline(scatterPoints, {
            model: options.trendlineModel || 'linear',
            polynomialDegree: options.polynomialDegree || 2,
            forecastPeriods: options.forecastPeriods || 0,
            showConfidenceInterval: options.showConfidenceInterval
          });
        }
      } else {
        // Time-series or category trendline
        trendlineResult = this.generateTimeSeriesTrendline(categories, mainSeriesData, {
          model: options.trendlineModel || 'linear',
          polynomialDegree: options.polynomialDegree || 2,
          forecastPeriods: options.forecastPeriods || 0,
          showConfidenceInterval: options.showConfidenceInterval
        });
      }
    }

    return {
      categories,
      series,
      rawRows: filteredRows,
      totalValue: totalVal,
      trendline: trendlineResult
    };
  }

  // ==========================================
  // REGRESSION & PREDICTIVE TRENDLINE ENGINES
  // ==========================================

  // Format numerical coefficient for human-readable regression equations
  public static formatCoeff(val: number): string {
    if (isNaN(val) || !isFinite(val)) return '0';
    const abs = Math.abs(val);
    if (abs >= 1_000_000 || (abs < 0.001 && abs !== 0)) {
      return val.toExponential(2);
    }
    if (abs >= 100) {
      return val.toLocaleString(undefined, { maximumFractionDigits: 1 });
    }
    if (abs >= 1) {
      return Number(val.toFixed(2)).toString();
    }
    return Number(val.toFixed(3)).toString();
  }

  // Gauss-Jordan elimination solver for normal equations in polynomial regression
  private static solveLinearSystem(A: number[][], B: number[]): number[] | null {
    const n = B.length;
    const M: number[][] = A.map((row, i) => [...row, B[i]]);

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
          maxRow = k;
        }
      }

      if (maxRow !== i) {
        const tmp = M[i];
        M[i] = M[maxRow];
        M[maxRow] = tmp;
      }

      const pivot = M[i][i];
      if (Math.abs(pivot) < 1e-12) {
        return null; // Singular or ill-conditioned
      }

      for (let j = i; j <= n; j++) {
        M[i][j] /= pivot;
      }

      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = M[k][i];
          for (let j = i; j <= n; j++) {
            M[k][j] -= factor * M[i][j];
          }
        }
      }
    }

    return M.map((row) => row[n]);
  }

  // Linear Regression: y = mx + b
  public static fitLinearRegression(points: { x: number; y: number }[]): {
    slope: number;
    intercept: number;
    predict: (x: number) => number;
    equation: string;
    rSquared: number;
    rmse: number;
  } {
    const N = points.length;
    if (N < 2) {
      const avgY = N === 1 ? points[0].y : 0;
      return {
        slope: 0,
        intercept: avgY,
        predict: () => avgY,
        equation: `y = ${this.formatCoeff(avgY)}`,
        rSquared: 0,
        rmse: 0
      };
    }

    const xMean = points.reduce((acc, p) => acc + p.x, 0) / N;
    const yMean = points.reduce((acc, p) => acc + p.y, 0) / N;

    let sxx = 0;
    let sxy = 0;
    let syy = 0;

    for (const p of points) {
      const dx = p.x - xMean;
      const dy = p.y - yMean;
      sxx += dx * dx;
      sxy += dx * dy;
      syy += dy * dy;
    }

    const slope = sxx > 1e-12 ? sxy / sxx : 0;
    const intercept = yMean - slope * xMean;
    const predict = (x: number) => slope * x + intercept;

    let ssRes = 0;
    for (const p of points) {
      const pred = predict(p.x);
      ssRes += Math.pow(p.y - pred, 2);
    }

    const rSquared = syy < 1e-12 ? 1.0 : Math.max(0, Math.min(1, 1 - ssRes / syy));
    const rmse = Math.sqrt(ssRes / N);

    const sign = intercept >= 0 ? '+' : '-';
    const equation = `y = ${this.formatCoeff(slope)}x ${sign} ${this.formatCoeff(Math.abs(intercept))}`;

    return { slope, intercept, predict, equation, rSquared, rmse };
  }

  // Exponential Regression: y = a * e^(bx)
  public static fitExponentialRegression(points: { x: number; y: number }[]): {
    a: number;
    b: number;
    offset: number;
    predict: (x: number) => number;
    equation: string;
    rSquared: number;
    rmse: number;
  } {
    const N = points.length;
    if (N < 2) {
      const avgY = N === 1 ? points[0].y : 0;
      return {
        a: avgY,
        b: 0,
        offset: 0,
        predict: () => avgY,
        equation: `y = ${this.formatCoeff(avgY)}`,
        rSquared: 0,
        rmse: 0
      };
    }

    // If y values contain non-positive numbers, apply a positive translation offset
    const minY = Math.min(...points.map((p) => p.y));
    const offset = minY <= 0 ? Math.abs(minY) + 1 : 0;

    const logPoints = points.map((p) => ({
      x: p.x,
      y: Math.log(p.y + offset)
    }));

    const linearFit = this.fitLinearRegression(logPoints);
    const b = linearFit.slope;
    const a = Math.exp(linearFit.intercept);

    const predict = (x: number) => {
      const val = a * Math.exp(b * x) - offset;
      return isFinite(val) ? val : points[points.length - 1].y;
    };

    let ssRes = 0;
    let ssTot = 0;
    const yMean = points.reduce((acc, p) => acc + p.y, 0) / N;

    for (const p of points) {
      const pred = predict(p.x);
      ssRes += Math.pow(p.y - pred, 2);
      ssTot += Math.pow(p.y - yMean, 2);
    }

    const rSquared = ssTot < 1e-12 ? 1.0 : Math.max(0, Math.min(1, 1 - ssRes / ssTot));
    const rmse = Math.sqrt(ssRes / N);

    let equation = `y = ${this.formatCoeff(a)} · e^(${this.formatCoeff(b)}x)`;
    if (offset > 0) {
      equation += ` - ${this.formatCoeff(offset)}`;
    }

    return { a, b, offset, predict, equation, rSquared, rmse };
  }

  // Polynomial Regression: y = c2*x^2 + c1*x + c0 (or degree 3)
  public static fitPolynomialRegression(points: { x: number; y: number }[], degree: number = 2): {
    coefficients: number[];
    predict: (x: number) => number;
    equation: string;
    rSquared: number;
    rmse: number;
  } {
    const N = points.length;
    const deg = Math.min(Math.max(2, degree), Math.max(1, N - 1));

    if (N < 2 || deg < 2) {
      const lin = this.fitLinearRegression(points);
      return {
        coefficients: [lin.intercept, lin.slope],
        predict: lin.predict,
        equation: lin.equation,
        rSquared: lin.rSquared,
        rmse: lin.rmse
      };
    }

    // Standardize x coordinates: u = (x - meanX) / sX for numerical conditioning
    const xMean = points.reduce((acc, p) => acc + p.x, 0) / N;
    let sxx = points.reduce((acc, p) => acc + Math.pow(p.x - xMean, 2), 0);
    const sX = Math.sqrt(sxx / N) || 1;

    const uPoints = points.map((p) => ({
      u: (p.x - xMean) / sX,
      y: p.y
    }));

    // Build normal equations: (deg + 1) x (deg + 1)
    const dim = deg + 1;
    const A: number[][] = Array.from({ length: dim }, () => Array(dim).fill(0));
    const B: number[] = Array(dim).fill(0);

    for (let r = 0; r < dim; r++) {
      for (let c = 0; c < dim; c++) {
        let sumPow = 0;
        const power = r + c;
        for (const p of uPoints) {
          sumPow += Math.pow(p.u, power);
        }
        A[r][c] = sumPow;
      }

      let sumY = 0;
      for (const p of uPoints) {
        sumY += Math.pow(p.u, r) * p.y;
      }
      B[r] = sumY;
    }

    const uCoeffs = this.solveLinearSystem(A, B);
    if (!uCoeffs) {
      // Fallback to linear if matrix is singular
      const lin = this.fitLinearRegression(points);
      return {
        coefficients: [lin.intercept, lin.slope],
        predict: lin.predict,
        equation: lin.equation,
        rSquared: lin.rSquared,
        rmse: lin.rmse
      };
    }

    const predict = (x: number) => {
      const u = (x - xMean) / sX;
      let res = 0;
      for (let i = 0; i < uCoeffs.length; i++) {
        res += uCoeffs[i] * Math.pow(u, i);
      }
      return isFinite(res) ? res : points[points.length - 1].y;
    };

    let ssRes = 0;
    let ssTot = 0;
    const yMean = points.reduce((acc, p) => acc + p.y, 0) / N;

    for (const p of points) {
      const pred = predict(p.x);
      ssRes += Math.pow(p.y - pred, 2);
      ssTot += Math.pow(p.y - yMean, 2);
    }

    const rSquared = ssTot < 1e-12 ? 1.0 : Math.max(0, Math.min(1, 1 - ssRes / ssTot));
    const rmse = Math.sqrt(ssRes / N);

    // Convert standardized coefficients to natural coordinates for human-readable equation
    const alpha = 1 / sX;
    const beta = -xMean / sX;

    let equation = '';
    if (deg === 2) {
      const [c0, c1, c2] = uCoeffs;
      const a2 = c2 * Math.pow(alpha, 2);
      const a1 = c1 * alpha + 2 * c2 * alpha * beta;
      const a0 = c0 + c1 * beta + c2 * Math.pow(beta, 2);
      const s1 = a1 >= 0 ? '+' : '-';
      const s0 = a0 >= 0 ? '+' : '-';
      equation = `y = ${this.formatCoeff(a2)}x² ${s1} ${this.formatCoeff(Math.abs(a1))}x ${s0} ${this.formatCoeff(Math.abs(a0))}`;
    } else {
      const [c0, c1, c2, c3] = uCoeffs;
      const a3 = c3 * Math.pow(alpha, 3);
      const a2 = c2 * Math.pow(alpha, 2) + 3 * c3 * Math.pow(alpha, 2) * beta;
      const a1 = c1 * alpha + 2 * c2 * alpha * beta + 3 * c3 * alpha * Math.pow(beta, 2);
      const a0 = c0 + c1 * beta + c2 * Math.pow(beta, 2) + c3 * Math.pow(beta, 3);
      equation = `y = ${this.formatCoeff(a3)}x³ + ${this.formatCoeff(a2)}x² + ${this.formatCoeff(a1)}x + ${this.formatCoeff(a0)}`;
    }

    return { coefficients: uCoeffs, predict, equation, rSquared, rmse };
  }

  // Extrapolate chronological and sequential category labels for predictive forecasting
  public static extrapolateCategoryLabels(categories: string[], periods: number): string[] {
    if (periods <= 0 || categories.length === 0) return [...categories];
    const extended = [...categories];
    const last = categories[categories.length - 1];

    // Pattern 1: YYYY-Q# (e.g. 2026-Q2 or 2026 Q2)
    const quarterMatch = last.match(/^(\d{4})[-/ ]?Q([1-4])$/i);
    if (quarterMatch) {
      let year = parseInt(quarterMatch[1], 10);
      let q = parseInt(quarterMatch[2], 10);
      for (let p = 1; p <= periods; p++) {
        q++;
        if (q > 4) {
          q = 1;
          year++;
        }
        extended.push(`${year}-Q${q} (Fcst)`);
      }
      return extended;
    }

    // Pattern 2: YYYY-MM or YYYY/MM (e.g. 2026-04)
    const monthMatch = last.match(/^(\d{4})[-/](\d{1,2})$/);
    if (monthMatch) {
      let year = parseInt(monthMatch[1], 10);
      let m = parseInt(monthMatch[2], 10);
      for (let p = 1; p <= periods; p++) {
        m++;
        if (m > 12) {
          m = 1;
          year++;
        }
        const mStr = m < 10 ? `0${m}` : `${m}`;
        extended.push(`${year}-${mStr} (Fcst)`);
      }
      return extended;
    }

    // Pattern 3: ISO Date (YYYY-MM-DD)
    const dateMatch = last.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch && categories.length >= 2) {
      const prev = categories[categories.length - 2];
      const tLast = new Date(last).getTime();
      const tPrev = new Date(prev).getTime();
      const diffMs = !isNaN(tLast) && !isNaN(tPrev) && tLast > tPrev ? tLast - tPrev : 86400000;
      for (let p = 1; p <= periods; p++) {
        const nextDate = new Date(tLast + diffMs * p);
        const yyyy = nextDate.getFullYear();
        const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
        const dd = String(nextDate.getDate()).padStart(2, '0');
        extended.push(`${yyyy}-${mm}-${dd} (Fcst)`);
      }
      return extended;
    }

    // Pattern 4: Pure 4-digit Year (e.g. 2025, 2026)
    const yearOnlyMatch = last.match(/^(\d{4})$/);
    if (yearOnlyMatch) {
      let yr = parseInt(yearOnlyMatch[1], 10);
      for (let p = 1; p <= periods; p++) {
        yr++;
        extended.push(`${yr} (Fcst)`);
      }
      return extended;
    }

    // Fallback: Label with increment
    for (let p = 1; p <= periods; p++) {
      extended.push(`+${p} Period (Fcst)`);
    }

    return extended;
  }

  // Generate predictive trendline for time-series / ordinal category charts (line, area, bar)
  public static generateTimeSeriesTrendline(
    categories: string[],
    values: (number | null)[],
    options?: TrendlineOptions
  ): TrendlineResult {
    const model: TrendlineModelType = options?.model || 'linear';
    const forecastPeriods = Math.max(0, Math.min(12, options?.forecastPeriods || 0));
    const polynomialDegree = options?.polynomialDegree || 2;
    const showConfidence = options?.showConfidenceInterval ?? false;

    // Filter valid non-null numeric pairs
    const validPoints = categories
      .map((cat, idx) => ({ x: idx, y: values[idx] }))
      .filter((pt): pt is { x: number; y: number } => pt.y !== null && !isNaN(pt.y) && isFinite(pt.y));

    if (validPoints.length < 2) {
      return {
        model,
        equation: 'Need ≥ 2 data points',
        rSquared: 0,
        rmse: 0,
        predictedValues: values,
        extendedCategories: categories,
        trendlineData: values,
        forecastStartIndex: categories.length
      };
    }

    // Fit requested regression model
    let fitResult: {
      predict: (x: number) => number;
      equation: string;
      rSquared: number;
      rmse: number;
    };

    if (model === 'exponential') {
      fitResult = this.fitExponentialRegression(validPoints);
    } else if (model === 'polynomial') {
      fitResult = this.fitPolynomialRegression(validPoints, polynomialDegree);
    } else {
      fitResult = this.fitLinearRegression(validPoints);
    }

    const extendedCategories = this.extrapolateCategoryLabels(categories, forecastPeriods);
    const totalCount = extendedCategories.length;

    // Predictions
    const predictedValues: (number | null)[] = [];
    const trendlineData: (number | null)[] = [];
    const forecastData: (number | null)[] = Array(categories.length).fill(null);
    const upperConfidence: (number | null)[] = [];
    const lowerConfidence: (number | null)[] = [];
    const confidenceDifference: (number | null)[] = [];

    // Residual standard error for confidence interval
    const N = validPoints.length;
    const pCount = model === 'polynomial' ? polynomialDegree + 1 : 2;
    let ssRes = 0;
    for (const p of validPoints) {
      ssRes += Math.pow(p.y - fitResult.predict(p.x), 2);
    }
    const sigma = Math.sqrt(ssRes / Math.max(1, N - pCount));
    const xMean = validPoints.reduce((acc, p) => acc + p.x, 0) / N;
    let sxx = validPoints.reduce((acc, p) => acc + Math.pow(p.x - xMean, 2), 0) || 1;

    for (let i = 0; i < totalCount; i++) {
      const yHat = fitResult.predict(i);
      const roundedYHat = Number(yHat.toFixed(2));
      trendlineData.push(roundedYHat);

      if (i < categories.length) {
        predictedValues.push(roundedYHat);
      } else {
        forecastData.push(roundedYHat);
      }

      if (showConfidence) {
        const se = sigma * Math.sqrt(1 + 1 / N + Math.pow(i - xMean, 2) / sxx);
        const upper = Number((yHat + 1.96 * se).toFixed(2));
        const lower = Number((yHat - 1.96 * se).toFixed(2));
        upperConfidence.push(upper);
        lowerConfidence.push(lower);
        confidenceDifference.push(Number(Math.max(0, upper - lower).toFixed(2)));
      }
    }

    return {
      model,
      equation: fitResult.equation,
      rSquared: Number(fitResult.rSquared.toFixed(3)),
      rmse: Number(fitResult.rmse.toFixed(2)),
      predictedValues,
      extendedCategories,
      trendlineData,
      forecastStartIndex: categories.length,
      forecastData: forecastPeriods > 0 ? forecastData : undefined,
      upperConfidence: showConfidence ? upperConfidence : undefined,
      lowerConfidence: showConfidence ? lowerConfidence : undefined,
      confidenceDifference: showConfidence ? confidenceDifference : undefined
    };
  }

  // Generate predictive trendline for scatter plot visualizations
  public static generateScatterTrendline(
    points: { x: number; y: number; label?: string }[],
    options?: TrendlineOptions
  ): TrendlineResult {
    const model: TrendlineModelType = options?.model || 'linear';
    const forecastPeriods = Math.max(0, Math.min(10, options?.forecastPeriods || 0));
    const polynomialDegree = options?.polynomialDegree || 2;
    const showConfidence = options?.showConfidenceInterval ?? false;

    // Filter valid points and sort by x coordinate
    const sorted = points
      .filter((p) => !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y))
      .sort((a, b) => a.x - b.x);

    if (sorted.length < 2) {
      return {
        model,
        equation: 'Need ≥ 2 scatter points',
        rSquared: 0,
        rmse: 0,
        predictedValues: sorted.map((p) => p.y),
        extendedCategories: [],
        trendlineData: [],
        forecastStartIndex: 0
      };
    }

    // Fit model
    let fitResult: {
      predict: (x: number) => number;
      equation: string;
      rSquared: number;
      rmse: number;
    };

    if (model === 'exponential') {
      fitResult = this.fitExponentialRegression(sorted);
    } else if (model === 'polynomial') {
      fitResult = this.fitPolynomialRegression(sorted, polynomialDegree);
    } else {
      fitResult = this.fitLinearRegression(sorted);
    }

    const xMin = sorted[0].x;
    const xMax = sorted[sorted.length - 1].x;
    const xRange = xMax - xMin || 1;
    // If forecast requested, extrapolate xMax forward
    const xMaxExtended = forecastPeriods > 0 ? xMax + (xRange / sorted.length) * forecastPeriods : xMax;

    // Sample dense smooth points along the domain for continuous curve rendering
    const sampleCount = 60;
    const scatterTrendlineData: [number, number][] = [];
    const scatterUpperConfidence: [number, number][] = [];
    const scatterLowerConfidence: [number, number][] = [];

    const N = sorted.length;
    const pCount = model === 'polynomial' ? polynomialDegree + 1 : 2;
    let ssRes = 0;
    for (const p of sorted) {
      ssRes += Math.pow(p.y - fitResult.predict(p.x), 2);
    }
    const sigma = Math.sqrt(ssRes / Math.max(1, N - pCount));
    const xMean = sorted.reduce((acc, p) => acc + p.x, 0) / N;
    let sxx = sorted.reduce((acc, p) => acc + Math.pow(p.x - xMean, 2), 0) || 1;

    for (let s = 0; s <= sampleCount; s++) {
      const curX = xMin + (xMaxExtended - xMin) * (s / sampleCount);
      const curY = fitResult.predict(curX);
      scatterTrendlineData.push([Number(curX.toFixed(2)), Number(curY.toFixed(2))]);

      if (showConfidence) {
        const se = sigma * Math.sqrt(1 + 1 / N + Math.pow(curX - xMean, 2) / sxx);
        scatterUpperConfidence.push([Number(curX.toFixed(2)), Number((curY + 1.96 * se).toFixed(2))]);
        scatterLowerConfidence.push([Number(curX.toFixed(2)), Number((curY - 1.96 * se).toFixed(2))]);
      }
    }

    const predictedValues = sorted.map((p) => Number(fitResult.predict(p.x).toFixed(2)));

    return {
      model,
      equation: fitResult.equation,
      rSquared: Number(fitResult.rSquared.toFixed(3)),
      rmse: Number(fitResult.rmse.toFixed(2)),
      predictedValues,
      extendedCategories: [],
      trendlineData: predictedValues,
      scatterTrendlineData,
      forecastStartIndex: sorted.length,
      scatterUpperConfidence: showConfidence ? scatterUpperConfidence : undefined,
      scatterLowerConfidence: showConfidence ? scatterLowerConfidence : undefined
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

  // Detect if numeric values in a column represent timestamps or serial dates
  public static detectNumericDateType(values: any[]): 'excel_serial' | 'unix_ms' | 'unix_sec' | 'yyyymmdd' | 'none' {
    const validNums = values
      .map((v) => Number(v))
      .filter((n) => !isNaN(n) && n > 0)
      .slice(0, 50);

    if (validNums.length === 0) return 'none';

    // 1. Unix milliseconds (e.g. 1704067200000 -> ~1.7e12, years 2001 to 2065)
    if (validNums.every((n) => n > 1_000_000_000_000 && n < 3_000_000_000_000)) {
      return 'unix_ms';
    }

    // 2. Unix seconds (e.g. 1704067200 -> ~1.7e9, years 2001 to 2065)
    if (validNums.every((n) => n > 1_000_000_000 && n < 3_000_000_000)) {
      return 'unix_sec';
    }

    // 3. Integer dates YYYYMMDD (e.g. 19700101 to 20991231)
    if (validNums.every((n) => {
      if (n < 19700101 || n > 20991231) return false;
      const s = String(Math.floor(n));
      const m = parseInt(s.slice(4, 6), 10);
      const d = parseInt(s.slice(6, 8), 10);
      return m >= 1 && m <= 12 && d >= 1 && d <= 31;
    })) {
      return 'yyyymmdd';
    }

    // 4. Excel serial dates (e.g. 25000 to 65000, roughly 1968 to 2077)
    if (validNums.every((n) => n >= 25000 && n <= 65000)) {
      return 'excel_serial';
    }

    return 'none';
  }

  // Universal date parser supporting Excel serial dates, Unix timestamps, YYYYMMDD integers, ISO strings, and slash/dash strings
  public static parseAnyDate(val: any, sourceType?: string): Date | null {
    if (val === null || val === undefined || val === '') return null;
    if (val instanceof Date && !isNaN(val.getTime())) return val;

    const numVal = Number(val);
    const isNum = !isNaN(numVal) && String(val).trim() !== '';

    if (isNum) {
      const detected = (sourceType && sourceType !== 'auto') ? sourceType : DataEngine.detectNumericDateType([numVal]);

      // Excel serial date (days since Dec 30, 1899)
      if (detected === 'excel_serial' || (numVal >= 25000 && numVal <= 65000 && sourceType !== 'unix_sec')) {
        const utcDays = Math.floor(numVal - 25569);
        const utcValue = utcDays * 86400 * 1000;
        const fractionalDay = (numVal - Math.floor(numVal)) * 86400 * 1000;
        const d = new Date(utcValue + fractionalDay);
        if (!isNaN(d.getTime())) return d;
      }

      // Unix milliseconds
      if (detected === 'unix_ms' || numVal > 1_000_000_000_000) {
        const d = new Date(numVal);
        if (!isNaN(d.getTime())) return d;
      }

      // Unix seconds
      if (detected === 'unix_sec' || (numVal > 1_000_000_000 && numVal <= 3_000_000_000)) {
        const d = new Date(numVal * 1000);
        if (!isNaN(d.getTime())) return d;
      }

      // YYYYMMDD integer
      if (detected === 'yyyymmdd' || (numVal >= 19700101 && numVal <= 20991231)) {
        const s = String(Math.floor(numVal));
        const y = parseInt(s.slice(0, 4), 10);
        const m = parseInt(s.slice(4, 6), 10) - 1;
        const day = parseInt(s.slice(6, 8), 10);
        const d = new Date(y, m, day);
        if (!isNaN(d.getTime())) return d;
      }
    }

    const str = String(val).trim();

    // Specific Regex for DD/MM/YYYY or DD-MM-YYYY if indicated or common
    if (sourceType === 'DD/MM/YYYY' || sourceType === 'DD-MM-YYYY' || /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(str)) {
      const match = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
      if (match) {
        let first = parseInt(match[1], 10);
        let second = parseInt(match[2], 10);
        let year = parseInt(match[3], 10);

        // If first > 12, it MUST be day (DD/MM/YYYY)
        if (first > 12) {
          const d = new Date(year, second - 1, first);
          if (!isNaN(d.getTime())) return d;
        } else if (sourceType === 'DD/MM/YYYY' || sourceType === 'DD-MM-YYYY') {
          const d = new Date(year, second - 1, first);
          if (!isNaN(d.getTime())) return d;
        } else {
          // Standard US fallback (MM/DD/YYYY)
          const d = new Date(year, first - 1, second);
          if (!isNaN(d.getTime())) return d;
        }
      }
    }

    // Standard JavaScript date parser
    const parsed = Date.parse(str);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }

    return null;
  }

  // Format a Date object into a readable date string
  public static formatDate(date: Date | null, formatPattern: string = 'YYYY-MM-DD'): string {
    if (!date || isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const quarter = Math.ceil(month / 3);

    const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

    switch (formatPattern) {
      case 'MM/DD/YYYY':
        return `${pad(month)}/${pad(day)}/${year}`;
      case 'DD/MM/YYYY':
        return `${pad(day)}/${pad(month)}/${year}`;
      case 'DD-MM-YYYY':
        return `${pad(day)}-${pad(month)}-${year}`;
      case 'MM-DD-YYYY':
        return `${pad(month)}-${pad(day)}-${year}`;
      case 'YYYY/MM/DD':
        return `${year}/${pad(month)}/${pad(day)}`;
      case 'MMM DD, YYYY':
      case 'date_long':
        return `${monthNamesShort[month - 1]} ${pad(day)}, ${year}`;
      case 'MMMM DD, YYYY':
        return `${monthNamesLong[month - 1]} ${pad(day)}, ${year}`;
      case 'MMM YYYY':
        return `${monthNamesShort[month - 1]} ${year}`;
      case 'YYYY-Q#':
      case 'Q# YYYY':
        return `Q${quarter} ${year}`;
      case 'YYYY-MM-DD HH:mm':
        return `${year}-${pad(month)}-${pad(day)} ${pad(hours)}:${pad(minutes)}`;
      case 'HH:mm:ss':
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      case 'YYYY-MM-DD':
      case 'date':
      case 'date_iso':
      default:
        return `${year}-${pad(month)}-${pad(day)}`;
    }
  }

  // Parse a formatted currency, percentage, or grouped number string into pure float
  public static parseNumericString(val: any): number | null {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;

    const str = String(val).trim();
    if (!str) return null;

    // Clean currency symbols, commas, and percentage marks
    const isPercentage = str.endsWith('%');
    const cleaned = str.replace(/[$€£¥₹\s,]/g, '').replace(/%$/, '');
    const num = Number(cleaned);

    if (isNaN(num)) return null;
    return isPercentage ? num / 100 : num;
  }

  // Universal value formatter based on ColumnSchema
  public static formatValue(val: any, schema?: ColumnSchema): string {
    if (val === null || val === undefined) return '';

    if (!schema) {
      return String(val);
    }

    // Date formatting (including numbers acting as dates)
    if (schema.type === 'date' || schema.format === 'date' || schema.dateFormat) {
      const d = DataEngine.parseAnyDate(val, schema.sourceDataType);
      if (d) {
        return DataEngine.formatDate(d, schema.dateFormat || 'YYYY-MM-DD');
      }
      return String(val);
    }

    // Number formatting
    if (
      schema.type === 'number' ||
      schema.format === 'currency' ||
      schema.format === 'percent' ||
      schema.format === 'integer' ||
      schema.format === 'decimal' ||
      schema.numberFormat
    ) {
      const num = typeof val === 'number' ? val : DataEngine.parseNumericString(val);
      if (num === null || isNaN(num)) return String(val);

      const symbol = schema.currencySymbol || '$';
      const decimals = schema.decimalPlaces !== undefined ? schema.decimalPlaces : 2;

      if (schema.format === 'currency' || schema.numberFormat === 'currency') {
        return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
      }
      if (schema.format === 'percent' || schema.numberFormat === 'percent') {
        const pctVal = Math.abs(num) <= 1 && num !== 0 ? num * 100 : num;
        return `${pctVal.toFixed(schema.decimalPlaces !== undefined ? schema.decimalPlaces : 1)}%`;
      }
      if (schema.format === 'integer' || schema.numberFormat === 'integer') {
        return Math.round(num).toLocaleString();
      }
      if (schema.format === 'decimal' || schema.numberFormat === 'decimal') {
        return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      }
      if (schema.numberFormat === 'compact') {
        return DataEngine.formatNumber(num);
      }
      return num.toLocaleString();
    }

    // Boolean formatting
    if (schema.type === 'boolean') {
      return val ? 'Yes' : 'No';
    }

    // String formatting
    if (schema.format === 'uppercase') {
      return String(val).toUpperCase();
    }
    if (schema.format === 'lowercase') {
      return String(val).toLowerCase();
    }
    if (schema.format === 'capitalize') {
      const s = String(val);
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    }

    return String(val);
  }

  // Diagnostic Audit: Inspect all columns in a dataset and identify misidentified data types
  public static inspectDatasetTypes(dataset: Dataset): {
    columnName: string;
    currentType: DataType;
    suggestedType: DataType;
    sourceDataType?: 'excel_serial' | 'unix_ms' | 'unix_sec' | 'yyyymmdd' | 'iso_string' | 'auto';
    suggestedFormat?: string;
    reason: string;
    sampleValues: any[];
    autoFixOptions: {
      format?: string;
      dateFormat?: string;
      numberFormat?: string;
      sourceDataType?: 'excel_serial' | 'unix_ms' | 'unix_sec' | 'yyyymmdd' | 'iso_string' | 'auto';
      mutateRows?: boolean;
    };
  }[] {
    const issues: any[] = [];

    for (const col of dataset.columns) {
      const samples = dataset.data
        .map((r) => r[col.name])
        .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
        .slice(0, 50);

      if (samples.length === 0) continue;

      // 1. Column is currently 'number', but values are actually numeric dates!
      if (col.type === 'number') {
        const detectedNumericDate = DataEngine.detectNumericDateType(samples);
        if (detectedNumericDate !== 'none') {
          let reason = '';
          if (detectedNumericDate === 'excel_serial') {
            reason = 'Excel serial date numbers (e.g. 45000+ = 2023-2025). Can be converted into readable dates.';
          } else if (detectedNumericDate === 'unix_sec') {
            reason = 'Unix timestamps in seconds. Can be converted into standard calendar dates.';
          } else if (detectedNumericDate === 'unix_ms') {
            reason = 'Unix timestamps in milliseconds. Can be converted into standard calendar dates.';
          } else if (detectedNumericDate === 'yyyymmdd') {
            reason = 'Integer formatted as YYYYMMDD (e.g. 20240115). Can be converted into standard dates.';
          }

          issues.push({
            columnName: col.name,
            currentType: 'number' as DataType,
            suggestedType: 'date' as DataType,
            sourceDataType: detectedNumericDate,
            suggestedFormat: 'YYYY-MM-DD',
            reason,
            sampleValues: samples.slice(0, 3),
            autoFixOptions: {
              dateFormat: 'YYYY-MM-DD',
              sourceDataType: detectedNumericDate,
              mutateRows: true
            }
          });
          continue;
        }
      }

      // 2. Column is currently 'string', but values are parseable numbers (e.g. "$1,250", "45%", "99.5")
      if (col.type === 'string') {
        // Check if values are actually dates
        const dateParsedSamples = samples.map((s) => DataEngine.parseAnyDate(s));
        const validDatesCount = dateParsedSamples.filter((d) => d !== null).length;

        if (validDatesCount === samples.length && samples.length >= 2) {
          issues.push({
            columnName: col.name,
            currentType: 'string' as DataType,
            suggestedType: 'date' as DataType,
            sourceDataType: 'iso_string',
            suggestedFormat: 'YYYY-MM-DD',
            reason: 'Text strings containing calendar dates. Converting to date unlocks time grouping and trends.',
            sampleValues: samples.slice(0, 3),
            autoFixOptions: {
              dateFormat: 'YYYY-MM-DD',
              sourceDataType: 'iso_string',
              mutateRows: true
            }
          });
          continue;
        }

        // Check if values are boolean strings
        const isAllBooleans = samples.every((s) => {
          const str = String(s).toLowerCase().trim();
          return ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(str);
        });

        if (isAllBooleans && samples.length >= 2) {
          issues.push({
            columnName: col.name,
            currentType: 'string' as DataType,
            suggestedType: 'boolean' as DataType,
            reason: 'Boolean truth flags stored as text (Yes/No, True/False).',
            sampleValues: samples.slice(0, 3),
            autoFixOptions: {
              mutateRows: true
            }
          });
          continue;
        }

        // Check if values are formatted currency or numeric strings
        const numParsedSamples = samples.map((s) => DataEngine.parseNumericString(s));
        const validNumsCount = numParsedSamples.filter((n) => n !== null).length;

        if (validNumsCount === samples.length && samples.length >= 2) {
          const hasCurrencySymbol = samples.some((s) => /[$€£¥₹]/.test(String(s)));
          const hasPercentSymbol = samples.some((s) => String(s).includes('%'));

          issues.push({
            columnName: col.name,
            currentType: 'string' as DataType,
            suggestedType: 'number' as DataType,
            suggestedFormat: hasCurrencySymbol ? 'currency' : hasPercentSymbol ? 'percent' : 'decimal',
            reason: hasCurrencySymbol
              ? 'Currency figures formatted as text strings. Converting to measure enables SUM/AVG aggregation.'
              : hasPercentSymbol
              ? 'Percentages formatted as text strings. Converting enables charting calculations.'
              : 'Numeric figures stored as strings. Converting to measure enables mathematical aggregation.',
            sampleValues: samples.slice(0, 3),
            autoFixOptions: {
              format: hasCurrencySymbol ? 'currency' : hasPercentSymbol ? 'percent' : 'decimal',
              numberFormat: hasCurrencySymbol ? 'currency' : hasPercentSymbol ? 'percent' : 'decimal',
              mutateRows: true
            }
          });
        }
      }
    }

    return issues;
  }

  // Convert column data type and formats, optionally mutating row data values and recording diagnostics
  public static convertColumnDataType(
    dataset: Dataset,
    columnName: string,
    targetType: DataType,
    options?: {
      format?: string;
      dateFormat?: string;
      numberFormat?: string;
      currencySymbol?: string;
      decimalPlaces?: number;
      thousandSeparator?: string;
      sourceDataType?: 'excel_serial' | 'unix_ms' | 'unix_sec' | 'yyyymmdd' | 'iso_string' | 'auto';
      mutateRows?: boolean;
      fallbackMode?: 'keep' | 'null' | 'default';
    }
  ): Dataset {
    const colIndex = dataset.columns.findIndex((c) => c.name === columnName);
    if (colIndex === -1) return dataset;

    const existingCol = dataset.columns[colIndex];
    let newCategory = existingCol.category;
    if (targetType === 'date') newCategory = 'time';
    else if (targetType === 'number') newCategory = 'measure';
    else if (targetType === 'string' || targetType === 'boolean') newCategory = 'dimension';

    const updatedCol: ColumnSchema = {
      ...existingCol,
      type: targetType,
      category: newCategory,
      format: options?.format || (targetType === 'date' ? 'date' : existingCol.format),
      dateFormat: options?.dateFormat,
      numberFormat: options?.numberFormat,
      currencySymbol: options?.currencySymbol,
      decimalPlaces: options?.decimalPlaces,
      thousandSeparator: options?.thousandSeparator,
      sourceDataType: options?.sourceDataType
    };

    const newColumns = [...dataset.columns];
    newColumns[colIndex] = updatedCol;

    let updatedData = dataset.data;
    if (options?.mutateRows) {
      updatedData = dataset.data.map((row) => {
        const rawVal = row[columnName];
        let transformedVal = rawVal;

        if (targetType === 'date') {
          const parsed = DataEngine.parseAnyDate(rawVal, options.sourceDataType);
          if (parsed) {
            transformedVal = DataEngine.formatDate(parsed, options.dateFormat || 'YYYY-MM-DD');
          } else if (options.fallbackMode === 'null') {
            transformedVal = null;
          } else if (options.fallbackMode === 'default') {
            transformedVal = DataEngine.formatDate(new Date(), options.dateFormat || 'YYYY-MM-DD');
          }
        } else if (targetType === 'number') {
          const parsed = DataEngine.parseNumericString(rawVal);
          if (parsed !== null && !isNaN(parsed)) {
            transformedVal = parsed;
          } else if (options.fallbackMode === 'null') {
            transformedVal = null;
          } else if (options.fallbackMode === 'default') {
            transformedVal = 0;
          }
        } else if (targetType === 'string') {
          transformedVal = String(rawVal ?? '');
        } else if (targetType === 'boolean') {
          const s = String(rawVal ?? '').toLowerCase().trim();
          transformedVal = s === 'true' || s === 'yes' || s === '1' || s === 'y';
        }

        return {
          ...row,
          [columnName]: transformedVal
        };
      });
    }

    return {
      ...dataset,
      columns: newColumns,
      data: updatedData,
      lastRefreshed: 'Just now'
    };
  }

  // Batch convert multiple columns in one call (e.g. for "Auto-Fix All Anomalies")
  public static batchConvertDatasetTypes(
    dataset: Dataset,
    conversions: {
      columnName: string;
      targetType: DataType;
      options?: {
        format?: string;
        dateFormat?: string;
        numberFormat?: string;
        sourceDataType?: 'excel_serial' | 'unix_ms' | 'unix_sec' | 'yyyymmdd' | 'iso_string' | 'auto';
        mutateRows?: boolean;
      };
    }[]
  ): Dataset {
    let current = dataset;
    for (const item of conversions) {
      current = DataEngine.convertColumnDataType(current, item.columnName, item.targetType, item.options);
    }
    return current;
  }

  // Chronological parsing helper for quarters (Q1 2024), months (Jan, Feb...), and date strings
  public static parseChronologicalValue(val: any): number {
    if (val === null || val === undefined) return -Infinity;
    const str = String(val).trim();
    if (!str) return -Infinity;

    // 1. Quarters pattern: e.g. "Q1 2024", "2024 Q2", "Q3-2023", "Q4"
    const qMatch = str.match(/Q([1-4])(?:\s*[-/]?\s*(\d{2,4}))?/i) || str.match(/(\d{4})\s*[-/]?\s*Q([1-4])/i);
    if (qMatch) {
      let quarter = 1;
      let year = 2024;
      if (str.match(/Q([1-4])/i)) {
        quarter = parseInt(str.match(/Q([1-4])/i)![1], 10);
        const yMatch = str.match(/\b(20\d\d|19\d\d)\b/);
        if (yMatch) year = parseInt(yMatch[1], 10);
      } else if (str.match(/(\d{4})\s*[-/]?\s*Q([1-4])/i)) {
        const parts = str.match(/(\d{4})\s*[-/]?\s*Q([1-4])/i)!;
        year = parseInt(parts[1], 10);
        quarter = parseInt(parts[2], 10);
      }
      return year * 10 + quarter;
    }

    // 2. Month name pattern: e.g. "Jan 2024", "January", "March 2023"
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const lower = str.toLowerCase();
    const monthIndex = months.findIndex((m) => lower.startsWith(m));
    if (monthIndex !== -1) {
      const yMatch = str.match(/\b(20\d\d|19\d\d)\b/);
      const year = yMatch ? parseInt(yMatch[1], 10) : 2024;
      return year * 100 + monthIndex;
    }

    // 3. Standard Date / Timestamp
    const parsedDate = Date.parse(str);
    if (!isNaN(parsedDate)) {
      return parsedDate;
    }

    // 4. Fallback numeric
    const parsedNum = Number(str.replace(/[^0-9.-]/g, ''));
    if (!isNaN(parsedNum) && parsedNum !== 0) {
      return parsedNum;
    }

    return -Infinity;
  }

  // Universal value comparator supporting chronological, numeric, and natural alphanumeric orders
  public static compareValues(valA: any, valB: any, order: 'asc' | 'desc' = 'asc', type: SortType = 'auto'): number {
    const isDesc = order === 'desc';

    // Handle nulls and undefined - push to bottom
    if ((valA === null || valA === undefined || valA === '') && (valB === null || valB === undefined || valB === '')) return 0;
    if (valA === null || valA === undefined || valA === '') return 1;
    if (valB === null || valB === undefined || valB === '') return -1;

    let res = 0;

    if (type === 'chronological') {
      const chronoA = this.parseChronologicalValue(valA);
      const chronoB = this.parseChronologicalValue(valB);
      if (chronoA !== -Infinity || chronoB !== -Infinity) {
        res = chronoA - chronoB;
        return isDesc ? -res : res;
      }
    }

    // Check for explicit or auto numeric comparison
    const numA = typeof valA === 'number' ? valA : Number(String(valA).replace(/[$%,]/g, ''));
    const numB = typeof valB === 'number' ? valB : Number(String(valB).replace(/[$%,]/g, ''));
    const isBothNumeric = (type === 'numeric') || (type === 'auto' && !isNaN(numA) && !isNaN(numB) && typeof valA !== 'boolean' && typeof valB !== 'boolean');

    if (isBothNumeric && !isNaN(numA) && !isNaN(numB)) {
      res = numA - numB;
    } else {
      // Natural collation (e.g. "Item 2" before "Item 10", case-insensitive)
      const strA = String(valA);
      const strB = String(valB);

      // Auto check for chronological values
      if (type === 'auto') {
        const chronoA = this.parseChronologicalValue(strA);
        const chronoB = this.parseChronologicalValue(strB);
        if (chronoA !== -Infinity && chronoB !== -Infinity && chronoA !== chronoB) {
          res = chronoA - chronoB;
          return isDesc ? -res : res;
        }
      }

      res = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
    }

    return isDesc ? -res : res;
  }

  // Multi-stage sequential query sorter for records
  public static sequentialSort(rows: Record<string, any>[], clauses: SortClause[]): Record<string, any>[] {
    if (!clauses || clauses.length === 0) return [...rows];

    const sorted = [...rows];
    sorted.sort((a, b) => {
      for (const clause of clauses) {
        const valA = a[clause.column];
        const valB = b[clause.column];
        const cmp = DataEngine.compareValues(valA, valB, clause.order, clause.type || 'auto');
        if (cmp !== 0) return cmp;
      }
      return 0;
    });

    return sorted;
  }

  // Determine the intelligent "Perfect Order" sequential query sorting pipeline for unsorted data
  public static getPerfectOrderClauses(columns: ColumnSchema[]): SortClause[] {
    const clauses: SortClause[] = [];

    // 1. Primary Time / Chronological Column (Date, Quarter, Month, Year, Timestamp)
    const timeCol = columns.find(
      (c) => c.category === 'time' ||
        ['date', 'quarter', 'month', 'year', 'period', 'timestamp'].some((k) => c.name.toLowerCase().includes(k))
    );
    if (timeCol) {
      clauses.push({
        id: `clause-chrono-${Date.now()}-1`,
        column: timeCol.name,
        order: 'asc',
        type: 'chronological'
      });
    }

    // 2. Primary Categorical / Geographic Dimension (Region, Country, Segment, Category)
    const dimCols = columns.filter(
      (c) => (c.category === 'dimension' || c.type === 'string') && (!timeCol || c.name !== timeCol.name)
    );

    // Prioritize high-level groupings like Region/Category/Segment
    const priorityDim = dimCols.find((c) =>
      ['region', 'category', 'country', 'segment', 'department', 'market'].some((k) => c.name.toLowerCase().includes(k))
    ) || dimCols[0];

    if (priorityDim) {
      clauses.push({
        id: `clause-dim-${Date.now()}-2`,
        column: priorityDim.name,
        order: 'asc',
        type: 'alphanumeric'
      });
    }

    // 3. Secondary Sub-Dimension (e.g. Country, Product, SubCategory)
    const secondaryDim = dimCols.find((c) => c.name !== priorityDim?.name && (!timeCol || c.name !== timeCol.name));
    if (secondaryDim && clauses.length < 3) {
      clauses.push({
        id: `clause-subdim-${Date.now()}-3`,
        column: secondaryDim.name,
        order: 'asc',
        type: 'alphanumeric'
      });
    }

    // 4. Primary Metric / Measure (e.g. Revenue, Sales, Profit) - sorted descending by magnitude
    const measureCol = columns.find(
      (c) => c.category === 'measure' ||
        ['revenue', 'sales', 'profit', 'amount', 'total'].some((k) => c.name.toLowerCase().includes(k))
    );
    if (measureCol) {
      clauses.push({
        id: `clause-measure-${Date.now()}-4`,
        column: measureCol.name,
        order: 'desc',
        type: 'numeric'
      });
    }

    return clauses;
  }

  // Generate readable ANSI / DuckDB SQL statement for the sequential sort query
  public static generateSequentialSortSql(tableName: string, clauses: SortClause[], limit?: number): string {
    const cleanTable = tableName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    if (!clauses || clauses.length === 0) {
      return `SELECT * FROM ${cleanTable};`;
    }

    const orderLines = clauses.map((c) => {
      const typeHint = c.type === 'chronological' ? ' /* chronological */' : c.type === 'numeric' ? ' /* numeric */' : '';
      return `  "${c.column}" ${c.order.toUpperCase()}${typeHint}`;
    }).join(',\n');

    const limitClause = limit ? `\nLIMIT ${limit}` : '';
    return `-- Sequential Multi-Stage Query Pipeline\nSELECT *\nFROM "${cleanTable}"\nORDER BY\n${orderLines}${limitClause};`;
  }

  // Permanently or dynamically sorts an entire dataset into sequential order
  public static sortDatasetSequentially(dataset: Dataset, clauses: SortClause[]): Dataset {
    const sortedData = this.sequentialSort(dataset.data, clauses);
    return {
      ...dataset,
      data: sortedData,
      lastRefreshed: 'Just now (Sequentially Sorted)'
    };
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
