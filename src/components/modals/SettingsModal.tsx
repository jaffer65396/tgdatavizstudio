import React, { useState } from 'react';
import { X, Settings, HardDrive, Cpu, Sliders, ShieldCheck } from 'lucide-react';
import { DashboardProject } from '../../types/dashboard';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DashboardProject;
  onUpdateCanvasSize: (width: number, height: number, gridSize: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateCanvasSize
}) => {
  const [width, setWidth] = useState(project.canvas.width);
  const [height, setHeight] = useState(project.canvas.height);
  const [gridSize, setGridSize] = useState(project.canvas.gridSize);
  const [storageDir, setStorageDir] = useState('~/.dataviz_projects/workspace');
  const [autosave, setAutosave] = useState('1');

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateCanvasSize(width, height, gridSize);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4 font-sans">
      <div className="w-full max-w-lg bg-[#141822] border border-[#262a33] rounded-[8px] shadow-2xl overflow-hidden flex flex-col text-[12px]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1e293b] bg-[#111827]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#adc6ff]" />
            <h2 className="text-[14px] font-semibold text-[#f8fafc]">
              Studio Environment Settings
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
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-[#8c909f] mb-1 uppercase tracking-wider">
              Canvas Resolution (WxH)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-[#64748b] block mb-1 font-mono">Width (px)</span>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full h-8 px-2.5 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] font-mono outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#64748b] block mb-1 font-mono">Height (px)</span>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full h-8 px-2.5 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] font-mono outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#8c909f] mb-1 uppercase tracking-wider">
              Grid Snapping Interval
            </label>
            <div className="flex gap-2 font-mono">
              {[8, 16, 24, 32].map((step) => (
                <button
                  key={step}
                  onClick={() => setGridSize(step)}
                  className={`flex-1 py-1.5 rounded-[4px] border transition-colors ${
                    gridSize === step
                      ? 'bg-[#1e293b] border-[#3b82f6] text-[#adc6ff]'
                      : 'bg-[#0b0f17] border-[#1e293b] text-[#8c909f]'
                  }`}
                >
                  {step}px
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#8c909f] mb-1 uppercase tracking-wider">
              Project Storage Path (Local Disk)
            </label>
            <input
              type="text"
              value={storageDir}
              onChange={(e) => setStorageDir(e.target.value)}
              className="w-full h-8 px-2.5 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#8c909f] mb-1 uppercase tracking-wider">
              Autosave Cadence
            </label>
            <select
              value={autosave}
              onChange={(e) => setAutosave(e.target.value)}
              className="w-full h-8 px-2.5 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[#dfe2ee] font-mono outline-none"
            >
              <option value="1">Every 1 Minute (Continuous Sync)</option>
              <option value="5">Every 5 Minutes</option>
              <option value="manual">Manual Save Only</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-3 border-t border-[#1e293b] bg-[#111827]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[12px] text-[#8c909f] hover:text-[#dfe2ee]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-[4px] font-medium"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
