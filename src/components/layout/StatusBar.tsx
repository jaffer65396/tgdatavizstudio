import React, { useState } from 'react';
import { Database, Clock, Grid, Maximize, Plus, FileText } from 'lucide-react';
import { DashboardPage } from '../../types/dashboard';

interface StatusBarProps {
  rowCount: number;
  lastRefreshed: string;
  gridSnap: boolean;
  onToggleGridSnap: () => void;
  canvasDimensions: { width: number; height: number };
  pages: DashboardPage[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  rowCount,
  lastRefreshed,
  gridSnap,
  onToggleGridSnap,
  canvasDimensions,
  pages,
  activePageIndex,
  onSelectPage,
  onAddPage
}) => {
  return (
    <footer className="h-7 bg-[#0b0f17] border-t border-[#1e293b] flex items-center justify-between px-3 text-[11px] font-mono text-[#8c909f] select-none z-30">
      {/* Left side telemetry readouts */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-[#dfe2ee]">
          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
          <span className="font-medium text-[#f8fafc]">DuckDB In-Memory</span>
        </div>

        <span className="text-[#334155]">|</span>

        <span>{(rowCount / 1000000).toFixed(1)}M rows loaded</span>

        <span className="text-[#334155]">|</span>

        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#64748b]" />
          <span>Refreshed: {lastRefreshed}</span>
        </div>

        <span className="text-[#334155]">|</span>

        <button
          onClick={onToggleGridSnap}
          className="flex items-center gap-1 hover:text-[#dfe2ee] transition-colors cursor-pointer"
        >
          <Grid className="w-3 h-3 text-[#64748b]" />
          <span>
            Grid Snap:{' '}
            <strong className={gridSnap ? 'text-[#4edea3]' : 'text-[#64748b]'}>
              {gridSnap ? 'ON' : 'OFF'}
            </strong>
          </span>
        </button>

        <span className="text-[#334155]">|</span>

        <span>
          Active Canvas: {canvasDimensions.width}x{canvasDimensions.height}
        </span>
      </div>

      {/* Right side: Multi-page tabs matching screenshot */}
      <div className="flex items-center gap-1">
        <div className="flex items-center bg-[#111827] border border-[#1e293b] rounded-[3px] p-0.5">
          {pages.map((page, idx) => (
            <button
              key={page.id}
              onClick={() => onSelectPage(idx)}
              className={`px-2.5 py-0.5 rounded-[2px] text-[11px] font-sans transition-colors ${
                activePageIndex === idx
                  ? 'bg-[#1e293b] text-[#f8fafc] font-medium border border-[#334155]'
                  : 'text-[#8c909f] hover:text-[#dfe2ee] hover:bg-[#181c24]'
              }`}
            >
              {page.name}
            </button>
          ))}

          <button
            onClick={onAddPage}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-[#adc6ff] hover:text-[#f8fafc] hover:bg-[#181c24] rounded-[2px] transition-colors font-sans"
            title="Add New Dashboard Page"
          >
            <Plus className="w-3 h-3" />
            <span>New Page</span>
          </button>
        </div>

        <div className="pl-2 text-[10px] text-[#64748b]">
          Page {activePageIndex + 1} of {pages.length}
        </div>
      </div>
    </footer>
  );
};
