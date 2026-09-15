import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  Layout,
  BarChart3,
  TrendingUp,
  Database,
  Layers,
  Sparkles,
  DollarSign,
  Boxes,
  FileSpreadsheet,
  Globe
} from 'lucide-react';
import { Dataset } from '../../types/dashboard';

interface CreateDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (dashboardName: string, templateId: string, datasetId: string) => void;
  datasets: Dataset[];
  onOpenImportData?: () => void;
}

export const CreateDashboardModal: React.FC<CreateDashboardModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  datasets,
  onOpenImportData
}) => {
  const [name, setName] = useState('Global Sales & Margin Intelligence v3');
  const [selectedTemplate, setSelectedTemplate] = useState('sales-v3');
  const [selectedDataset, setSelectedDataset] = useState(datasets[0]?.id || 'ds-sales-global');

  if (!isOpen) return null;

  const templates = [
    {
      id: 'sales-v3',
      name: 'Global Sales & Margin Intelligence v3',
      description: 'Executive KPIs, quarterly trajectory, regional drilldown, and product matrix.',
      icon: TrendingUp,
      tag: 'RECOMMENDED',
      widgets: '4 KPIs • 4 Charts • 1 Matrix Table'
    },
    {
      id: 'geospatial',
      name: 'Geospatial & Regional Intelligence (Map Charts)',
      description: 'Interactive World Map choropleth, territory bubble heatmaps, and country cross-filtering.',
      icon: Globe,
      tag: 'MAPS & GEOGRAPHY',
      widgets: '4 KPIs • 1 World Map • 2 Regional Charts • 2 Tables'
    },
    {
      id: 'financial-pl',
      name: 'Corporate P&L & Cash Flow Intelligence',
      description: 'EBITDA trajectory, operating expense breakdown, and balance sheet variance.',
      icon: DollarSign,
      tag: 'FINANCIAL',
      widgets: '3 KPIs • 3 Charts • 1 Financial Ledger'
    },
    {
      id: 'supply-chain',
      name: 'Operations & Supply Chain Flow',
      description: 'Inventory turn rates, supplier lead times, and regional distribution queues.',
      icon: Boxes,
      tag: 'OPERATIONS',
      widgets: '4 KPIs • 3 Charts • 1 Logistics Table'
    },
    {
      id: 'blank',
      name: 'Empty Precision Canvas',
      description: 'Start with a clean 1440x900 analytical grid to build custom widgets from scratch.',
      icon: Layout,
      tag: 'CUSTOM',
      widgets: '0 Widgets • Full Flexibility'
    }
  ];

  const handleCreate = () => {
    onCreate(name || 'Untitled Dashboard', selectedTemplate, selectedDataset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[3px] p-4">
      {/* Modal Container */}
      <div className="w-full max-w-2xl bg-[#141822] border border-[#262a33] rounded-[8px] shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#111827]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-[4px] bg-[#3b82f6]/20 border border-[#3b82f6]/40 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-[#adc6ff]" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#f8fafc] font-sans">
                Create New Dashboard
              </h2>
              <p className="text-[12px] text-[#8c909f]">
                Configure data bindings, layout templates, and analytical viewport
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

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Dashboard Title Input */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#8c909f] mb-1.5">
              Dashboard Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 bg-[#0b0f17] border border-[#1e293b] focus:border-[#3b82f6] rounded-[4px] text-[13px] text-[#f8fafc] font-sans outline-none transition-colors"
              placeholder="e.g. Global Sales & Margin Intelligence"
            />
          </div>

          {/* Dataset Binding Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#8c909f]">
                Analytical Dataset Source
              </label>
              {onOpenImportData && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenImportData();
                  }}
                  className="text-[11px] text-[#4edea3] hover:underline flex items-center gap-1 font-medium"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>+ Import New Data</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {datasets.map((ds) => (
                <div
                  key={ds.id}
                  onClick={() => setSelectedDataset(ds.id)}
                  className={`flex items-center justify-between p-2.5 rounded-[4px] border cursor-pointer transition-colors ${
                    selectedDataset === ds.id
                      ? 'bg-[#1e293b] border-[#3b82f6]'
                      : 'bg-[#0f131c] border-[#1e293b] hover:border-[#334155]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-[#10b981]" />
                    <div>
                      <div className="text-[12px] font-medium text-[#f8fafc]">
                        {ds.name}
                      </div>
                      <div className="text-[11px] text-[#64748b] font-mono">
                        {ds.sourceType.toUpperCase()} • {(ds.rowCount / 1000000).toFixed(1)}M records • {ds.columns.length} dimensions & measures
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10b981]/15 text-[#4edea3] border border-[#10b981]/30">
                    Ready
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#8c909f] mb-2">
              Choose Pre-Configured Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {templates.map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`p-3 rounded-[6px] border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#181f2f] border-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                        : 'bg-[#0f131c] border-[#1e293b] hover:border-[#334155]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-[#adc6ff]' : 'text-[#8c909f]'}`} />
                          <span className="text-[12px] font-semibold text-[#f8fafc]">
                            {tpl.name}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#8c909f] leading-relaxed mb-2">
                        {tpl.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]/60 text-[10px] font-mono text-[#64748b]">
                      <span>{tpl.widgets}</span>
                      <span className="text-[#3b82f6] font-medium">{tpl.tag}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer matching the exact bottom actions from screenshot */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#1e293b] bg-[#0f131c]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-[13px] font-medium text-[#8c909f] hover:text-[#f8fafc] hover:bg-[#181c24] rounded-[4px] transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2 text-[13px] font-semibold bg-[#adc6ff] hover:bg-[#d8e2ff] text-[#00285d] rounded-[6px] transition-all shadow-[0_2px_12px_rgba(173,198,255,0.25)] cursor-pointer"
          >
            <span>Create Dashboard</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
