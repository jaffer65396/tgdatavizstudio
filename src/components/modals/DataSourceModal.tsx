import React, { useState } from 'react';
import {
  X,
  Upload,
  Database,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Table,
  Server,
  Globe,
  RefreshCw,
  ClipboardPaste,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  Check,
  Trash2,
  FileText
} from 'lucide-react';
import { Dataset } from '../../types/dashboard';
import { DataEngine } from '../../services/dataEngine';
import {
  generateSalesDataset,
  generateSaaSDataset,
  generateEcommerceDataset,
  generateMarketingDataset
} from '../../data/sampleDatasets';

interface DataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasets: Dataset[];
  activeDatasetId: string;
  onSelectDataset: (id: string) => void;
  onAddDataset: (dataset: Dataset, autoGenerateWidgets?: boolean) => void;
  onDeleteDataset?: (id: string) => void;
  initialTab?: 'upload' | 'paste' | 'starter' | 'url' | 'database' | 'datasets';
}

export const DataSourceModal: React.FC<DataSourceModalProps> = ({
  isOpen,
  onClose,
  datasets,
  activeDatasetId,
  onSelectDataset,
  onAddDataset,
  onDeleteDataset,
  initialTab = 'upload'
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'starter' | 'url' | 'database' | 'datasets'>(initialTab);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Ingestion options
  const [autoGenerateWidgets, setAutoGenerateWidgets] = useState(true);
  const [setAsActive, setSetAsActive] = useState(true);
  const [customName, setCustomName] = useState('');

  // Tab 1: Upload preview
  const [stagedDataset, setStagedDataset] = useState<Dataset | null>(null);

  // Tab 2: Paste data state
  const [pasteText, setPasteText] = useState('');
  const [pasteDelimiter, setPasteDelimiter] = useState<string>('Auto-detect');

  // Tab 3: URL fetch state
  const [importUrl, setImportUrl] = useState('');

  // Tab 4: DB Form state
  const [dbType, setDbType] = useState('PostgreSQL');
  const [connName, setConnName] = useState('Production Analytics Store');
  const [host, setHost] = useState('db.us-east-1.cloud.internal');
  const [port, setPort] = useState('5432');
  const [dbName, setDbName] = useState('sales_warehouse');
  const [user, setUser] = useState('analyst_user');
  const [testingConn, setTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  // Active dataset preview
  const [previewDatasetId, setPreviewDatasetId] = useState<string>(activeDatasetId || datasets[0]?.id || '');

  if (!isOpen) return null;

  const currentDataset = datasets.find((d) => d.id === previewDatasetId) || datasets[0];

  // Helper to commit parsed dataset
  const commitImport = (datasetToImport: Dataset) => {
    const finalDataset: Dataset = {
      ...datasetToImport,
      name: customName.trim() || datasetToImport.name,
      id: `ds-${Date.now()}`
    };

    onAddDataset(finalDataset, autoGenerateWidgets);

    if (setAsActive) {
      onSelectDataset(finalDataset.id);
    }

    setSuccessMessage(`Successfully imported "${finalDataset.name}" (${finalDataset.rowCount.toLocaleString()} rows, ${finalDataset.columns.length} columns)`);
    setStagedDataset(null);
    setCustomName('');
    setPasteText('');

    setTimeout(() => {
      onClose();
      setSuccessMessage(null);
    }, 900);
  };

  // 1. File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const parsed = await DataEngine.parseFile(file);
      setStagedDataset(parsed);
      setCustomName(parsed.name);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Paste Parser Handler
  const handleParsePastedText = () => {
    if (!pasteText.trim()) {
      setErrorMessage('Please paste spreadsheet data, CSV, or JSON first.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const name = customName.trim() || 'Pasted Table Data';
      const parsed = DataEngine.parseText(pasteText, name);
      setStagedDataset(parsed);
      setCustomName(parsed.name);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse pasted data.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Remote URL Handler
  const handleFetchUrl = async () => {
    if (!importUrl.trim()) {
      setErrorMessage('Please enter a URL.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const parsed = await DataEngine.parseUrl(importUrl, customName || undefined);
      setStagedDataset(parsed);
      setCustomName(parsed.name);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch or parse from URL.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Starter Datasets Loader
  const handleLoadStarter = (type: 'sales' | 'saas' | 'ecommerce' | 'marketing') => {
    let ds: Dataset;
    if (type === 'sales') ds = generateSalesDataset();
    else if (type === 'saas') ds = generateSaaSDataset();
    else if (type === 'ecommerce') ds = generateEcommerceDataset();
    else ds = generateMarketingDataset();

    setStagedDataset(ds);
    setCustomName(ds.name);
  };

  // 5. Database Connection Test
  const handleTestConnection = () => {
    setTestingConn(true);
    setConnStatus('idle');
    setTimeout(() => {
      setTestingConn(false);
      setConnStatus('success');
    }, 700);
  };

  const handleSaveConnection = () => {
    const newDs: Dataset = {
      id: `ds-${Date.now()}`,
      name: `${connName} (${dbType})`,
      sourceType: dbType.toLowerCase() as any,
      rowCount: 854200,
      lastRefreshed: 'Just now',
      columns: [
        { name: 'order_id', type: 'string', category: 'dimension', nullable: false, uniqueCount: 854200 },
        { name: 'customer_region', type: 'string', category: 'dimension', nullable: false, uniqueCount: 8 },
        { name: 'order_date', type: 'date', category: 'time', nullable: false, uniqueCount: 420 },
        { name: 'gross_amount', type: 'number', category: 'measure', format: 'currency', nullable: false, uniqueCount: 42000 },
        { name: 'margin_pct', type: 'number', category: 'measure', format: 'percent', nullable: false, uniqueCount: 95 }
      ],
      data: [
        { order_id: 'ORD-98214', customer_region: 'North America', order_date: '2026-03-01', gross_amount: 14200, margin_pct: 64.2 },
        { order_id: 'ORD-98215', customer_region: 'EMEA', order_date: '2026-03-01', gross_amount: 8900, margin_pct: 58.7 },
        { order_id: 'ORD-98216', customer_region: 'Asia Pacific', order_date: '2026-03-02', gross_amount: 22100, margin_pct: 71.3 },
        { order_id: 'ORD-98217', customer_region: 'Latin America', order_date: '2026-03-02', gross_amount: 6400, margin_pct: 49.0 }
      ]
    };
    commitImport(newDs);
  };

  // Sample templates for Paste
  const loadPasteSample = (format: 'csv' | 'tsv' | 'json') => {
    if (format === 'csv') {
      setPasteText(`Product,Category,Region,Quarter,Revenue,UnitsSold,Satisfaction
MacBook Pro,Laptops,North America,2026-Q1,485000,240,94.5
Dell XPS,Laptops,EMEA,2026-Q1,312000,195,91.2
Studio Display,Monitors,North America,2026-Q1,189000,120,89.0
Sony WH-1000XM5,Audio,Asia Pacific,2026-Q1,142000,380,96.0
iPad Pro,Tablets,EMEA,2026-Q1,268000,310,93.4
Logitech MX Master,Accessories,North America,2026-Q1,84000,840,98.2`);
      setCustomName('Electronics Product Performance');
    } else if (format === 'tsv') {
      setPasteText(`Country\tChannel\tSignups\tCost\tConversionRate
United States\tGoogle Search\t1420\t8900\t14.8
Germany\tLinkedIn Ads\t890\t12400\t22.4
United Kingdom\tOrganic SEO\t2450\t1800\t18.2
Japan\tYouTube Video\t670\t4500\t11.5
Canada\tMeta Instagram\t1120\t6200\t16.3
Australia\tDirect Referral\t540\t900\t26.0`);
      setCustomName('International Acquisition Channels');
    } else {
      setPasteText(`[
  {"Team": "Frontend Core", "Sprint": "Sprint 42", "StoryPoints": 68, "Velocity": 94.2, "BugsReported": 4},
  {"Team": "Backend Data", "Sprint": "Sprint 42", "StoryPoints": 82, "Velocity": 88.5, "BugsReported": 6},
  {"Team": "AI & Modeling", "Sprint": "Sprint 42", "StoryPoints": 54, "Velocity": 97.0, "BugsReported": 2},
  {"Team": "Mobile Apps", "Sprint": "Sprint 42", "StoryPoints": 61, "Velocity": 91.8, "BugsReported": 5}
]`);
      setCustomName('Engineering Sprint Metrics');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[3px] p-4">
      <div className="w-full max-w-4xl bg-[#10141e] border border-[#1e293b] rounded-[8px] shadow-2xl flex flex-col overflow-hidden max-h-[88vh] text-[#dfe2ee]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1e293b] bg-[#0c0f17]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-[4px] bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center">
              <Upload className="w-3.5 h-3.5 text-[#4edea3]" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[#f8fafc] leading-tight">
                Import Data & Source Library
              </h2>
              <p className="text-[11px] text-[#8c909f]">
                Ingest CSV, Excel, Google Sheets, JSON, API feeds, or databases with automatic type inference.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee] rounded-[4px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-[#1e293b] bg-[#090d15] text-[12px] overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('upload');
              setStagedDataset(null);
            }}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-[#10b981] text-[#4edea3] bg-[#10b981]/5'
                : 'border-transparent text-[#8c909f] hover:text-[#dfe2ee]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Upload File (CSV / XLSX / JSON)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('paste');
              setStagedDataset(null);
            }}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'paste'
                ? 'border-[#10b981] text-[#4edea3] bg-[#10b981]/5'
                : 'border-transparent text-[#8c909f] hover:text-[#dfe2ee]'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Copy & Paste Spreadsheet</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('starter');
              setStagedDataset(null);
            }}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'starter'
                ? 'border-[#10b981] text-[#4edea3] bg-[#10b981]/5'
                : 'border-transparent text-[#8c909f] hover:text-[#dfe2ee]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#adc6ff]" />
            <span>1-Click Sample Datasets</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('url');
              setStagedDataset(null);
            }}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'url'
                ? 'border-[#10b981] text-[#4edea3] bg-[#10b981]/5'
                : 'border-transparent text-[#8c909f] hover:text-[#dfe2ee]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web URL / API</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('database');
              setStagedDataset(null);
            }}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'database'
                ? 'border-[#10b981] text-[#4edea3] bg-[#10b981]/5'
                : 'border-transparent text-[#8c909f] hover:text-[#dfe2ee]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Database</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('datasets');
              setStagedDataset(null);
            }}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ml-auto ${
              activeTab === 'datasets'
                ? 'border-[#3b82f6] text-[#adc6ff] bg-[#3b82f6]/5'
                : 'border-transparent text-[#8c909f] hover:text-[#dfe2ee]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Active Datasets ({datasets.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 bg-[#93000a]/20 border border-[#93000a]/40 text-[#ffb4ab] text-[12px] rounded-[4px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-[#10b981]/15 border border-[#10b981]/30 text-[#4edea3] text-[12px] rounded-[4px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && !stagedDataset && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-[#1e293b] hover:border-[#10b981] rounded-[8px] p-10 flex flex-col items-center justify-center text-center transition-all bg-[#090d15] group">
                <div className="w-14 h-14 rounded-full bg-[#10b981]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7 text-[#4edea3]" />
                </div>
                <h3 className="text-[15px] font-semibold text-[#f8fafc] mb-1.5">
                  Drag and drop your spreadsheet or data file here
                </h3>
                <p className="text-[12px] text-[#8c909f] max-w-md mb-5">
                  Supports <strong className="text-[#dfe2ee]">.csv</strong>, <strong className="text-[#dfe2ee]">.xlsx</strong>, <strong className="text-[#dfe2ee]">.xls</strong>, <strong className="text-[#dfe2ee]">.tsv</strong>, and <strong className="text-[#dfe2ee]">.json</strong>. Columns, measures, and dates are recognized automatically.
                </p>

                <label className="cursor-pointer px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-[#062016] rounded-[4px] text-[13px] font-semibold transition-all shadow-[0_2px_10px_rgba(16,185,129,0.25)] flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Choose Local File</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.json,.tsv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {isProcessing && (
                <div className="flex items-center gap-2 text-[12px] text-[#4edea3] font-mono justify-center p-4">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reading schema, detecting measures, and indexing data vectors...</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Copy & Paste Data */}
          {activeTab === 'paste' && !stagedDataset && (
            <div className="space-y-4 text-[12px]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-[#f8fafc] block">
                    Paste Tabular Data Directly
                  </label>
                  <span className="text-[11px] text-[#8c909f]">
                    Copy cells from Excel, Google Sheets, or raw CSV text and paste them below:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#8c909f]">Try sample:</span>
                  <button
                    onClick={() => loadPasteSample('csv')}
                    className="px-2 py-0.5 bg-[#181c24] hover:bg-[#1e293b] border border-[#334155] rounded text-[11px] text-[#adc6ff]"
                  >
                    CSV Sample
                  </button>
                  <button
                    onClick={() => loadPasteSample('tsv')}
                    className="px-2 py-0.5 bg-[#181c24] hover:bg-[#1e293b] border border-[#334155] rounded text-[11px] text-[#adc6ff]"
                  >
                    Excel / TSV
                  </button>
                  <button
                    onClick={() => loadPasteSample('json')}
                    className="px-2 py-0.5 bg-[#181c24] hover:bg-[#1e293b] border border-[#334155] rounded text-[11px] text-[#adc6ff]"
                  >
                    JSON
                  </button>
                </div>
              </div>

              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste tab-delimited columns from Excel/Google Sheets, or comma-separated CSV text here...&#10;&#10;Region	Product	Revenue	Units&#10;North America	Cloud Compute	420000	120&#10;EMEA	Cybersecurity	310000	95"
                rows={9}
                className="w-full p-3 bg-[#090d15] border border-[#1e293b] rounded-[6px] text-[#dfe2ee] font-mono text-[11px] outline-none focus:border-[#10b981] transition-colors resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setPasteText('')}
                  className="text-[11px] text-[#8c909f] hover:text-[#dfe2ee]"
                >
                  Clear paste area
                </button>

                <button
                  onClick={handleParsePastedText}
                  disabled={!pasteText.trim() || isProcessing}
                  className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-[#062016] rounded-[4px] font-semibold text-[12px] flex items-center gap-2 transition-colors"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  <span>Parse & Preview Data</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: 1-Click Starter Datasets */}
          {activeTab === 'starter' && !stagedDataset && (
            <div className="space-y-4">
              <div className="text-[12px] text-[#8c909f]">
                Select any pre-configured analytical dataset to instantly load real multidimensional data into your workspace:
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Starter 1: Sales */}
                <div
                  onClick={() => handleLoadStarter('sales')}
                  className="p-4 bg-[#090d15] hover:bg-[#141824] border border-[#1e293b] hover:border-[#3b82f6] rounded-[6px] cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-0.5 bg-[#3b82f6]/20 text-[#adc6ff] rounded-[3px] text-[10px] font-mono font-medium">
                      ENTERPRISE OLAP
                    </span>
                    <span className="text-[11px] font-mono text-[#4edea3]">1.2M rows</span>
                  </div>
                  <h4 className="text-[13px] font-semibold text-[#f8fafc] group-hover:text-[#3b82f6] transition-colors">
                    Global Sales & Margin Trajectory
                  </h4>
                  <p className="text-[11px] text-[#8c909f] mt-1 leading-relaxed">
                    Multidimensional enterprise revenue, cost pool, blended margin %, volume, regional segments, and product categories.
                  </p>
                  <div className="mt-3 text-[11px] text-[#adc6ff] font-medium flex items-center gap-1">
                    <span>Load Dataset</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Starter 2: SaaS */}
                <div
                  onClick={() => handleLoadStarter('saas')}
                  className="p-4 bg-[#090d15] hover:bg-[#141824] border border-[#1e293b] hover:border-[#10b981] rounded-[6px] cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-0.5 bg-[#10b981]/20 text-[#4edea3] rounded-[3px] text-[10px] font-mono font-medium">
                      SUBSCRIPTIONS
                    </span>
                    <span className="text-[11px] font-mono text-[#4edea3]">Real Cohorts</span>
                  </div>
                  <h4 className="text-[13px] font-semibold text-[#f8fafc] group-hover:text-[#10b981] transition-colors">
                    SaaS ARR & Subscriber Cohorts
                  </h4>
                  <p className="text-[11px] text-[#8c909f] mt-1 leading-relaxed">
                    Monthly recurring revenue (MRR), ARR run-rate, subscriber tiers, net retention %, and customer churn analytics.
                  </p>
                  <div className="mt-3 text-[11px] text-[#4edea3] font-medium flex items-center gap-1">
                    <span>Load Dataset</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Starter 3: E-Commerce */}
                <div
                  onClick={() => handleLoadStarter('ecommerce')}
                  className="p-4 bg-[#090d15] hover:bg-[#141824] border border-[#1e293b] hover:border-[#f59e0b] rounded-[6px] cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-0.5 bg-[#f59e0b]/20 text-[#fde68a] rounded-[3px] text-[10px] font-mono font-medium">
                      RETAIL & COMMERCE
                    </span>
                    <span className="text-[11px] font-mono text-[#4edea3]">Omnichannel</span>
                  </div>
                  <h4 className="text-[13px] font-semibold text-[#f8fafc] group-hover:text-[#f59e0b] transition-colors">
                    Retail Orders & Product Profitability
                  </h4>
                  <p className="text-[11px] text-[#8c909f] mt-1 leading-relaxed">
                    Departments, sales channels (Mobile, Web, Social), gross vs net sales, shipping overhead, and net profit margins.
                  </p>
                  <div className="mt-3 text-[11px] text-[#fde68a] font-medium flex items-center gap-1">
                    <span>Load Dataset</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Starter 4: Marketing */}
                <div
                  onClick={() => handleLoadStarter('marketing')}
                  className="p-4 bg-[#090d15] hover:bg-[#141824] border border-[#1e293b] hover:border-[#8b5cf6] rounded-[6px] cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-0.5 bg-[#8b5cf6]/20 text-[#d0bcff] rounded-[3px] text-[10px] font-mono font-medium">
                      ATTRIBUTION
                    </span>
                    <span className="text-[11px] font-mono text-[#4edea3]">ROAS & Funnel</span>
                  </div>
                  <h4 className="text-[13px] font-semibold text-[#f8fafc] group-hover:text-[#8b5cf6] transition-colors">
                    Growth Marketing & ROAS Attribution
                  </h4>
                  <p className="text-[11px] text-[#8c909f] mt-1 leading-relaxed">
                    Google Ads, Meta, LinkedIn spend, impressions, clicks, cost-per-acquisition (CPA), and pipeline return on ad spend.
                  </p>
                  <div className="mt-3 text-[11px] text-[#d0bcff] font-medium flex items-center gap-1">
                    <span>Load Dataset</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: URL Fetch */}
          {activeTab === 'url' && !stagedDataset && (
            <div className="space-y-4 text-[12px]">
              <div>
                <label className="font-medium text-[#f8fafc] block mb-1">
                  Public Data URL / REST Endpoint
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://raw.githubusercontent.com/.../data.csv or https://api.example.com/data.json"
                    className="flex-1 h-9 px-3 bg-[#090d15] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] font-mono text-[12px] outline-none focus:border-[#10b981]"
                  />
                  <button
                    onClick={handleFetchUrl}
                    disabled={!importUrl.trim() || isProcessing}
                    className="px-4 h-9 bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-[#062016] rounded-[4px] font-semibold text-[12px] flex items-center gap-1.5 transition-colors"
                  >
                    {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                    <span>Fetch & Parse</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#090d15] border border-[#1e293b] rounded-[4px] text-[11px] space-y-2 text-[#8c909f]">
                <span className="font-medium text-[#dfe2ee] block">Supported Web Sources:</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Direct CSV files hosted on GitHub (raw.githubusercontent.com)</li>
                  <li>Google Sheets published to web as CSV link</li>
                  <li>JSON REST endpoints returning arrays of records</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: Database Connector */}
          {activeTab === 'database' && !stagedDataset && (
            <div className="space-y-4 text-[12px]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-[#8c909f] mb-1">
                    Database Engine
                  </label>
                  <select
                    value={dbType}
                    onChange={(e) => setDbType(e.target.value)}
                    className="w-full h-8 px-2 bg-[#090d15] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] outline-none"
                  >
                    <option value="PostgreSQL">PostgreSQL</option>
                    <option value="MySQL">MySQL</option>
                    <option value="SQLite">SQLite (Local File)</option>
                    <option value="DuckDB">DuckDB Analytics Engine</option>
                    <option value="REST_API">REST API Endpoint</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#8c909f] mb-1">
                    Connection Label
                  </label>
                  <input
                    type="text"
                    value={connName}
                    onChange={(e) => setConnName(e.target.value)}
                    className="w-full h-8 px-2 bg-[#090d15] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#8c909f] mb-1">
                    Host / Endpoint
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full h-8 px-2 bg-[#090d15] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#8c909f] mb-1">
                    Port
                  </label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full h-8 px-2 bg-[#090d15] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#8c909f] mb-1">
                    Database Name
                  </label>
                  <input
                    type="text"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    className="w-full h-8 px-2 bg-[#090d15] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#8c909f] mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className="w-full h-8 px-2 bg-[#090d15] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={testingConn}
                    className="px-3 py-1.5 bg-[#181c24] hover:bg-[#1e293b] border border-[#334155] rounded-[4px] text-[#dfe2ee] font-medium flex items-center gap-1.5"
                  >
                    {testingConn ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-[#adc6ff]" />
                    ) : (
                      <Server className="w-3 h-3 text-[#3b82f6]" />
                    )}
                    <span>{testingConn ? 'Connecting...' : 'Test Connection'}</span>
                  </button>

                  {connStatus === 'success' && (
                    <div className="flex items-center gap-1 text-[#4edea3] text-[11px] font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Connection verified (18ms latency)</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSaveConnection}
                  className="px-4 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-[4px] font-medium transition-colors"
                >
                  Save & Ingest
                </button>
              </div>
            </div>
          )}

          {/* STAGED DATASET PREVIEW (Shown after file, paste, URL, or starter is selected) */}
          {stagedDataset && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#10b981]/10 border border-[#10b981]/30 rounded-[6px]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#4edea3]" />
                  <div>
                    <span className="font-semibold text-[#f8fafc] text-[13px] block">
                      Parsed Successfully: {stagedDataset.name}
                    </span>
                    <span className="text-[11px] font-mono text-[#8c909f]">
                      {stagedDataset.rowCount.toLocaleString()} rows • {stagedDataset.columns.length} columns detected
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setStagedDataset(null)}
                  className="text-[11px] text-[#8c909f] hover:text-[#ffb4ab] underline"
                >
                  Choose Different File
                </button>
              </div>

              {/* Dataset Name Customization */}
              <div className="grid grid-cols-2 gap-4 text-[12px]">
                <div>
                  <label className="block text-[11px] font-mono text-[#8c909f] mb-1">
                    Dataset Label in Project
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[#090d15] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] outline-none focus:border-[#10b981]"
                  />
                </div>

                <div className="flex flex-col justify-end space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] text-[#dfe2ee]">
                    <input
                      type="checkbox"
                      checked={autoGenerateWidgets}
                      onChange={(e) => setAutoGenerateWidgets(e.target.checked)}
                      className="accent-[#10b981] w-4 h-4 rounded"
                    />
                    <span className="font-medium text-[#4edea3]">
                      Auto-generate matching dashboard charts for this data
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] text-[#8c909f]">
                    <input
                      type="checkbox"
                      checked={setAsActive}
                      onChange={(e) => setSetAsActive(e.target.checked)}
                      className="accent-[#10b981] w-4 h-4 rounded"
                    />
                    <span>Set as active dashboard dataset immediately</span>
                  </label>
                </div>
              </div>

              {/* Columns Schema Summary */}
              <div>
                <span className="block text-[11px] font-mono text-[#8c909f] mb-1.5 uppercase tracking-wider">
                  Inferred Schema ({stagedDataset.columns.length} Fields)
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-[#090d15] border border-[#1e293b] rounded-[4px]">
                  {stagedDataset.columns.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#181c24] border border-[#1e293b] text-[11px] font-mono"
                    >
                      <span className="text-[#f8fafc] font-medium">{c.name}</span>
                      <span
                        className={`text-[9px] px-1 rounded ${
                          c.category === 'measure'
                            ? 'bg-[#10b981]/20 text-[#4edea3]'
                            : c.category === 'time'
                            ? 'bg-[#8b5cf6]/20 text-[#d0bcff]'
                            : 'bg-[#1e293b] text-[#8c909f]'
                        }`}
                      >
                        {c.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Preview Table (First 5 rows) */}
              <div>
                <span className="block text-[11px] font-mono text-[#8c909f] mb-1.5 uppercase tracking-wider">
                  Data Sample (First {Math.min(5, stagedDataset.data.length)} Rows)
                </span>
                <div className="border border-[#1e293b] rounded-[4px] overflow-x-auto bg-[#090d15]">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-[#111827] text-[#8c909f] border-b border-[#1e293b]">
                      <tr>
                        {stagedDataset.columns.slice(0, 7).map((c) => (
                          <th key={c.name} className="px-3 py-1.5 whitespace-nowrap">
                            {c.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#181c24] text-[#dfe2ee]">
                      {stagedDataset.data.slice(0, 5).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#141824]">
                          {stagedDataset.columns.slice(0, 7).map((c) => (
                            <td key={c.name} className="px-3 py-1.5 whitespace-nowrap">
                              {row[c.name] !== undefined && row[c.name] !== null ? String(row[c.name]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Active Datasets & Schema Preview */}
          {activeTab === 'datasets' && !stagedDataset && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#8c909f] font-mono">Select Dataset:</span>
                  <select
                    value={previewDatasetId}
                    onChange={(e) => setPreviewDatasetId(e.target.value)}
                    className="h-7 px-2 bg-[#090d15] border border-[#1e293b] rounded-[3px] text-[12px] text-[#dfe2ee] outline-none font-medium"
                  >
                    {datasets.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.rowCount >= 1000000 ? `${(d.rowCount / 1000000).toFixed(1)}M` : d.rowCount.toLocaleString()} rows)
                        {d.id === activeDatasetId ? ' ★ Active' : ''}
                      </option>
                    ))}
                  </select>

                  {previewDatasetId !== activeDatasetId && (
                    <button
                      onClick={() => onSelectDataset(previewDatasetId)}
                      className="px-2.5 py-1 bg-[#10b981]/20 hover:bg-[#10b981]/30 border border-[#10b981]/40 text-[#4edea3] rounded-[3px] text-[11px] font-medium transition-colors"
                    >
                      Set As Active
                    </button>
                  )}
                </div>

                <span className="text-[11px] font-mono text-[#64748b]">
                  {currentDataset?.columns.length} columns • {currentDataset?.rowCount.toLocaleString()} total rows
                </span>
              </div>

              {/* Schema Table */}
              {currentDataset && (
                <div className="border border-[#1e293b] rounded-[4px] overflow-hidden bg-[#090d15]">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-[#111827] text-[#8c909f] border-b border-[#1e293b]">
                      <tr>
                        <th className="px-3 py-1.5">Column Name</th>
                        <th className="px-3 py-1.5">Data Type</th>
                        <th className="px-3 py-1.5">Role</th>
                        <th className="px-3 py-1.5">Nullable</th>
                        <th className="px-3 py-1.5">Distinct Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#181c24] text-[#dfe2ee]">
                      {currentDataset.columns.map((c) => (
                        <tr key={c.name} className="hover:bg-[#181c24]">
                          <td className="px-3 py-1.5 font-medium text-[#f8fafc]">{c.name}</td>
                          <td className="px-3 py-1.5 text-[#adc6ff]">{c.type}</td>
                          <td className="px-3 py-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded-[2px] text-[10px] ${
                                c.category === 'measure'
                                  ? 'bg-[#10b981]/15 text-[#4edea3]'
                                  : c.category === 'time'
                                  ? 'bg-[#8b5cf6]/15 text-[#d0bcff]'
                                  : 'bg-[#1e293b] text-[#94a3b8]'
                              }`}
                            >
                              {c.category}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-[#64748b]">{c.nullable ? 'Yes' : 'No'}</td>
                          <td className="px-3 py-1.5 text-[#c2c6d6]">{c.uniqueCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#1e293b] bg-[#0c0f17]">
          <div className="text-[11px] text-[#8c909f]">
            {stagedDataset ? (
              <span className="text-[#4edea3]">Ready to import into workspace</span>
            ) : (
              <span>Quickly ingest datasets from file, clipboard, or starter templates</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-[12px] bg-[#181c24] hover:bg-[#1e293b] text-[#dfe2ee] rounded-[4px] font-medium transition-colors border border-[#334155]"
            >
              Cancel
            </button>

            {stagedDataset && (
              <button
                onClick={() => commitImport(stagedDataset)}
                className="px-5 py-1.5 text-[12px] bg-[#10b981] hover:bg-[#059669] text-[#062016] rounded-[4px] font-semibold transition-all shadow-[0_2px_10px_rgba(16,185,129,0.3)] flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Complete Import</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
