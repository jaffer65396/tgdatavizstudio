import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Hash,
  Type,
  CheckSquare,
  Sparkles,
  Zap,
  ArrowRight,
  Check,
  Sliders,
  AlertCircle,
  Database,
  Search,
  BookOpen,
  Info,
  ShieldCheck,
  Clock,
  DollarSign,
  Percent,
  Layers
} from 'lucide-react';
import { Dataset, ColumnSchema, DataType } from '../../types/dashboard';
import { DataEngine } from '../../services/dataEngine';

interface DataTypeFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset;
  initialColumnName?: string;
  onUpdateDataset?: (updatedDataset: Dataset) => void;
  onConvertColumn?: (
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
  ) => void;
}

export const DataTypeFormatModal: React.FC<DataTypeFormatModalProps> = ({
  isOpen,
  onClose,
  dataset,
  initialColumnName,
  onUpdateDataset,
  onConvertColumn
}) => {
  const [selectedCol, setSelectedCol] = useState<string>('');
  const [columnSearch, setColumnSearch] = useState<string>('');
  const [targetType, setTargetType] = useState<DataType>('date');
  const [selectedFormat, setSelectedFormat] = useState<string>('YYYY-MM-DD');
  const [sourceInterpretation, setSourceInterpretation] = useState<string>('auto');
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [decimalPlaces, setDecimalPlaces] = useState<number>(2);
  const [thousandSeparator, setThousandSeparator] = useState<string>(',');
  const [fallbackMode, setFallbackMode] = useState<'keep' | 'null' | 'default'>('keep');
  const [mutateRows, setMutateRows] = useState<boolean>(true);
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Diagnostic Audit: Inspect all columns for misidentified data types
  const detectedAnomalies = useMemo(() => {
    if (!isOpen || !dataset) return [];
    return DataEngine.inspectDatasetTypes(dataset);
  }, [isOpen, dataset]);

  // Set default selected column when opened
  useEffect(() => {
    if (isOpen && dataset.columns.length > 0) {
      if (initialColumnName && dataset.columns.some((c) => c.name === initialColumnName)) {
        setSelectedCol(initialColumnName);
      } else if (detectedAnomalies.length > 0) {
        // Auto-select first detected anomaly
        setSelectedCol(detectedAnomalies[0].columnName);
      } else {
        // Find candidate column: contains date/time/created or first column
        const dateCand = dataset.columns.find((c) => {
          const lower = c.name.toLowerCase();
          return lower.includes('date') || lower.includes('time') || lower.includes('created') || lower.includes('order');
        });
        setSelectedCol(dateCand?.name || dataset.columns[0].name);
      }
    }
  }, [isOpen, initialColumnName, dataset, detectedAnomalies]);

  const activeColumn = useMemo(() => {
    return dataset.columns.find((c) => c.name === selectedCol);
  }, [dataset, selectedCol]);

  // Sample values from dataset for this column (up to 12 rows for comprehensive verification)
  const sampleValues = useMemo(() => {
    if (!selectedCol || !dataset.data) return [];
    return dataset.data.slice(0, 10).map((r) => r[selectedCol]);
  }, [dataset, selectedCol]);

  // Detected type if it's numeric dates
  const detectedDateType = useMemo(() => {
    return DataEngine.detectNumericDateType(sampleValues);
  }, [sampleValues]);

  // Auto-fill configuration when column changes
  useEffect(() => {
    if (activeColumn) {
      const anomaly = detectedAnomalies.find((a) => a.columnName === activeColumn.name);
      if (anomaly) {
        setTargetType(anomaly.suggestedType);
        if (anomaly.suggestedType === 'date') {
          setSelectedFormat(anomaly.autoFixOptions.dateFormat || 'YYYY-MM-DD');
          setSourceInterpretation(anomaly.autoFixOptions.sourceDataType || 'auto');
        } else if (anomaly.suggestedType === 'number') {
          setSelectedFormat(anomaly.suggestedFormat || 'decimal');
        }
      } else if (activeColumn.type === 'date' || activeColumn.format === 'date' || detectedDateType !== 'none') {
        setTargetType('date');
        setSelectedFormat(activeColumn.dateFormat || 'YYYY-MM-DD');
        setSourceInterpretation(activeColumn.sourceDataType || (detectedDateType !== 'none' ? detectedDateType : 'auto'));
      } else if (activeColumn.type === 'number') {
        setTargetType('number');
        setSelectedFormat(activeColumn.format || activeColumn.numberFormat || 'decimal');
        setCurrencySymbol(activeColumn.currencySymbol || '$');
        setDecimalPlaces(activeColumn.decimalPlaces !== undefined ? activeColumn.decimalPlaces : 2);
      } else if (activeColumn.type === 'boolean') {
        setTargetType('boolean');
        setSelectedFormat('yes_no');
      } else {
        setTargetType('string');
        setSelectedFormat(activeColumn.format || 'none');
      }
    }
  }, [activeColumn, detectedDateType, detectedAnomalies]);

  // Filtered columns based on search
  const filteredColumns = useMemo(() => {
    if (!columnSearch.trim()) return dataset.columns;
    const term = columnSearch.toLowerCase();
    return dataset.columns.filter((c) => c.name.toLowerCase().includes(term));
  }, [dataset.columns, columnSearch]);

  if (!isOpen) return null;

  // Calculate live preview transformation for each sample value
  const previewRows = sampleValues.map((val) => {
    let parsedInternal = '';
    let convertedStr = '';
    let isValid = true;
    let errorMessage = '';

    if (targetType === 'date') {
      const parsed = DataEngine.parseAnyDate(val, sourceInterpretation);
      if (parsed) {
        parsedInternal = parsed.toISOString().split('T')[0];
        convertedStr = DataEngine.formatDate(parsed, selectedFormat);
      } else {
        convertedStr = String(val ?? '');
        isValid = false;
        errorMessage = `Value '${val}' could not be parsed as a calendar date`;
      }
    } else if (targetType === 'number') {
      const n = DataEngine.parseNumericString(val);
      if (n === null || isNaN(n)) {
        convertedStr = 'NaN';
        isValid = false;
        errorMessage = `Value '${val}' is not a valid number`;
      } else {
        parsedInternal = String(n);
        const dummySchema: ColumnSchema = {
          name: selectedCol,
          type: 'number',
          category: 'measure',
          format: selectedFormat,
          numberFormat: selectedFormat,
          currencySymbol,
          decimalPlaces,
          thousandSeparator,
          nullable: false,
          uniqueCount: 1
        };
        convertedStr = DataEngine.formatValue(n, dummySchema);
      }
    } else if (targetType === 'boolean') {
      const s = String(val ?? '').toLowerCase().trim();
      const b = s === 'true' || s === 'yes' || s === '1' || s === 'y';
      parsedInternal = String(b);
      convertedStr = b ? 'Yes (True)' : 'No (False)';
    } else {
      parsedInternal = String(val ?? '');
      if (selectedFormat === 'uppercase') convertedStr = String(val ?? '').toUpperCase();
      else if (selectedFormat === 'lowercase') convertedStr = String(val ?? '').toLowerCase();
      else if (selectedFormat === 'capitalize') {
        const s = String(val ?? '');
        convertedStr = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      } else convertedStr = String(val ?? '');
    }

    return {
      raw: val,
      parsedInternal,
      converted: convertedStr,
      isValid,
      errorMessage
    };
  });

  const validCount = previewRows.filter((r) => r.isValid).length;

  // Apply conversion to the current selected column
  const handleApplySingle = () => {
    if (!selectedCol) return;

    const conversionOptions = {
      format: selectedFormat,
      dateFormat: targetType === 'date' ? selectedFormat : undefined,
      numberFormat: targetType === 'number' ? selectedFormat : undefined,
      currencySymbol: targetType === 'number' ? currencySymbol : undefined,
      decimalPlaces: targetType === 'number' ? decimalPlaces : undefined,
      thousandSeparator: targetType === 'number' ? thousandSeparator : undefined,
      sourceDataType: targetType === 'date' ? (sourceInterpretation as any) : undefined,
      mutateRows,
      fallbackMode
    };

    if (onConvertColumn) {
      onConvertColumn(selectedCol, targetType, conversionOptions);
    }

    if (onUpdateDataset) {
      const updatedDs = DataEngine.convertColumnDataType(
        dataset,
        selectedCol,
        targetType,
        conversionOptions
      );
      onUpdateDataset(updatedDs);
    }

    setSuccessMessage(`Column "${selectedCol}" successfully converted to ${targetType.toUpperCase()}!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // 1-Click Auto-Fix All Detected Anomalies
  const handleAutoFixAll = () => {
    if (detectedAnomalies.length === 0) return;

    const allConversions = detectedAnomalies.map((anomaly) => ({
      columnName: anomaly.columnName,
      targetType: anomaly.suggestedType,
      options: {
        format: anomaly.suggestedFormat || (anomaly.suggestedType === 'date' ? 'YYYY-MM-DD' : 'decimal'),
        dateFormat: anomaly.autoFixOptions.dateFormat,
        numberFormat: anomaly.autoFixOptions.numberFormat,
        sourceDataType: anomaly.autoFixOptions.sourceDataType,
        mutateRows: true,
        fallbackMode: 'keep' as const
      }
    }));

    if (onUpdateDataset) {
      const updatedDs = DataEngine.batchConvertDatasetTypes(dataset, allConversions);
      onUpdateDataset(updatedDs);
    } else if (onConvertColumn) {
      for (const item of allConversions) {
        onConvertColumn(item.columnName, item.targetType, item.options);
      }
    }

    setSuccessMessage(`⚡ All ${detectedAnomalies.length} detected columns were successfully converted!`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-sans">
      <div className="bg-[#0f131c] border border-[#1e293b] rounded-[10px] w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-[#1e293b] bg-[#111827] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#3b82f6]/20 border border-[#3b82f6]/40 rounded-[6px]">
              <Sliders className="w-5 h-5 text-[#60a5fa]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-[#f8fafc]">
                  Data Type & Format Engine
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#3b82f6]/20 text-[#93c5fd] border border-[#3b82f6]/30">
                  Universal Transformer
                </span>
                {detectedAnomalies.length > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {detectedAnomalies.length} Fixes Available
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8c909f]">
                Fix numeric dates (Excel serials, Unix timestamps), convert string numbers, adjust currency symbols, and customize display patterns.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelpGuide(!showHelpGuide)}
              className={`px-2.5 py-1.5 rounded-[4px] border text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                showHelpGuide
                  ? 'bg-[#f59e0b]/20 border-[#f59e0b]/40 text-[#fbbf24]'
                  : 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Engine Guide</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-[#1e293b] text-[#8c909f] hover:text-[#f8fafc] rounded-[4px] transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Quality Audit Notice Banner */}
        {detectedAnomalies.length > 0 && (
          <div className="px-5 py-2.5 bg-gradient-to-r from-[#1e1b4b]/80 via-[#172554]/80 to-[#1e1b4b]/80 border-b border-[#3b82f6]/30 flex items-center justify-between flex-wrap gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-[#3b82f6]/30 rounded text-[#38bdf8]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-[#f8fafc]">
                  Automatic Anomaly Detection:
                </span>{' '}
                <span className="text-[#cbd5e1]">
                  Found {detectedAnomalies.length} column{detectedAnomalies.length > 1 ? 's' : ''} with misidentified data types (e.g. numeric dates, strings formatted as currency).
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {detectedAnomalies.slice(0, 3).map((a) => (
                  <button
                    key={a.columnName}
                    type="button"
                    onClick={() => setSelectedCol(a.columnName)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                      selectedCol === a.columnName
                        ? 'bg-[#3b82f6] text-white border-transparent font-semibold'
                        : 'bg-[#1e293b] text-[#93c5fd] border-[#334155] hover:border-[#60a5fa]'
                    }`}
                  >
                    {a.columnName} → {a.suggestedType.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAutoFixAll}
                className="px-3 py-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-[11px] rounded-[4px] shadow-sm flex items-center gap-1 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Fix All Automatically</span>
              </button>
            </div>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="px-5 py-2 bg-[#10b981]/20 border-b border-[#10b981]/40 flex items-center gap-2 text-[12px] text-[#4edea3] animate-in fade-in">
            <Check className="w-4 h-4 text-[#34d399]" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Expandable Help & Documentation Drawer */}
        {showHelpGuide && (
          <div className="px-5 py-3.5 bg-[#111827] border-b border-[#1e293b] text-[11px] text-[#cbd5e1] animate-in slide-in-from-top-2">
            <div className="flex items-start justify-between mb-2">
              <span className="font-bold text-[#f8fafc] text-[12px] flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#60a5fa]" />
                <span>Data Type Engine Documentation & Conversion Rules</span>
              </span>
              <button
                type="button"
                onClick={() => setShowHelpGuide(false)}
                className="text-[#64748b] hover:text-[#f8fafc]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10.5px] leading-relaxed">
              <div className="bg-[#0b0f17] p-3 rounded-[6px] border border-[#1e293b]">
                <div className="font-semibold text-[#60a5fa] mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Excel Dates & Unix Timestamps</span>
                </div>
                <p className="text-[#94a3b8]">
                  Excel stores dates as day serial counts since Dec 30, 1899 (e.g. <code>45350 = 2024-02-28</code>). Unix stores seconds (<code>~1.7e9</code>) or milliseconds (<code>~1.7e12</code>). The engine automatically computes the exact calendar date across leap years and timezones.
                </p>
              </div>

              <div className="bg-[#0b0f17] p-3 rounded-[6px] border border-[#1e293b]">
                <div className="font-semibold text-[#38bdf8] mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" />
                  <span>Currency & Numeric Stripping</span>
                </div>
                <p className="text-[#94a3b8]">
                  Text values containing formatted symbols like <code>$1,250.00</code> or <code>45.2%</code> are cleaned into floating-point numbers. Converting them to <strong>Measure</strong> enables mathematical aggregation (SUM, AVG, MIN, MAX) across charts.
                </p>
              </div>

              <div className="bg-[#0b0f17] p-3 rounded-[6px] border border-[#1e293b]">
                <div className="font-semibold text-[#4ade80] mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Data Integrity & Fallback Policy</span>
                </div>
                <p className="text-[#94a3b8]">
                  Before applying changes, inspect the live transformation table below. If a row contains unparseable data (e.g. <code>"N/A"</code>), the fallback policy allows you to keep original values, set them to null, or substitute defaults safely.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Section 1: Column Picker with Search & Schema Badges */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#8c909f] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span>Select Column to Transform</span>
              </label>

              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={columnSearch}
                  onChange={(e) => setColumnSearch(e.target.value)}
                  placeholder="Filter columns..."
                  className="w-full h-7 pl-8 pr-2.5 bg-[#141923] border border-[#334155] rounded text-[11px] text-[#f8fafc] outline-none focus:border-[#3b82f6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-[#0b0f17] border border-[#1e293b] rounded-[6px]">
              {filteredColumns.map((col) => {
                const isSelected = col.name === selectedCol;
                const anomaly = detectedAnomalies.find((a) => a.columnName === col.name);

                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => setSelectedCol(col.name)}
                    className={`p-2 rounded-[4px] border text-left transition-all relative ${
                      isSelected
                        ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#f8fafc] shadow-sm'
                        : 'bg-[#111827] border-[#1e293b] text-[#cbd5e1] hover:border-[#334155]'
                    }`}
                  >
                    {anomaly && (
                      <span
                        className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#f59e0b]"
                        title={anomaly.reason}
                      />
                    )}
                    <div className="font-semibold text-[11px] truncate" title={col.name}>
                      {col.name}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[9px] font-mono uppercase px-1 py-0.2 bg-[#0b0f17] rounded text-[#8c909f]">
                        {col.type}
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1 py-0.2 bg-[#0b0f17] rounded text-[#38bdf8]">
                        {col.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anomaly Callout for Selected Column if Detected */}
          {activeColumn && detectedAnomalies.some((a) => a.columnName === activeColumn.name) && (
            <div className="p-3 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-[6px] flex items-start justify-between gap-3 text-[11px] text-[#fbbf24]">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#f59e0b] mt-0.5" />
                <div>
                  <div className="font-semibold">
                    Detected Type Mismatch for Column "{activeColumn.name}":
                  </div>
                  <div className="text-[#cbd5e1] text-[10.5px] mt-0.5">
                    {detectedAnomalies.find((a) => a.columnName === activeColumn.name)?.reason}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const a = detectedAnomalies.find((item) => item.columnName === activeColumn.name);
                  if (a) {
                    setTargetType(a.suggestedType);
                    if (a.autoFixOptions.dateFormat) setSelectedFormat(a.autoFixOptions.dateFormat);
                    if (a.autoFixOptions.sourceDataType) setSourceInterpretation(a.autoFixOptions.sourceDataType);
                    if (a.autoFixOptions.numberFormat) setSelectedFormat(a.autoFixOptions.numberFormat);
                  }
                }}
                className="px-2.5 py-1 bg-[#f59e0b] hover:bg-[#d97706] text-black font-semibold rounded text-[10px] whitespace-nowrap transition-colors"
              >
                Auto-Configure Settings
              </button>
            </div>
          )}

          {/* Section 2: Target Type Selector */}
          <div className="bg-[#111827] border border-[#1e293b] rounded-[8px] p-4 space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#8c909f] mb-2">
                Select Target Data Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'date', label: 'Date / Calendar', icon: Calendar, desc: 'ISO, US, International, Excel serials' },
                  { id: 'number', label: 'Number / Measure', icon: Hash, desc: 'Currency, %, Decimals, Compact' },
                  { id: 'string', label: 'Text / Dimension', icon: Type, desc: 'Labels, Categories, Case format' },
                  { id: 'boolean', label: 'Boolean / Flag', icon: CheckSquare, desc: 'True/False, Yes/No flags' }
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = targetType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTargetType(t.id as DataType);
                        if (t.id === 'date') setSelectedFormat('YYYY-MM-DD');
                        else if (t.id === 'number') setSelectedFormat('decimal');
                        else if (t.id === 'string') setSelectedFormat('none');
                        else setSelectedFormat('yes_no');
                      }}
                      className={`p-3 rounded-[6px] border text-left transition-all ${
                        isSelected
                          ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#f8fafc] shadow-sm ring-1 ring-[#3b82f6]'
                          : 'bg-[#141923] border-[#1e293b] text-[#94a3b8] hover:border-[#334155]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 font-semibold text-[12px]">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-[#60a5fa]' : 'text-[#64748b]'}`} />
                        <span>{t.label}</span>
                      </div>
                      <div className="text-[10px] text-[#64748b] leading-tight">{t.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Detailed Formatting Controls by Target Type */}
            {targetType === 'date' && (
              <div className="pt-3 border-t border-[#1e293b] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] font-mono text-[#8c909f] uppercase mb-1 flex items-center justify-between">
                    <span>Input Interpretation</span>
                    {detectedDateType !== 'none' && (
                      <span className="text-[#34d399] text-[9px] font-semibold">
                        ⚡ Detected: {detectedDateType.toUpperCase()}
                      </span>
                    )}
                  </label>
                  <select
                    value={sourceInterpretation}
                    onChange={(e) => setSourceInterpretation(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[#141923] border border-[#334155] rounded-[4px] text-[#f8fafc] text-[11px] outline-none focus:border-[#3b82f6]"
                  >
                    <option value="auto">Auto-Detect (Excel / Unix / YYYYMMDD / ISO)</option>
                    <option value="excel_serial">Excel Serial Number (e.g. 45350 = Feb 28, 2024)</option>
                    <option value="unix_sec">Unix Timestamp in Seconds (e.g. 1704067200)</option>
                    <option value="unix_ms">Unix Timestamp in Milliseconds (e.g. 1704067200000)</option>
                    <option value="yyyymmdd">Integer Date YYYYMMDD (e.g. 20250115)</option>
                    <option value="DD/MM/YYYY">International String (DD/MM/YYYY or DD-MM-YYYY)</option>
                    <option value="MM/DD/YYYY">US String (MM/DD/YYYY or MM-DD-YYYY)</option>
                    <option value="iso_string">Standard ISO String (YYYY-MM-DD)</option>
                  </select>
                  <p className="text-[9.5px] text-[#64748b] mt-1">
                    Select how raw numbers or text in this column should be decoded into a calendar date.
                  </p>
                </div>

                <div>
                  <label className="block text-[10.5px] font-mono text-[#8c909f] uppercase mb-1">
                    Display Format Pattern
                  </label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[#141923] border border-[#334155] rounded-[4px] text-[#f8fafc] text-[11px] outline-none focus:border-[#3b82f6]"
                  >
                    <option value="YYYY-MM-DD">ISO Standard (YYYY-MM-DD) • 2025-01-15</option>
                    <option value="MM/DD/YYYY">US Standard (MM/DD/YYYY) • 01/15/2025</option>
                    <option value="DD/MM/YYYY">International Standard (DD/MM/YYYY) • 15/01/2025</option>
                    <option value="DD-MM-YYYY">Hyphenated International (DD-MM-YYYY) • 15-01-2025</option>
                    <option value="MM-DD-YYYY">Hyphenated US (MM-DD-YYYY) • 01-15-2025</option>
                    <option value="YYYY/MM/DD">Slash ISO (YYYY/MM/DD) • 2025/01/15</option>
                    <option value="MMM DD, YYYY">Medium Date (MMM DD, YYYY) • Jan 15, 2025</option>
                    <option value="MMMM DD, YYYY">Long Month (MMMM DD, YYYY) • January 15, 2025</option>
                    <option value="MMM YYYY">Month & Year (MMM YYYY) • Jan 2025</option>
                    <option value="YYYY-Q#">Fiscal Quarter (YYYY-Q#) • 2025-Q1</option>
                    <option value="YYYY-MM-DD HH:mm">Timestamp (YYYY-MM-DD HH:mm)</option>
                  </select>
                  <p className="text-[9.5px] text-[#64748b] mt-1">
                    Determines how the date will appear in table cells, chart axes, and tooltips.
                  </p>
                </div>
              </div>
            )}

            {targetType === 'number' && (
              <div className="pt-3 border-t border-[#1e293b] space-y-3">
                <div>
                  <label className="block text-[10.5px] font-mono text-[#8c909f] uppercase mb-1">
                    Number Format Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'currency', label: 'Currency', sample: '$12,450.00' },
                      { id: 'percent', label: 'Percentage', sample: '48.5%' },
                      { id: 'decimal', label: 'Standard Decimal', sample: '1,234.50' },
                      { id: 'integer', label: 'Whole Integer', sample: '1,235' },
                      { id: 'compact', label: 'Compact Units', sample: '1.2M / 450K' }
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={`p-2 rounded-[4px] border text-left transition-colors ${
                          selectedFormat === fmt.id
                            ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#f8fafc]'
                            : 'bg-[#141923] border-[#1e293b] text-[#94a3b8] hover:border-[#334155]'
                        }`}
                      >
                        <div className="font-semibold text-[11px]">{fmt.label}</div>
                        <div className="text-[10px] font-mono text-[#38bdf8]">{fmt.sample}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedFormat === 'currency' && (
                    <div>
                      <label className="block text-[10px] font-mono text-[#8c909f] uppercase mb-1">
                        Currency Symbol
                      </label>
                      <select
                        value={currencySymbol}
                        onChange={(e) => setCurrencySymbol(e.target.value)}
                        className="w-full h-8 px-2 bg-[#141923] border border-[#334155] rounded text-[11px] text-[#f8fafc] outline-none"
                      >
                        <option value="$">$ (USD / CAD / AUD)</option>
                        <option value="€">€ (Euro)</option>
                        <option value="£">£ (British Pound)</option>
                        <option value="¥">¥ (Japanese Yen / Yuan)</option>
                        <option value="₹">₹ (Indian Rupee)</option>
                        <option value="CHF">CHF (Swiss Franc)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-mono text-[#8c909f] uppercase mb-1">
                      Decimal Places
                    </label>
                    <select
                      value={decimalPlaces}
                      onChange={(e) => setDecimalPlaces(parseInt(e.target.value, 10))}
                      className="w-full h-8 px-2 bg-[#141923] border border-[#334155] rounded text-[11px] text-[#f8fafc] outline-none"
                    >
                      <option value="0">0 (e.g. 1,234)</option>
                      <option value="1">1 (e.g. 1,234.5)</option>
                      <option value="2">2 (e.g. 1,234.50)</option>
                      <option value="3">3 (e.g. 1,234.500)</option>
                      <option value="4">4 (e.g. 1,234.5000)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#8c909f] uppercase mb-1">
                      Thousand Separator
                    </label>
                    <select
                      value={thousandSeparator}
                      onChange={(e) => setThousandSeparator(e.target.value)}
                      className="w-full h-8 px-2 bg-[#141923] border border-[#334155] rounded text-[11px] text-[#f8fafc] outline-none"
                    >
                      <option value=",">Comma (1,000,000)</option>
                      <option value=".">Dot (1.000.000)</option>
                      <option value=" ">Space (1 000 000)</option>
                      <option value="">None (1000000)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {targetType === 'string' && (
              <div className="pt-3 border-t border-[#1e293b]">
                <label className="block text-[10.5px] font-mono text-[#8c909f] uppercase mb-1">
                  Text Case Transformation
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'none', label: 'Original Text' },
                    { id: 'uppercase', label: 'UPPERCASE' },
                    { id: 'lowercase', label: 'lowercase' },
                    { id: 'capitalize', label: 'Title Case' }
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={`p-2 rounded-[4px] border text-center font-mono text-[11px] transition-colors ${
                        selectedFormat === fmt.id
                          ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#f8fafc]'
                          : 'bg-[#141923] border-[#1e293b] text-[#94a3b8] hover:border-[#334155]'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Row Mutation & Fallback Options */}
            <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mutateRows}
                    onChange={(e) => setMutateRows(e.target.checked)}
                    className="rounded border-[#334155] bg-[#0b0f17] text-[#3b82f6] focus:ring-0"
                  />
                  <span className="font-medium text-[#f8fafc] text-[11px]">
                    Mutate & Convert Raw Data Rows ({dataset.data.length.toLocaleString()} rows)
                  </span>
                </label>

                <div className="h-4 w-px bg-[#334155]" />

                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-[#8c909f]">If conversion fails:</span>
                  <select
                    value={fallbackMode}
                    onChange={(e) => setFallbackMode(e.target.value as any)}
                    className="h-7 px-2 bg-[#141923] border border-[#334155] rounded text-[#cbd5e1] text-[10px] outline-none"
                  >
                    <option value="keep">Keep original value</option>
                    <option value="null">Set to null / empty</option>
                    <option value="default">Substitute default</option>
                  </select>
                </div>
              </div>

              <span className="text-[10px] font-mono text-[#34d399] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Non-destructive preview</span>
              </span>
            </div>
          </div>

          {/* Section 4: Live Before & After Transformation Preview Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c909f] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span>Live Transformation Preview (Sample First {previewRows.length} Rows)</span>
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    validCount === previewRows.length
                      ? 'bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30'
                      : 'bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/30'
                  }`}
                >
                  {validCount} / {previewRows.length} rows valid ({Math.round((validCount / Math.max(1, previewRows.length)) * 100)}% conversion rate)
                </span>
              </div>
            </div>

            <div className="border border-[#1e293b] rounded-[6px] overflow-hidden bg-[#0b0f17]">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="bg-[#111827] border-b border-[#1e293b] text-[#64748b] text-[10px] uppercase">
                    <th className="py-2 px-3 w-10">#</th>
                    <th className="py-2 px-3">Raw Value (Before)</th>
                    <th className="py-2 px-3">Parsed Internal</th>
                    <th className="py-2 px-3 w-6"></th>
                    <th className="py-2 px-3">Transformed Output (After)</th>
                    <th className="py-2 px-3 text-right">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181c24]">
                  {previewRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-[#141923] transition-colors">
                      <td className="py-2 px-3 text-[#64748b]">{idx + 1}</td>
                      <td className="py-2 px-3 text-[#fca5a5] font-medium truncate max-w-xs">
                        {String(r.raw ?? 'null')}
                      </td>
                      <td className="py-2 px-3 text-[#94a3b8] font-mono text-[10px] truncate max-w-xs">
                        {r.parsedInternal || '—'}
                      </td>
                      <td className="py-2 px-3 text-[#64748b]">
                        <ArrowRight className="w-3 h-3 text-[#60a5fa]" />
                      </td>
                      <td className="py-2 px-3 text-[#4ade80] font-bold truncate max-w-xs">
                        {r.converted}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {r.isValid ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30">
                            Valid
                          </span>
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded text-[9px] font-semibold bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/30"
                            title={r.errorMessage}
                          >
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#1e293b] bg-[#111827] flex items-center justify-between">
          <div className="text-[11px] text-[#64748b] flex items-center gap-2 font-mono">
            <Database className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>Target Column: <strong>{selectedCol || 'None'}</strong></span>
            <span>•</span>
            <span>Target Type: <strong>{targetType.toUpperCase()}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-[#dfe2ee] rounded-[4px] text-[12px] font-medium transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleApplySingle}
              className="px-4 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-[4px] text-[12px] font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Transformation to "{selectedCol}"</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
