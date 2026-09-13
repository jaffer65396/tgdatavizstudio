import React from 'react';
import {
  LayoutGrid,
  GitFork,
  Database,
  BarChart2,
  Layers,
  Settings
} from 'lucide-react';

export type ActiveDrawer = 'none' | 'canvas' | 'workflow' | 'datasets' | 'charts' | 'layers' | 'settings';

interface LeftRailProps {
  activeDrawer: ActiveDrawer;
  onSelectDrawer: (drawer: ActiveDrawer) => void;
  onOpenSettings: () => void;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  activeDrawer,
  onSelectDrawer,
  onOpenSettings
}) => {
  const items = [
    { id: 'canvas' as ActiveDrawer, icon: LayoutGrid, label: 'Dashboard Canvas' },
    { id: 'workflow' as ActiveDrawer, icon: GitFork, label: 'Data Pipelines' },
    { id: 'datasets' as ActiveDrawer, icon: Database, label: 'Datasets & Schema' },
    { id: 'charts' as ActiveDrawer, icon: BarChart2, label: 'Visualizations' },
    { id: 'layers' as ActiveDrawer, icon: Layers, label: 'Layer Hierarchy' },
  ];

  return (
    <aside className="w-12 bg-[#0f131c] border-r border-[#1e293b] flex flex-col justify-between items-center py-2.5 z-30 select-none">
      {/* Primary Tool Icons */}
      <div className="flex flex-col items-center gap-1 w-full px-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeDrawer === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectDrawer(isActive ? 'none' : item.id)}
              className={`w-9 h-9 rounded-[4px] flex items-center justify-center transition-colors relative group ${
                isActive
                  ? 'bg-[#1e293b] text-[#3b82f6] border border-[#334155]'
                  : 'text-[#8c909f] hover:text-[#f8fafc] hover:bg-[#181c24]'
              }`}
              title={item.label}
            >
              <Icon className="w-4 h-4" />
              {/* Tooltip on hover */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#181c24] border border-[#334155] rounded-[3px] text-[11px] text-[#f8fafc] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50 font-sans">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom: Settings Cog */}
      <div className="flex flex-col items-center gap-1 w-full px-1.5">
        <button
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-[4px] flex items-center justify-center text-[#8c909f] hover:text-[#f8fafc] hover:bg-[#181c24] transition-colors relative group"
          title="Studio Settings"
        >
          <Settings className="w-4 h-4" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#181c24] border border-[#334155] rounded-[3px] text-[11px] text-[#f8fafc] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50 font-sans">
            Studio Settings
          </div>
        </button>
      </div>
    </aside>
  );
};
