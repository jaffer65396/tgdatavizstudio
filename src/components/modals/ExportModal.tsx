import React, { useState } from 'react';
import {
  X,
  Download,
  Image,
  FileText,
  Code,
  FileSpreadsheet,
  CheckCircle,
  Printer
} from 'lucide-react';
import { DashboardProject, Dataset } from '../../types/dashboard';
import { ExportService } from '../../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DashboardProject;
  dataset: Dataset;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  dataset
}) => {
  const [format, setFormat] = useState<'png' | 'pdf' | 'html' | 'json' | 'csv'>('png');
  const [resolution, setResolution] = useState<'1x' | '2x' | '3x'>('2x');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    setExportedSuccess(false);

    setTimeout(() => {
      if (format === 'png') {
        ExportService.exportPng('dashboard-canvas', `${project.name.toLowerCase().replace(/\s+/g, '_')}.png`);
      } else if (format === 'pdf') {
        ExportService.exportPdf();
      } else if (format === 'html') {
        ExportService.exportStandaloneHtml(project);
      } else if (format === 'json') {
        ExportService.exportProjectJson(project);
      } else if (format === 'csv') {
        ExportService.exportDatasetCsv(dataset);
      }

      setIsExporting(false);
      setExportedSuccess(true);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-lg bg-[#141822] border border-[#262a33] rounded-[8px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1e293b] bg-[#111827]">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[#adc6ff]" />
            <h2 className="text-[14px] font-semibold text-[#f8fafc]">
              Export Dashboard & Artifacts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee] rounded-[4px]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-[12px]">
          <div>
            <label className="block text-[11px] font-mono text-[#8c909f] mb-2 uppercase tracking-wider">
              Select Output Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat('png')}
                className={`p-3 rounded-[4px] border text-left flex items-center gap-2.5 transition-colors ${
                  format === 'png'
                    ? 'bg-[#1e293b] border-[#3b82f6] text-[#f8fafc]'
                    : 'bg-[#0f131c] border-[#1e293b] text-[#8c909f] hover:border-[#334155]'
                }`}
              >
                <Image className="w-4 h-4 text-[#3b82f6]" />
                <div>
                  <div className="font-semibold text-[12px]">PNG Image</div>
                  <div className="text-[10px] text-[#64748b]">High-resolution raster snapshot</div>
                </div>
              </button>

              <button
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-[4px] border text-left flex items-center gap-2.5 transition-colors ${
                  format === 'pdf'
                    ? 'bg-[#1e293b] border-[#3b82f6] text-[#f8fafc]'
                    : 'bg-[#0f131c] border-[#1e293b] text-[#8c909f] hover:border-[#334155]'
                }`}
              >
                <FileText className="w-4 h-4 text-[#f59e0b]" />
                <div>
                  <div className="font-semibold text-[12px]">PDF Document</div>
                  <div className="text-[10px] text-[#64748b]">Multi-page vector print layout</div>
                </div>
              </button>

              <button
                onClick={() => setFormat('html')}
                className={`p-3 rounded-[4px] border text-left flex items-center gap-2.5 transition-colors ${
                  format === 'html'
                    ? 'bg-[#1e293b] border-[#3b82f6] text-[#f8fafc]'
                    : 'bg-[#0f131c] border-[#1e293b] text-[#8c909f] hover:border-[#334155]'
                }`}
              >
                <Code className="w-4 h-4 text-[#10b981]" />
                <div>
                  <div className="font-semibold text-[12px]">Standalone HTML</div>
                  <div className="text-[10px] text-[#64748b]">Self-contained browser file</div>
                </div>
              </button>

              <button
                onClick={() => setFormat('json')}
                className={`p-3 rounded-[4px] border text-left flex items-center gap-2.5 transition-colors ${
                  format === 'json'
                    ? 'bg-[#1e293b] border-[#3b82f6] text-[#f8fafc]'
                    : 'bg-[#0f131c] border-[#1e293b] text-[#8c909f] hover:border-[#334155]'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-[#8b5cf6]" />
                <div>
                  <div className="font-semibold text-[12px]">Project Schema (.json)</div>
                  <div className="text-[10px] text-[#64748b]">Full definition for re-importing</div>
                </div>
              </button>
            </div>
          </div>

          {format === 'png' && (
            <div>
              <label className="block text-[11px] font-mono text-[#8c909f] mb-1">
                Resolution Scaling
              </label>
              <div className="flex gap-2">
                {(['1x', '2x', '3x'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setResolution(r)}
                    className={`px-3 py-1 text-[11px] font-mono rounded-[3px] border ${
                      resolution === r
                        ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
                        : 'bg-[#0f131c] text-[#8c909f] border-[#1e293b]'
                    }`}
                  >
                    {r} {r === '2x' ? '(Retina / Recommended)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {exportedSuccess && (
            <div className="p-2.5 bg-[#10b981]/15 border border-[#10b981]/30 rounded-[4px] text-[#4edea3] flex items-center gap-2 font-mono text-[11px]">
              <CheckCircle className="w-4 h-4" />
              <span>Export compiled and downloaded successfully!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#1e293b] bg-[#111827]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[12px] text-[#8c909f] hover:text-[#f8fafc] rounded-[4px]"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-1.5 bg-[#adc6ff] hover:bg-[#d8e2ff] text-[#00285d] font-semibold text-[12px] rounded-[4px] transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Compiling...' : `Download ${format.toUpperCase()}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
