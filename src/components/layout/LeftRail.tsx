import React from 'react';
import {
  LayoutGrid,
  GitFork,
  Database,
  BarChart2,
  Layers,
  Settings,
  Upload,
  LayoutDashboard
} from 'lucide-react';

export type ActiveDrawer = 'none' | 'canvas' | 'workflow' | 'datasets' | 'charts' | 'layers' | 'settings';

interface LeftRailProps {
  activeDrawer: ActiveDrawer;
  onSelectDrawer: (drawer: ActiveDrawer) => void;
  onOpenSettings: () => void;
  onOpenImportData?: () => void;
  onOpenDashboards?: () => void;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  activeDrawer,
  onSelectDrawer,
  onOpenSettings,
  onOpenImportData,
  onOpenDashboards
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
        {onOpenDashboards && (
          <button
            onClick={onOpenDashboards}
            className="w-9 h-9 rounded-[4px] flex items-center justify-center text-[#60a5fa] bg-[#3b82f6]/15 hover:bg-[#3b82f6]/25 border border-[#3b82f6]/35 transition-colors relative group mb-0.5"
            title="Manage Dashboards & Workspaces"
          >
            <LayoutDashboard className="w-4 h-4" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#181c24] border border-[#334155] rounded-[3px] text-[11px] text-[#60a5fa] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50 font-sans">
              All Dashboards
            </div>
          </button>
        )}

        {onOpenImportData && (
          <button
            onClick={onOpenImportData}
            className="w-9 h-9 rounded-[4px] flex items-center justify-center text-[#4edea3] bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/35 transition-colors relative group mb-1.5"
            title="Import Data (CSV, Excel, Paste, Starter Datasets)"
          >
            <Upload className="w-4 h-4" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#181c24] border border-[#334155] rounded-[3px] text-[11px] text-[#4edea3] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50 font-sans">
              Import Data Source
            </div>
          </button>
        )}

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
