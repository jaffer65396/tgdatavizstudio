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
  Plus
} from 'lucide-react';
import { Dataset } from '../../types/dashboard';
import { DataEngine } from '../../services/dataEngine';

interface DataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasets: Dataset[];
  onAddDataset: (dataset: Dataset) => void;
}

export const DataSourceModal: React.FC<DataSourceModalProps> = ({
  isOpen,
  onClose,
  datasets,
  onAddDataset
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'database' | 'datasets'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(datasets[0]?.id || '');

  // DB Form state
  const [dbType, setDbType] = useState('PostgreSQL');
  const [connName, setConnName] = useState('Production Analytics Store');
  const [host, setHost] = useState('db.us-east-1.cloud.internal');
  const [port, setPort] = useState('5432');
  const [dbName, setDbName] = useState('sales_warehouse');
  const [user, setUser] = useState('analyst_user');
  const [password, setPassword] = useState('••••••••••••');
  const [testingConn, setTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  if (!isOpen) return null;

  const currentDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const parsedDataset = await DataEngine.parseFile(file);
      onAddDataset(parsedDataset);
      setSelectedDatasetId(parsedDataset.id);
      setActiveTab('datasets');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTestConnection = () => {
    setTestingConn(true);
    setConnStatus('idle');

    setTimeout(() => {
      setTestingConn(false);
      setConnStatus('success');
    }, 900);
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
    onAddDataset(newDs);
    setSelectedDatasetId(newDs.id);
    setActiveTab('datasets');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-3xl bg-[#141822] border border-[#262a33] rounded-[8px] shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1e293b] bg-[#111827]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#3b82f6]" />
            <h2 className="text-[14px] font-semibold text-[#f8fafc]">
              Data Sources & Storage Library
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee] rounded-[4px]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-4 px-6 border-b border-[#1e293b] bg-[#0f131c] text-[12px] font-medium">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-[#3b82f6] text-[#f8fafc]'
                : 'border-transparent text-[#8c909f] hover:text-[#dfe2ee]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>File Ingestion (CSV / XLSX / JSON)</span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'border-[#3b82f6] text-[#f8fafc]'
                : 'border-transparent text-[#8c909f] hover:text-[#dfe2ee]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Database Connector</span>
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'datasets'
                ? 'border-[#3b82f6] text-[#f8fafc]'
                : 'border-transparent text-[#8c909f] hover:text-[#dfe2ee]'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Active Datasets ({datasets.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-[#1e293b] hover:border-[#3b82f6] rounded-[6px] p-8 flex flex-col items-center justify-center text-center transition-colors bg-[#0b0f17]">
                <FileSpreadsheet className="w-10 h-10 text-[#3b82f6] mb-3 opacity-80" />
                <h3 className="text-[14px] font-medium text-[#f8fafc] mb-1">
                  Drag and drop your data file here
                </h3>
                <p className="text-[12px] text-[#8c909f] max-w-sm mb-4">
                  Supports CSV, XLSX, TSV, and JSON formats. Columns and data types are automatically parsed.
                </p>

                <label className="cursor-pointer px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-[#dfe2ee] hover:text-[#f8fafc] rounded-[4px] text-[12px] font-medium transition-colors border border-[#334155]">
                  <span>Browse Files</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.json,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {isUploading && (
                <div className="flex items-center gap-2 text-[12px] text-[#adc6ff] font-mono justify-center">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing dataset schema and indexing vectors...</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-[#93000a]/20 border border-[#93000a]/40 text-[#ffb4ab] text-[12px] rounded-[4px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Database Connection Wizard */}
          {activeTab === 'database' && (
            <div className="space-y-4 text-[12px]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-[#8c909f] mb-1">
                    Database Engine
                  </label>
                  <select
                    value={dbType}
                    onChange={(e) => setDbType(e.target.value)}
                    className="w-full h-8 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] outline-none"
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
                    className="w-full h-8 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] outline-none"
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
                    className="w-full h-8 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] outline-none font-mono"
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
                    className="w-full h-8 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] outline-none font-mono"
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
                    className="w-full h-8 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] outline-none font-mono"
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
                    className="w-full h-8 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] outline-none font-mono"
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
                  Save Connection
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Active Datasets & Schema Preview */}
          {activeTab === 'datasets' && currentDataset && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#8c909f] font-mono">Dataset:</span>
                  <select
                    value={selectedDatasetId}
                    onChange={(e) => setSelectedDatasetId(e.target.value)}
                    className="h-7 px-2 bg-[#0b0f17] border border-[#1e293b] rounded-[3px] text-[12px] text-[#dfe2ee] outline-none font-medium"
                  >
                    {datasets.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({(d.rowCount / 1000000).toFixed(1)}M rows)
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[11px] font-mono text-[#64748b]">
                  {currentDataset.columns.length} columns • {currentDataset.rowCount.toLocaleString()} total rows
                </span>
              </div>

              {/* Schema Table */}
              <div className="border border-[#1e293b] rounded-[4px] overflow-hidden bg-[#0b0f17]">
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
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-[#1e293b] bg-[#111827]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[12px] bg-[#1e293b] hover:bg-[#334155] text-[#dfe2ee] rounded-[4px] font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
