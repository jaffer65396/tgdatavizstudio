import React, { useState } from 'react';
import {
  Folder,
  ChevronDown,
  Check,
  Share2,
  Download,
  Moon,
  Sun,
  User,
  Activity,
  FilePlus,
  Save,
  Database,
  BarChart2,
  HelpCircle,
  LayoutDashboard,
  Plus,
  Layers
} from 'lucide-react';
import { DashboardProject } from '../../types/dashboard';

interface HeaderProps {
  project: DashboardProject;
  projects?: DashboardProject[];
  onSelectProject?: (projectId: string) => void;
  onOpenDashboardsManager?: () => void;
  onOpenProjectModal: () => void;
  onOpenExportModal: () => void;
  onOpenShareModal: () => void;
  onOpenDataSourceModal: () => void;
  onNewDashboard: () => void;
  onSaveProject: () => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  projects = [],
  onSelectProject,
  onOpenDashboardsManager,
  onOpenProjectModal,
  onOpenExportModal,
  onOpenShareModal,
  onOpenDataSourceModal,
  onNewDashboard,
  onSaveProject,
  saveStatus,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);

  const toggleMenu = (menuName: string) => {
    setActiveMenu((prev) => (prev === menuName ? null : menuName));
  };

  return (
    <header className="h-10 bg-[#0f131c] border-b border-[#1e293b] flex items-center justify-between px-3 select-none text-[13px] z-50 relative">
      {/* Left section: Logo, Project dropdown, status, and Top Menu */}
      <div className="flex items-center gap-4">
        {/* Brand Logo */}
        <div 
          onClick={onOpenProjectModal}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-5 h-5 rounded-[4px] bg-gradient-to-tr from-[#10b981] to-[#3b82f6] flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.3)]">
            <Activity className="w-3.5 h-3.5 text-[#0b0f17] stroke-[2.5]" />
          </div>
          <span className="font-semibold tracking-tight text-[#f8fafc] group-hover:text-[#adc6ff] transition-colors">
            DataVizStudio
          </span>
        </div>

        {/* Project Switcher / Breadcrumb */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-[#1e293b] relative">
          <div className="relative">
            <button
              onClick={() => setDashboardDropdownOpen(!dashboardDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#181c24] rounded-[3px] text-[#dfe2ee] hover:text-[#f8fafc] transition-colors group"
              title="Click to switch dashboard or manage projects"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span className="font-medium text-[12px] max-w-[220px] truncate">
                {project.name}
              </span>
              <ChevronDown className="w-3 h-3 text-[#8c909f] group-hover:text-[#f8fafc]" />
            </button>

            {dashboardDropdownOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 w-72 bg-[#141b27] border border-[#334155] rounded-[5px] shadow-2xl py-1.5 z-50 text-[12px] text-[#dfe2ee]"
                onMouseLeave={() => setDashboardDropdownOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] font-mono text-[#8c909f] uppercase tracking-wider border-b border-[#1e293b] flex items-center justify-between">
                  <span>Switch Dashboard ({projects.length})</span>
                  <button
                    onClick={() => {
                      setDashboardDropdownOpen(false);
                      onOpenDashboardsManager?.();
                    }}
                    className="text-[#60a5fa] hover:underline"
                  >
                    Manage All
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto py-1">
                  {projects.map((p) => {
                    const isSelected = p.id === project.id;
                    const widgetCount = p.pages.reduce((acc, page) => acc + page.elements.length, 0);

                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProject?.(p.id);
                          setDashboardDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-[#1e293b] flex items-start justify-between transition-colors ${
                          isSelected ? 'bg-[#3b82f6]/15 text-[#60a5fa]' : 'text-[#dfe2ee]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-medium text-[12px] truncate">{p.name}</div>
                          <div className="text-[10px] text-[#8c909f] truncate flex items-center gap-1.5 mt-0.5">
                            <span>{p.pages.length} {p.pages.length === 1 ? 'Page' : 'Pages'}</span>
                            <span>•</span>
                            <span>{widgetCount} Widgets</span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#60a5fa] shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-[#1e293b] pt-1 px-1">
                  <button
                    onClick={() => {
                      setDashboardDropdownOpen(false);
                      onOpenDashboardsManager?.();
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-[#1e293b] text-[#60a5fa] font-medium flex items-center gap-1.5 rounded-[3px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manage / Create New Dashboard...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Saved Status Badge */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-[#10b981]/15 border border-[#10b981]/30 text-[#4edea3] text-[11px] font-mono">
            <Check className="w-3 h-3" />
            <span>{saveStatus === 'saving' ? 'Saving...' : 'Saved'}</span>
          </div>
        </div>

        {/* Traditional Workbench Menu Items */}
        <nav className="flex items-center gap-0.5 ml-2 text-[#94a3b8]">
          {/* Quick Dashboards Manager Trigger */}
          <button
            onClick={onOpenDashboardsManager}
            className="flex items-center gap-1 px-2 py-1 rounded-[3px] text-[12px] text-[#60a5fa] bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 border border-[#3b82f6]/30 transition-colors font-medium mr-1"
            title="Browse and manage all dashboards"
          >
            <Layers className="w-3 h-3 text-[#60a5fa]" />
            <span>Dashboards</span>
          </button>
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('File')}
              className={`px-2 py-1 rounded-[3px] text-[12px] hover:text-[#f8fafc] hover:bg-[#181c24] transition-colors ${
                activeMenu === 'File' ? 'bg-[#181c24] text-[#f8fafc]' : ''
              }`}
            >
              File
            </button>
            {activeMenu === 'File' && (
              <div
                className="absolute left-0 top-full mt-1 w-48 bg-[#181c24] border border-[#334155] rounded-[4px] shadow-2xl py-1 z-50 text-[12px] text-[#dfe2ee]"
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  onClick={() => {
                    setActiveMenu(null);
                    onNewDashboard();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center gap-2"
                >
                  <FilePlus className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <span>New Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    setActiveMenu(null);
                    onOpenProjectModal();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center gap-2"
                >
                  <Folder className="w-3.5 h-3.5 text-[#8c909f]" />
                  <span>Open Project...</span>
                </button>
                <button
                  onClick={() => {
                    setActiveMenu(null);
                    onSaveProject();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Save className="w-3.5 h-3.5 text-[#4edea3]" />
                    <span>Save Project</span>
                  </div>
                  <span className="text-[10px] text-[#64748b] font-mono">⌘S</span>
                </button>
                <div className="my-1 border-t border-[#1e293b]" />
                <button
                  onClick={() => {
                    setActiveMenu(null);
                    onOpenExportModal();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-[#adc6ff]" />
                  <span>Export Dashboard...</span>
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('Edit')}
              className={`px-2 py-1 rounded-[3px] text-[12px] hover:text-[#f8fafc] hover:bg-[#181c24] transition-colors ${
                activeMenu === 'Edit' ? 'bg-[#181c24] text-[#f8fafc]' : ''
              }`}
            >
              Edit
            </button>
            {activeMenu === 'Edit' && (
              <div
                className="absolute left-0 top-full mt-1 w-44 bg-[#181c24] border border-[#334155] rounded-[4px] shadow-2xl py-1 z-50 text-[12px] text-[#dfe2ee]"
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  onClick={() => {
                    setActiveMenu(null);
                    onSaveProject();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center justify-between"
                >
                  <span>Undo</span>
                  <span className="text-[10px] text-[#64748b] font-mono">⌘Z</span>
                </button>
                <button
                  onClick={() => {
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center justify-between"
                >
                  <span>Redo</span>
                  <span className="text-[10px] text-[#64748b] font-mono">⌘Y</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveMenu(null)}
            className="px-2 py-1 rounded-[3px] text-[12px] hover:text-[#f8fafc] hover:bg-[#181c24] transition-colors text-[#dfe2ee] bg-[#1e293b]"
          >
            View
          </button>

          <button
            onClick={onOpenDataSourceModal}
            className="px-2 py-1 rounded-[3px] text-[12px] hover:text-[#f8fafc] hover:bg-[#181c24] transition-colors"
          >
            Data
          </button>

          <button
            onClick={() => setActiveMenu(null)}
            className="px-2 py-1 rounded-[3px] text-[12px] hover:text-[#f8fafc] hover:bg-[#181c24] transition-colors"
          >
            Visualization
          </button>

          <button
            onClick={onOpenExportModal}
            className="px-2 py-1 rounded-[3px] text-[12px] hover:text-[#f8fafc] hover:bg-[#181c24] transition-colors"
          >
            Export
          </button>

          <button
            onClick={() => {
              window.open('https://github.com', '_blank');
            }}
            className="px-2 py-1 rounded-[3px] text-[12px] hover:text-[#f8fafc] hover:bg-[#181c24] transition-colors"
          >
            Help
          </button>
        </nav>
      </div>

      {/* Right section: Live Session, Avatar, Theme, Share, Export button */}
      <div className="flex items-center gap-3">
        {/* Live Session indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#181c24] border border-[#1e293b] text-[11px] font-mono text-[#94a3b8]">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          <span className="text-[10px] font-semibold text-[#4edea3] tracking-wide">
            LIVE SESSION
          </span>
        </div>

        {/* User avatar circle */}
        <div className="w-7 h-7 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#dfe2ee] hover:border-[#adc6ff] transition-colors cursor-pointer">
          <User className="w-4 h-4 text-[#adc6ff]" />
        </div>

        {/* Dark/Light mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#181c24] rounded-[3px] transition-colors"
          title="Toggle Theme"
        >
          {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Share Button */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium text-[#dfe2ee] hover:text-[#f8fafc] hover:bg-[#181c24] border border-[#334155] rounded-[4px] transition-colors"
        >
          <Share2 className="w-3.5 h-3.5 text-[#94a3b8]" />
          <span>Share</span>
        </button>

        {/* Primary Export Button */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium bg-[#adc6ff] hover:bg-[#d8e2ff] text-[#00285d] rounded-[4px] transition-all shadow-[0_2px_8px_rgba(173,198,255,0.2)]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </header>
  );
};
