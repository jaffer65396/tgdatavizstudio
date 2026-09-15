import React, { useState } from 'react';
import {
  X,
  LayoutDashboard,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Check,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  Download,
  Upload,
  Globe,
  BarChart2,
  TrendingUp,
  Database
} from 'lucide-react';
import { DashboardProject, Dataset } from '../../types/dashboard';

interface DashboardsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: DashboardProject[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string, description?: string, template?: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string, newDescription?: string) => void;
  onDeleteProject: (projectId: string) => void;
  datasets: Dataset[];
}

export const DashboardsManagerModal: React.FC<DashboardsManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onRenameProject,
  onDeleteProject,
  datasets
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'blank' | 'geospatial' | 'executive'>('blank');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  if (!isOpen) return null;

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewTitle('New Executive Dashboard');
    setNewDesc('Multi-metric performance dashboard');
    setSelectedTemplate('blank');
  };

  const handleConfirmCreate = () => {
    if (!newTitle.trim()) return;
    onCreateProject(newTitle.trim(), newDesc.trim(), selectedTemplate);
    setIsCreating(false);
    onClose();
  };

  const handleStartRename = (project: DashboardProject) => {
    setEditingId(project.id);
    setEditTitle(project.name);
    setEditDesc(project.description || '');
  };

  const handleSaveRename = (projectId: string) => {
    if (editTitle.trim()) {
      onRenameProject(projectId, editTitle.trim(), editDesc.trim());
    }
    setEditingId(null);
  };

  // Helper to count total widgets in a project
  const countWidgets = (project: DashboardProject) => {
    return project.pages.reduce((acc, p) => acc + p.elements.length, 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-sans select-none">
      <div className="bg-[#0f141f] border border-[#1e293b] rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1e293b] bg-[#111827] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center text-[#60a5fa]">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#f8fafc] flex items-center gap-2">
                <span>Manage Dashboards</span>
                <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded bg-[#1e293b] text-[#94a3b8]">
                  {projects.length} Available
                </span>
              </h2>
              <p className="text-[12px] text-[#8c909f]">
                Switch between dashboards, organize multi-page views, or create new analytical workspaces
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={handleStartCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-md text-[12px] font-medium shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Dashboard</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#8c909f] hover:text-[#f8fafc] hover:bg-[#1e293b] rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Creation Drawer */}
          {isCreating && (
            <div className="p-4 bg-[#141b27] border border-[#3b82f6]/40 rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                <span className="text-[13px] font-semibold text-[#f8fafc] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <span>Create New Dashboard</span>
                </span>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-[#8c909f] hover:text-[#dfe2ee] text-[11px]"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-[#8c909f] uppercase mb-1">
                    Dashboard Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Q4 Regional Operations"
                    className="w-full h-8 px-2.5 bg-[#0b0f17] border border-[#1e293b] focus:border-[#3b82f6] rounded text-[#f8fafc] text-[12px] outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#8c909f] uppercase mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="e.g. Sales, margin and territory cross-filtering"
                    className="w-full h-8 px-2.5 bg-[#0b0f17] border border-[#1e293b] focus:border-[#3b82f6] rounded text-[#f8fafc] text-[12px] outline-none"
                  />
                </div>
              </div>

              {/* Template selection */}
              <div>
                <label className="block text-[11px] font-mono text-[#8c909f] uppercase mb-2">
                  Choose Starting Template
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('blank')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedTemplate === 'blank'
                        ? 'bg-[#3b82f6]/15 border-[#3b82f6] text-[#f8fafc]'
                        : 'bg-[#0b0f17] border-[#1e293b] text-[#8c909f] hover:border-[#334155]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <LayoutDashboard className="w-4 h-4 text-[#3b82f6]" />
                      <span className="font-semibold text-[12px]">Blank Canvas</span>
                    </div>
                    <p className="text-[10px] text-[#8c909f] leading-snug">
                      Start fresh with an empty grid ready for custom charts and widgets.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('geospatial')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedTemplate === 'geospatial'
                        ? 'bg-[#10b981]/15 border-[#10b981] text-[#f8fafc]'
                        : 'bg-[#0b0f17] border-[#1e293b] text-[#8c909f] hover:border-[#334155]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-[#10b981]" />
                      <span className="font-semibold text-[12px]">Geospatial Map</span>
                    </div>
                    <p className="text-[10px] text-[#8c909f] leading-snug">
                      Includes interactive World Map choropleth, territory metrics & country matrix.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('executive')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedTemplate === 'executive'
                        ? 'bg-[#f59e0b]/15 border-[#f59e0b] text-[#f8fafc]'
                        : 'bg-[#0b0f17] border-[#1e293b] text-[#8c909f] hover:border-[#334155]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-[#f59e0b]" />
                      <span className="font-semibold text-[12px]">Executive KPI</span>
                    </div>
                    <p className="text-[10px] text-[#8c909f] leading-snug">
                      High-level ARR & EBITDA KPIs, trajectory forecast, and business unit breakdown.
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-[#8c909f] hover:text-[#f8fafc] text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCreate}
                  className="px-4 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded text-[12px] font-medium"
                >
                  Create & Launch Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-[#0b0f17] border border-[#1e293b] rounded-md px-3 py-1.5 text-[12px]">
            <Search className="w-4 h-4 text-[#8c909f]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dashboards by title or keywords..."
              className="bg-transparent text-[#f8fafc] outline-none flex-1 placeholder:text-[#8c909f]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#8c909f] hover:text-[#dfe2ee]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dashboards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((project) => {
              const isActive = project.id === activeProjectId;
              const isEditing = editingId === project.id;
              const widgetCount = countWidgets(project);

              return (
                <div
                  key={project.id}
                  className={`p-4 rounded-lg border transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-[#141b27] border-[#3b82f6] shadow-md shadow-[#3b82f6]/10'
                      : 'bg-[#111827] border-[#1e293b] hover:border-[#334155]'
                  }`}
                >
                  <div>
                    {/* Header: Title & Badges */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      {isEditing ? (
                        <div className="flex-1 space-y-1.5 mr-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-2 py-0.5 bg-[#0b0f17] border border-[#3b82f6] rounded text-[#f8fafc] text-[13px] outline-none font-semibold"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Dashboard description..."
                            className="w-full px-2 py-0.5 bg-[#0b0f17] border border-[#1e293b] rounded text-[#8c909f] text-[11px] outline-none"
                          />
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              onClick={() => handleSaveRename(project.id)}
                              className="px-2 py-0.5 bg-[#3b82f6] text-white rounded text-[10px] font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-0.5 text-[#8c909f] hover:text-[#dfe2ee] text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[13px] font-semibold text-[#f8fafc] truncate">
                              {project.name}
                            </h3>
                            {isActive && (
                              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10b981]/20 border border-[#10b981]/40 text-[#4edea3] font-medium">
                                <Check className="w-2.5 h-2.5" />
                                <span>Active</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#8c909f] line-clamp-1 mt-0.5">
                            {project.description || 'Custom interactive workspace'}
                          </p>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1 text-[#8c909f]">
                          <button
                            onClick={() => handleStartRename(project)}
                            className="p-1 hover:text-[#f8fafc] hover:bg-[#1e293b] rounded"
                            title="Rename Dashboard"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDuplicateProject(project.id)}
                            className="p-1 hover:text-[#f8fafc] hover:bg-[#1e293b] rounded"
                            title="Clone / Duplicate Dashboard"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {projects.length > 1 && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Are you sure you want to delete "${project.name}"?`
                                  )
                                ) {
                                  onDeleteProject(project.id);
                                }
                              }}
                              className="p-1 hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 rounded"
                              title="Delete Dashboard"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Metadata stats pill row */}
                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#8c909f] mt-3 pt-2 border-t border-[#1e293b]">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[#60a5fa]" />
                        <span>{project.pages.length} Pages</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <BarChart2 className="w-3 h-3 text-[#10b981]" />
                        <span>{widgetCount} Widgets</span>
                      </span>
                      <span>•</span>
                      <span className="text-[#64748b]">
                        {project.savedAt || 'Auto-saved'}
                      </span>
                    </div>

                    {/* Page tags preview */}
                    <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar py-0.5">
                      {project.pages.map((p, idx) => (
                        <span
                          key={p.id}
                          className="px-2 py-0.5 rounded bg-[#181c24] border border-[#1e293b] text-[10px] text-[#cbd5e1] font-mono whitespace-nowrap"
                        >
                          {idx + 1}. {p.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider">
                      {project.theme} • {project.version}
                    </span>

                    {isActive ? (
                      <span className="text-[11px] text-[#4edea3] font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Currently Open
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onSelectProject(project.id);
                          onClose();
                        }}
                        className="px-3 py-1 bg-[#181c24] hover:bg-[#3b82f6] text-[#dfe2ee] hover:text-white rounded text-[11px] font-medium border border-[#334155] hover:border-[#3b82f6] transition-colors"
                      >
                        Open Dashboard
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#1e293b] bg-[#111827] flex items-center justify-between text-[11px] text-[#8c909f]">
          <span>
            Tip: You can switch dashboards anytime using the header switcher or hotkeys.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#181c24] hover:bg-[#1e293b] text-[#dfe2ee] rounded border border-[#1e293b] text-[12px] font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
