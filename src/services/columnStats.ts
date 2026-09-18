import { ColumnSchema, Dataset } from '../types/dashboard';

export interface ColumnStatistics {
  columnName: string;
  type: ColumnSchema['type'];
  category: ColumnSchema['category'];
  totalRows: number;
  validCount: number;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  cardinalityRatio: number; // uniqueCount / totalRows

  // Min & Max
  minRaw: any;
  maxRaw: any;
  minFormatted: string;
  maxFormatted: string;

  // Numeric Statistics
  isNumeric: boolean;
  mean?: number;
  meanFormatted?: string;
  variance?: number; // Population variance σ²
  sampleVariance?: number; // Sample variance s²
  varianceFormatted?: string;
  stdDev?: number; // Standard deviation σ
  stdDevFormatted?: string;
  cv?: number; // Coefficient of Variation (stdDev / |mean|) * 100
  cvFormatted?: string;
  range?: number;
  rangeFormatted?: string;
  median?: number;
  medianFormatted?: string;
  q1?: number;
  q3?: number;
  iqr?: number;
  histogram?: { binLabel: string; count: number; pct: number }[];

  // Non-numeric / Date / String stats
  isDate?: boolean;
  dateSpanDays?: number;
  topValue?: string;
  topValueCount?: number;
  topValuePct?: number;
  qualitativeVariation?: number; // 0 to 1 index of categorical dispersion

  // Descriptive narrative
  descriptiveSummary: string;
  varianceEvaluation: string; // e.g., 'Low Variance', 'High Dispersion', 'Uniform'
}

/**
 * Formats a numeric value based on column schema or general sensible rules.
 */
export function formatStatValue(val: number | null | undefined, col?: ColumnSchema, forceDecimals?: number): string {
  if (val === null || val === undefined || isNaN(val)) return '—';

  const format = col?.format;
  const currencySymbol = col?.currencySymbol || '$';
  const decimals = forceDecimals !== undefined ? forceDecimals : col?.decimalPlaces ?? (Math.abs(val) < 10 && val % 1 !== 0 ? 2 : Math.abs(val) < 100 ? 1 : 0);

  if (format === 'currency') {
    return `${currencySymbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }

  if (format === 'percent') {
    return `${val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}%`;
  }

  if (format === 'integer') {
    return Math.round(val).toLocaleString();
  }

  return val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: Math.max(decimals, 2)
  });
}

/**
 * Computes deep descriptive statistics including min, max, null count, and variance for a column.
 */
export function computeColumnStatistics(dataset: Dataset, colName: string): ColumnStatistics {
  const col = dataset.columns.find((c) => c.name === colName);
  const rows = dataset.data;
  const totalRows = rows.length;

  const colType = col?.type || 'string';
  const colCategory = col?.category || 'dimension';

  if (totalRows === 0) {
    return {
      columnName: colName,
      type: colType,
      category: colCategory,
      totalRows: 0,
      validCount: 0,
      nullCount: 0,
      nullPercentage: 0,
      uniqueCount: 0,
      cardinalityRatio: 0,
      minRaw: null,
      maxRaw: null,
      minFormatted: 'N/A',
      maxFormatted: 'N/A',
      isNumeric: colType === 'number',
      descriptiveSummary: 'Dataset contains no records.',
      varianceEvaluation: 'No Data'
    };
  }

  let nullCount = 0;
  const rawValues: any[] = [];
  const numbers: number[] = [];
  const frequencyMap = new Map<string, number>();

  for (let i = 0; i < totalRows; i++) {
    const val = rows[i]?.[colName];
    if (val === null || val === undefined || val === '') {
      nullCount++;
      continue;
    }

    rawValues.push(val);
    const strKey = String(val);
    frequencyMap.set(strKey, (frequencyMap.get(strKey) || 0) + 1);

    if (colType === 'number' || typeof val === 'number') {
      const num = Number(val);
      if (!isNaN(num)) {
        numbers.push(num);
      } else {
        nullCount++;
      }
    }
  }

  const validCount = rawValues.length;
  const nullPercentage = totalRows > 0 ? (nullCount / totalRows) * 100 : 0;
  const uniqueCount = frequencyMap.size;
  const cardinalityRatio = totalRows > 0 ? uniqueCount / totalRows : 0;

  // Find mode (top frequent value)
  let topValue = '—';
  let topValueCount = 0;
  frequencyMap.forEach((count, key) => {
    if (count > topValueCount) {
      topValueCount = count;
      topValue = key;
    }
  });
  const topValuePct = validCount > 0 ? (topValueCount / validCount) * 100 : 0;

  // Numerical column processing
  const isNumeric = colType === 'number' || (numbers.length > 0 && numbers.length >= validCount * 0.85);

  if (isNumeric && numbers.length > 0) {
    const n = numbers.length;
    let min = numbers[0];
    let max = numbers[0];
    let sum = 0;

    for (let i = 0; i < n; i++) {
      const v = numbers[i];
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
    }

    const mean = sum / n;
    const range = max - min;

    // Variance calculation: σ² = Σ (x - μ)² / n
    let sumSquaredDiff = 0;
    for (let i = 0; i < n; i++) {
      sumSquaredDiff += Math.pow(numbers[i] - mean, 2);
    }
    const variance = sumSquaredDiff / n;
    const sampleVariance = n > 1 ? sumSquaredDiff / (n - 1) : 0;
    const stdDev = Math.sqrt(variance);
    const cv = Math.abs(mean) > 0.00001 ? (stdDev / Math.abs(mean)) * 100 : 0;

    // Percentiles
    const sorted = [...numbers].sort((a, b) => a - b);
    const q1Index = Math.floor(n * 0.25);
    const medIndex = Math.floor(n * 0.5);
    const q3Index = Math.floor(n * 0.75);
    const q1 = sorted[q1Index];
    const median = sorted[medIndex];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    // 6-bin histogram for distribution sparkline
    const histogram: { binLabel: string; count: number; pct: number }[] = [];
    const binCount = 6;
    const binWidth = range > 0 ? range / binCount : 1;
    const bins = new Array(binCount).fill(0);

    for (let i = 0; i < n; i++) {
      const v = numbers[i];
      const binIdx = range === 0 ? 0 : Math.min(Math.floor((v - min) / binWidth), binCount - 1);
      bins[binIdx]++;
    }

    for (let b = 0; b < binCount; b++) {
      const bMin = min + b * binWidth;
      const bMax = b === binCount - 1 ? max : min + (b + 1) * binWidth;
      histogram.push({
        binLabel: `${formatStatValue(bMin, col, 0)} - ${formatStatValue(bMax, col, 0)}`,
        count: bins[b],
        pct: (bins[b] / n) * 100
      });
    }

    // Variance evaluation & description
    let varianceEvaluation = 'Normal Variance';
    if (variance === 0 || range === 0) {
      varianceEvaluation = 'Zero Variance (Constant)';
    } else if (cv < 15) {
      varianceEvaluation = 'Low Variance (Tight)';
    } else if (cv <= 50) {
      varianceEvaluation = 'Moderate Variance';
    } else if (cv <= 100) {
      varianceEvaluation = 'High Dispersion';
    } else {
      varianceEvaluation = 'Extreme Variance';
    }

    const nullPhrase = nullCount === 0
      ? 'Complete data (0 nulls)'
      : `${nullCount.toLocaleString()} null entries (${nullPercentage.toFixed(1)}% missing)`;

    const descriptiveSummary = `Values range from ${formatStatValue(min, col)} to ${formatStatValue(
      max,
      col
    )} with mean of ${formatStatValue(mean, col)}. Standard deviation is ${formatStatValue(
      stdDev,
      col,
      1
    )} (Variance: ${variance.toLocaleString(undefined, { maximumFractionDigits: 2 })}). ${nullPhrase}.`;

    return {
      columnName: colName,
      type: colType,
      category: colCategory,
      totalRows,
      validCount,
      nullCount,
      nullPercentage,
      uniqueCount,
      cardinalityRatio,
      minRaw: min,
      maxRaw: max,
      minFormatted: formatStatValue(min, col),
      maxFormatted: formatStatValue(max, col),
      isNumeric: true,
      mean,
      meanFormatted: formatStatValue(mean, col),
      variance,
      sampleVariance,
      varianceFormatted: variance.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      stdDev,
      stdDevFormatted: formatStatValue(stdDev, col, 1),
      cv,
      cvFormatted: `${cv.toFixed(1)}%`,
      range,
      rangeFormatted: formatStatValue(range, col),
      median,
      medianFormatted: formatStatValue(median, col),
      q1,
      q3,
      iqr,
      histogram,
      topValue,
      topValueCount,
      topValuePct,
      descriptiveSummary,
      varianceEvaluation
    };
  }

  // Date column processing
  const isDate = colType === 'date' || (rawValues.length > 0 && !isNaN(Date.parse(String(rawValues[0]))));
  if (isDate) {
    const parsedTimestamps: number[] = [];
    for (const v of rawValues) {
      const ts = Date.parse(String(v));
      if (!isNaN(ts)) parsedTimestamps.push(ts);
    }

    if (parsedTimestamps.length > 0) {
      parsedTimestamps.sort((a, b) => a - b);
      const minTs = parsedTimestamps[0];
      const maxTs = parsedTimestamps[parsedTimestamps.length - 1];
      const spanDays = Math.round((maxTs - minTs) / (1000 * 60 * 60 * 24));

      // Calculate variance of timestamps (in days)
      const meanTs = parsedTimestamps.reduce((a, b) => a + b, 0) / parsedTimestamps.length;
      let sumSqDays = 0;
      for (const ts of parsedTimestamps) {
        sumSqDays += Math.pow((ts - meanTs) / (1000 * 60 * 60 * 24), 2);
      }
      const varianceDays = sumSqDays / parsedTimestamps.length;
      const stdDevDays = Math.sqrt(varianceDays);

      const minDateStr = new Date(minTs).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const maxDateStr = new Date(maxTs).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const nullPhrase = nullCount === 0
        ? '100% complete with 0 nulls'
        : `${nullCount} nulls (${nullPercentage.toFixed(1)}%)`;

      return {
        columnName: colName,
        type: 'date',
        category: colCategory,
        totalRows,
        validCount,
        nullCount,
        nullPercentage,
        uniqueCount,
        cardinalityRatio,
        minRaw: minDateStr,
        maxRaw: maxDateStr,
        minFormatted: minDateStr,
        maxFormatted: maxDateStr,
        isNumeric: false,
        isDate: true,
        dateSpanDays: spanDays,
        variance: varianceDays,
        varianceFormatted: `${varianceDays.toFixed(1)} days²`,
        stdDev: stdDevDays,
        stdDevFormatted: `±${stdDevDays.toFixed(1)} days`,
        topValue,
        topValueCount,
        topValuePct,
        varianceEvaluation: `${spanDays} Day Span`,
        descriptiveSummary: `Chronological field spanning ${spanDays} days from ${minDateStr} to ${maxDateStr}. ${nullPhrase}. Temporal variance is ${varianceDays.toFixed(1)} days².`
      };
    }
  }

  // Categorical / String column processing
  const sortedStrings = [...rawValues].map(String).sort();
  const minStr = sortedStrings[0] || '—';
  const maxStr = sortedStrings[sortedStrings.length - 1] || '—';

  // Qualitative variation (IQV) calculation
  // IQV = K(N² - Σ f_i²) / (N²(K - 1))
  const k = uniqueCount;
  const n = validCount;
  let qualitativeVariation = 0;
  if (k > 1 && n > 0) {
    let sumSqFreq = 0;
    frequencyMap.forEach((count) => {
      sumSqFreq += count * count;
    });
    qualitativeVariation = (k * (n * n - sumSqFreq)) / (n * n * (k - 1));
  }

  let varEval = 'Categorical Spread';
  if (qualitativeVariation > 0.8) {
    varEval = 'High Category Diversity';
  } else if (qualitativeVariation > 0.4) {
    varEval = 'Moderate Diversity';
  } else {
    varEval = 'Concentrated Category';
  }

  const nullPhrase = nullCount === 0
    ? '0 nulls (100% populated)'
    : `${nullCount} null entries (${nullPercentage.toFixed(1)}% missing)`;

  const descriptiveSummary = `Categorical dimension with ${uniqueCount} distinct values. Mode is "${topValue}" (${topValuePct.toFixed(1)}% of rows). Range spans "${minStr}" to "${maxStr}". ${nullPhrase}.`;

  return {
    columnName: colName,
    type: colType,
    category: colCategory,
    totalRows,
    validCount,
    nullCount,
    nullPercentage,
    uniqueCount,
    cardinalityRatio,
    minRaw: minStr,
    maxRaw: maxStr,
    minFormatted: minStr.length > 18 ? `${minStr.substring(0, 18)}…` : minStr,
    maxFormatted: maxStr.length > 18 ? `${maxStr.substring(0, 18)}…` : maxStr,
    isNumeric: false,
    topValue,
    topValueCount,
    topValuePct,
    qualitativeVariation,
    variance: qualitativeVariation,
    varianceFormatted: `IQV ${(qualitativeVariation * 100).toFixed(1)}%`,
    varianceEvaluation: varEval,
    descriptiveSummary
  };
}
