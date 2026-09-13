import React from 'react';
import { Database, Filter, Calculator, BarChart3, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { Dataset } from '../../types/dashboard';

interface WorkflowViewProps {
  dataset: Dataset;
  rowCount: number;
  onClose: () => void;
}

export const WorkflowView: React.FC<WorkflowViewProps> = ({
  dataset,
  rowCount,
  onClose
}) => {
  const nodes = [
    {
      title: 'Vector Ingestion',
      subtitle: `${dataset.sourceType.toUpperCase()} Engine`,
      metric: `${(rowCount / 1000000).toFixed(1)}M raw rows`,
      icon: Database,
      status: 'Active',
      latency: '24ms'
    },
    {
      title: 'Schema Validation',
      subtitle: 'Strict type casting',
      metric: `${dataset.columns.length} columns verified`,
      icon: CheckCircle2,
      status: 'Verified',
      latency: '8ms'
    },
    {
      title: 'Transformation Pipeline',
      subtitle: 'Calculated ratios & delta',
      metric: 'Margin % & YoY Indices',
      icon: Calculator,
      status: 'Computed',
      latency: '14ms'
    },
    {
      title: 'OLAP Analytical Cache',
      subtitle: 'DuckDB In-Memory Cube',
      metric: 'Sub-millisecond query cache',
      icon: BarChart3,
      status: 'Ready',
      latency: '< 1ms'
    }
  ];

  return (
    <div className="flex-1 w-full h-full bg-[#0a0e16] p-8 overflow-y-auto font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
          <div>
            <h2 className="text-[18px] font-semibold text-[#f8fafc]">
              Data Transformation & Pipeline Graph
            </h2>
            <p className="text-[12px] text-[#8c909f]">
              Vectorized DuckDB in-memory analytical DAG executing for {dataset.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-[#dfe2ee] rounded-[4px] text-[12px]"
          >
            Back to Canvas
          </button>
        </div>

        {/* Node Pipeline View */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {nodes.map((node, idx) => {
            const Icon = node.icon;
            return (
              <div
                key={node.title}
                className="bg-[#111827] border border-[#1e293b] hover:border-[#3b82f6] rounded-[6px] p-4 flex flex-col justify-between transition-colors shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-[4px] bg-[#1e293b] flex items-center justify-center text-[#adc6ff]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#4edea3] border border-[#10b981]/30">
                      {node.status}
                    </span>
                  </div>

                  <h3 className="text-[13px] font-semibold text-[#f8fafc] mb-1">
                    {node.title}
                  </h3>
                  <p className="text-[11px] text-[#8c909f] mb-3">
                    {node.subtitle}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#dfe2ee]">{node.metric}</span>
                  <span className="text-[#64748b]">{node.latency}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Execution Log stream */}
        <div className="bg-[#0f131c] border border-[#1e293b] rounded-[6px] p-4 font-mono text-[11px]">
          <div className="flex items-center justify-between text-[#8c909f] mb-2 border-b border-[#1e293b] pb-2">
            <span>PIPELINE TELEMETRY LOGS</span>
            <span className="text-[#4edea3]">Real-time Vector Streaming</span>
          </div>
          <div className="space-y-1 text-[#dfe2ee]">
            <div>[02:59:12] DuckDB core initialized. Allocated 256MB scratch pool.</div>
            <div>[02:59:13] Ingested 1,245,320 rows across 5 dimensions, 6 measures.</div>
            <div>[02:59:14] Precomputed analytical cube aggregates for Quarter x Region x Category.</div>
            <div>[02:59:14] Query engine ready for sub-second reactive cross-filtering.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
