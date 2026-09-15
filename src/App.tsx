import React, { useState, useEffect } from 'react';
import { DashboardProject, DashboardElement, Dataset, FilterRule, SortClause } from './types/dashboard';
import {
  generateSalesDataset,
  getInitialProject,
  getInitialProjects,
  getGeospatialDashboardProject,
  getExecutiveDashboardProject
} from './data/sampleDatasets';
import { DataEngine } from './services/dataEngine';
import { Header } from './components/layout/Header';
import { Toolbar } from './components/layout/Toolbar';
import { LeftRail, ActiveDrawer } from './components/layout/LeftRail';
import { StatusBar } from './components/layout/StatusBar';
import { DashboardCanvas } from './components/canvas/DashboardCanvas';
import { CreateDashboardModal } from './components/modals/CreateDashboardModal';
import { DataSourceModal } from './components/modals/DataSourceModal';
import { ExportModal } from './components/modals/ExportModal';
import { ShareModal } from './components/modals/ShareModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { DashboardsManagerModal } from './components/modals/DashboardsManagerModal';
import { SequentialQueryModal } from './components/modals/SequentialQueryModal';
import { PropertiesDrawer } from './components/panels/PropertiesDrawer';
import { DataDrawer } from './components/panels/DataDrawer';
import { FilterDrawer } from './components/panels/FilterDrawer';
import { LayersDrawer } from './components/panels/LayersDrawer';
import { WorkflowView } from './components/panels/WorkflowView';

export default function App() {
  // Core state
  const [datasets, setDatasets] = useState<Dataset[]>([generateSalesDataset()]);
  const [activeDatasetId, setActiveDatasetId] = useState<string>('ds-sales-global');

  // Multi-Dashboard Management State
  const [projects, setProjects] = useState<DashboardProject[]>(() => {
    try {
      const saved = localStorage.getItem('dataviz_projects_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return getInitialProjects();
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return localStorage.getItem('dataviz_active_project_id') || 'proj-sales-global';
  });

  // Current active project
  const project = projects.find((p) => p.id === activeProjectId) || projects[0] || getInitialProject();

  const [history, setHistory] = useState<DashboardProject[]>([project]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Sync projects and active ID to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dataviz_projects_v3', JSON.stringify(projects));
    } catch (e) {
      console.error(e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('dataviz_active_project_id', activeProjectId);
    } catch (e) {
      console.error(e);
    }
  }, [activeProjectId]);

  // UI state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDashboardsManagerOpen, setIsDashboardsManagerOpen] = useState(false);
  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSequentialModalOpen, setIsSequentialModalOpen] = useState(false);
  const [sequentialModalElement, setSequentialModalElement] = useState<DashboardElement | null>(null);

  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>('none');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const currentDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0];
  const activePage = project.pages[project.activePageIndex] || project.pages[0];
  const selectedElement = activePage.elements.find((el) => el.id === selectedElementId) || null;

  // Push project state to undo history and update current project in projects list
  const updateProjectWithHistory = (newProject: DashboardProject) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newProject);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    
    setProjects((prev) =>
      prev.map((p) => (p.id === newProject.id ? newProject : p))
    );
    setSaveStatus('unsaved');

    // Auto-save debounced simulation
    setTimeout(() => {
      setSaveStatus('saved');
    }, 800);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setProjects((all) => all.map((p) => (p.id === prev.id ? prev : p)));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setProjects((all) => all.map((p) => (p.id === next.id ? next : p)));
    }
  };

  // Switch active project
  const handleSelectProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (target) {
      setActiveProjectId(id);
      setHistory([target]);
      setHistoryIndex(0);
      setSelectedElementId(null);
    }
  };

  // Create project
  const handleCreateProject = (name: string, description?: string, template?: string) => {
    let newProject: DashboardProject;
    if (template === 'geospatial') {
      newProject = {
        ...getGeospatialDashboardProject(),
        id: `proj-${Date.now()}`,
        name: name || 'Geospatial & Regional Intelligence',
        description: description || 'Geospatial territory intelligence and world choropleths',
        savedAt: 'Just now'
      };
    } else if (template === 'executive') {
      newProject = {
        ...getExecutiveDashboardProject(),
        id: `proj-${Date.now()}`,
        name: name || 'Executive KPI & Strategy Command',
        description: description || 'Corporate executive KPI command center and performance tracking',
        savedAt: 'Just now'
      };
    } else {
      newProject = {
        id: `proj-${Date.now()}`,
        name: name || 'Custom Precision Dashboard',
        description: description || 'Custom analytical workspace',
        version: 'v3.2.0',
        savedAt: 'Just now',
        canvas: { width: 1440, height: 900, gridSnap: true, gridSize: 16 },
        theme: 'precision-dark',
        crossFilteringEnabled: true,
        activeFilters: [],
        crossFilters: {},
        activePageIndex: 0,
        pages: [
          {
            id: `p-${Date.now()}`,
            name: 'Main View',
            elements: []
          }
        ]
      };
    }

    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setHistory([newProject]);
    setHistoryIndex(0);
    setSelectedElementId(null);
    setIsEditMode(true);
  };

  // Duplicate project
  const handleDuplicateProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;

    const duplicated: DashboardProject = {
      ...JSON.parse(JSON.stringify(target)),
      id: `proj-${Date.now()}`,
      name: `${target.name} (Copy)`,
      savedAt: 'Just now'
    };

    setProjects((prev) => [duplicated, ...prev]);
    setActiveProjectId(duplicated.id);
    setHistory([duplicated]);
    setHistoryIndex(0);
  };

  // Rename project
  const handleRenameProject = (id: string, newName: string, newDescription?: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, name: newName, description: newDescription !== undefined ? newDescription : p.description, savedAt: 'Just now' }
          : p
      )
    );
  };

  // Delete project
  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) return;
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    if (activeProjectId === id) {
      const nextActive = remaining[0];
      setActiveProjectId(nextActive.id);
      setHistory([nextActive]);
      setHistoryIndex(0);
      setSelectedElementId(null);
    }
  };

  // Keyboard shortcuts (Ctrl+Z, Ctrl+S, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        setSaveStatus('saving');
        setTimeout(() => setSaveStatus('saved'), 600);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Cross-filtering trigger
  const handleCrossFilter = (dimension: string, value: string) => {
    const currentList = project.crossFilters[dimension] || [];
    let updatedList: string[];

    if (currentList.includes(value)) {
      // Toggle off if already selected
      updatedList = currentList.filter((v) => v !== value);
    } else {
      // Set to single selection or add
      updatedList = [value];
    }

    const updatedCrossFilters = { ...project.crossFilters };
    if (updatedList.length === 0) {
      delete updatedCrossFilters[dimension];
    } else {
      updatedCrossFilters[dimension] = updatedList;
    }

    updateProjectWithHistory({
      ...project,
      crossFilters: updatedCrossFilters
    });
  };

  const handleClearCrossFilters = () => {
    updateProjectWithHistory({
      ...project,
      crossFilters: {}
    });
  };

  // Update element in active page
  const handleUpdateElement = (updatedElement: DashboardElement) => {
    const updatedElements = activePage.elements.map((el) =>
      el.id === updatedElement.id ? updatedElement : el
    );
    const updatedPages = project.pages.map((p, idx) =>
      idx === project.activePageIndex ? { ...p, elements: updatedElements } : p
    );
    updateProjectWithHistory({
      ...project,
      pages: updatedPages
    });
  };

  // Sequential Query Modal Open & Apply handlers
  const handleOpenSequentialModal = (element?: DashboardElement | null) => {
    setSequentialModalElement(element || selectedElement || null);
    setIsSequentialModalOpen(true);
  };

  const handleApplyWidgetSort = (clauses: SortClause[]) => {
    const target = sequentialModalElement || selectedElement;
    if (!target) return;
    const updated: DashboardElement = {
      ...target,
      config: {
        ...target.config,
        sequentialSort: clauses,
        sequentialSortMode: 'pipeline'
      }
    };
    handleUpdateElement(updated);
  };

  const handleSortDatasetPermanently = (sortedDataset: Dataset) => {
    setDatasets((prev) => prev.map((d) => (d.id === sortedDataset.id ? sortedDataset : d)));
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    const updatedElements = activePage.elements.filter((el) => el.id !== id);
    const updatedPages = project.pages.map((p, idx) =>
      idx === project.activePageIndex ? { ...p, elements: updatedElements } : p
    );
    updateProjectWithHistory({
      ...project,
      pages: updatedPages
    });
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Add new widget
  const handleAddWidget = () => {
    const newId = `widget-${Date.now()}`;
    const newElement: DashboardElement = {
      id: newId,
      title: 'New Analytical Metric',
      type: 'chart',
      datasetId: currentDataset.id,
      layout: { x: 32, y: 32, w: 420, h: 280 },
      config: {
        chartType: 'bar',
        dimension: currentDataset.columns.find((c) => c.category === 'dimension')?.name || 'Region',
        measure: currentDataset.columns.find((c) => c.category === 'measure')?.name || 'Revenue',
        aggregation: 'SUM',
        showLegend: true
      }
    };

    const updatedElements = [...activePage.elements, newElement];
    const updatedPages = project.pages.map((p, idx) =>
      idx === project.activePageIndex ? { ...p, elements: updatedElements } : p
    );

    updateProjectWithHistory({
      ...project,
      pages: updatedPages
    });

    setSelectedElementId(newId);
    setIsEditMode(true);
  };

  // Add new Map Chart widget
  const handleAddMapWidget = () => {
    const newId = `widget-map-${Date.now()}`;
    // Look for Country or Region column
    const geoCol = currentDataset.columns.find(
      (c) => c.name.toLowerCase().includes('country') || c.name.toLowerCase().includes('region') || c.name.toLowerCase().includes('state')
    ) || currentDataset.columns.find((c) => c.category === 'dimension');
    const measureCol = currentDataset.columns.find(
      (c) => c.name.toLowerCase().includes('revenue') || c.name.toLowerCase().includes('sales') || c.category === 'measure'
    );

    const newElement: DashboardElement = {
      id: newId,
      title: 'Territory Intelligence (Geographic Map)',
      type: 'chart',
      datasetId: currentDataset.id,
      layout: { x: 32, y: 32, w: 680, h: 420 },
      config: {
        chartType: 'map',
        dimension: geoCol?.name || 'Country',
        measure: measureCol?.name || 'Revenue',
        aggregation: 'SUM',
        mapMode: 'choropleth',
        mapScope: 'world',
        colorPalette: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        showLegend: true
      }
    };

    const updatedElements = [...activePage.elements, newElement];
    const updatedPages = project.pages.map((p, idx) =>
      idx === project.activePageIndex ? { ...p, elements: updatedElements } : p
    );

    updateProjectWithHistory({
      ...project,
      pages: updatedPages
    });

    setSelectedElementId(newId);
    setIsEditMode(true);
  };

  // Add new page
  const handleAddPage = () => {
    const newPageNum = project.pages.length + 1;
    const newPage = {
      id: `p-${Date.now()}`,
      name: `Analysis Page ${newPageNum}`,
      elements: []
    };

    updateProjectWithHistory({
      ...project,
      pages: [...project.pages, newPage],
      activePageIndex: project.pages.length
    });
  };

  // Create new dashboard from modal
  const handleCreateDashboard = (name: string, templateId: string, datasetId: string) => {
    let newProj: DashboardProject;
    if (templateId === 'blank') {
      newProj = {
        ...getInitialProject(),
        id: `proj-${Date.now()}`,
        name: name || 'Blank Analytical Canvas',
        description: 'Clean analytical workspace',
        savedAt: 'Just now',
        pages: [
          {
            id: `p-blank-${Date.now()}`,
            name: 'Main View',
            elements: []
          }
        ]
      };
    } else if (templateId === 'geospatial') {
      newProj = {
        ...getGeospatialDashboardProject(),
        id: `proj-${Date.now()}`,
        name: name || 'Geospatial & Regional Intelligence',
        description: 'Interactive World Map choropleth, territory bubble heatmaps, and country cross-filtering',
        savedAt: 'Just now'
      };
    } else if (templateId === 'executive') {
      newProj = {
        ...getExecutiveDashboardProject(),
        id: `proj-${Date.now()}`,
        name: name || 'Executive KPI & Strategy Command',
        description: 'Corporate executive KPI command center and performance tracking',
        savedAt: 'Just now'
      };
    } else {
      const initial = getInitialProject();
      newProj = {
        ...initial,
        id: `proj-${Date.now()}`,
        name: name || initial.name,
        savedAt: 'Just now'
      };
    }

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setHistory([newProj]);
    setHistoryIndex(0);
    setSelectedElementId(null);
  };

  // Active cross-filter count
  const activeCrossFilterCount = Object.keys(project.crossFilters).length;

  // Add new dataset handler with auto-generation support
  const handleAddDataset = (newDs: Dataset, autoGenerateWidgets: boolean = true) => {
    const existingIndex = datasets.findIndex((d) => d.id === newDs.id);
    let updatedDatasets: Dataset[];
    if (existingIndex >= 0) {
      updatedDatasets = datasets.map((d) => (d.id === newDs.id ? newDs : d));
    } else {
      updatedDatasets = [...datasets, newDs];
    }
    setDatasets(updatedDatasets);
    setActiveDatasetId(newDs.id);

    if (autoGenerateWidgets) {
      const generatedElements = DataEngine.generateWidgetsForDataset(newDs);
      const newPageName = newDs.name.length > 20 ? newDs.name.slice(0, 18) + '...' : newDs.name;
      const newPage = {
        id: `p-${Date.now()}`,
        name: newPageName,
        elements: generatedElements
      };
      updateProjectWithHistory({
        ...project,
        pages: [...project.pages, newPage],
        activePageIndex: project.pages.length
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0f17] text-[#dfe2ee] overflow-hidden font-sans select-none">
      {/* 1. Top Header (Application Rail) */}
      <Header
        project={project}
        projects={projects}
        onSelectProject={handleSelectProject}
        onOpenDashboardsManager={() => setIsDashboardsManagerOpen(true)}
        onOpenProjectModal={() => setIsDashboardsManagerOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenDataSourceModal={() => setIsDataSourceModalOpen(true)}
        onNewDashboard={() => setIsCreateModalOpen(true)}
        onSaveProject={() => {
          setSaveStatus('saving');
          setTimeout(() => setSaveStatus('saved'), 500);
        }}
        saveStatus={saveStatus}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* 2. Sub-Toolbar */}
      <Toolbar
        zoom={zoom}
        onZoomChange={setZoom}
        crossFilterEnabled={project.crossFilteringEnabled}
        onToggleCrossFilter={() =>
          updateProjectWithHistory({
            ...project,
            crossFilteringEnabled: !project.crossFilteringEnabled
          })
        }
        onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
        onOpenSequentialModal={() => handleOpenSequentialModal()}
        onAddWidget={handleAddWidget}
        onAddMapWidget={handleAddMapWidget}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        activeCrossFilterCount={activeCrossFilterCount}
        onClearCrossFilters={handleClearCrossFilters}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenImportData={() => setIsDataSourceModalOpen(true)}
        activeDataset={currentDataset}
        datasets={datasets}
        onSelectDataset={(id) => setActiveDatasetId(id)}
      />

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Navigation Rail */}
        <LeftRail
          activeDrawer={activeDrawer}
          onSelectDrawer={(drawer) => {
            if (drawer === 'workflow') {
              setActiveDrawer('workflow');
            } else if (drawer === 'datasets') {
              setActiveDrawer('datasets');
            } else if (drawer === 'layers') {
              setActiveDrawer('layers');
            } else if (drawer === 'charts') {
              handleAddWidget();
            } else {
              setActiveDrawer('none');
            }
          }}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenImportData={() => setIsDataSourceModalOpen(true)}
          onOpenDashboards={() => setIsDashboardsManagerOpen(true)}
        />

        {/* Collapsible Left Drawers */}
        {activeDrawer === 'datasets' && (
          <DataDrawer
            isOpen={true}
            onClose={() => setActiveDrawer('none')}
            dataset={currentDataset}
            datasets={datasets}
            onSelectDataset={(id) => setActiveDatasetId(id)}
            onOpenImportData={() => setIsDataSourceModalOpen(true)}
            onAddCalculatedField={(name, formula) => {
              const updatedCol = {
                name,
                type: 'number' as const,
                category: 'measure' as const,
                format: 'decimal' as const,
                nullable: false,
                uniqueCount: 100
              };
              const updatedDs = {
                ...currentDataset,
                columns: [...currentDataset.columns, updatedCol]
              };
              setDatasets(datasets.map((d) => (d.id === currentDataset.id ? updatedDs : d)));
            }}
          />
        )}

        {activeDrawer === 'layers' && (
          <LayersDrawer
            isOpen={true}
            onClose={() => setActiveDrawer('none')}
            elements={activePage.elements}
            selectedElementId={selectedElementId}
            onSelectElement={(id) => {
              setSelectedElementId(id);
            }}
            onDeleteElement={handleDeleteElement}
          />
        )}

        {/* Center Canvas or Workflow View */}
        {activeDrawer === 'workflow' ? (
          <WorkflowView
            dataset={currentDataset}
            rowCount={currentDataset.rowCount}
            onClose={() => setActiveDrawer('none')}
          />
        ) : (
          <DashboardCanvas
            project={project}
            dataset={currentDataset}
            isEditMode={isEditMode}
            zoom={zoom}
            selectedElementId={selectedElementId}
            onSelectElement={(id) => setSelectedElementId(id)}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onCrossFilter={handleCrossFilter}
            onConfigureElement={(el) => {
              setSelectedElementId(el.id);
            }}
            onOpenSequentialModal={(el) => handleOpenSequentialModal(el)}
          />
        )}

        {/* Right Collapsible Inspector / Filter Drawers */}
        {selectedElement && (
          <PropertiesDrawer
            element={selectedElement}
            dataset={currentDataset}
            onClose={() => setSelectedElementId(null)}
            onUpdateElement={handleUpdateElement}
            onOpenSequentialModal={() => handleOpenSequentialModal(selectedElement)}
          />
        )}

        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          dataset={currentDataset}
          filters={project.activeFilters}
          onAddFilter={(rule) =>
            updateProjectWithHistory({
              ...project,
              activeFilters: [...project.activeFilters, rule]
            })
          }
          onRemoveFilter={(id) =>
            updateProjectWithHistory({
              ...project,
              activeFilters: project.activeFilters.filter((f) => f.id !== id)
            })
          }
          onToggleFilter={(id) =>
            updateProjectWithHistory({
              ...project,
              activeFilters: project.activeFilters.map((f) =>
                f.id === id ? { ...f, active: !f.active } : f
              )
            })
          }
          onClearAll={() =>
            updateProjectWithHistory({
              ...project,
              activeFilters: []
            })
          }
        />
      </div>

      {/* 4. Bottom Status Bar */}
      <StatusBar
        rowCount={currentDataset.rowCount}
        lastRefreshed={currentDataset.lastRefreshed}
        gridSnap={project.canvas.gridSnap}
        onToggleGridSnap={() =>
          updateProjectWithHistory({
            ...project,
            canvas: {
              ...project.canvas,
              gridSnap: !project.canvas.gridSnap
            }
          })
        }
        canvasDimensions={{
          width: project.canvas.width,
          height: project.canvas.height
        }}
        pages={project.pages}
        activePageIndex={project.activePageIndex}
        onSelectPage={(index) => {
          setSelectedElementId(null);
          updateProjectWithHistory({ ...project, activePageIndex: index });
        }}
        onAddPage={handleAddPage}
      />

      {/* 5. Modals */}
      {/* Dashboards Manager & Switcher Modal */}
      <DashboardsManagerModal
        isOpen={isDashboardsManagerOpen}
        onClose={() => setIsDashboardsManagerOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDuplicateProject={handleDuplicateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        datasets={datasets}
      />

      {/* Centerpiece Create Dashboard Modal matching screenshot */}
      <CreateDashboardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateDashboard}
        datasets={datasets}
        onOpenImportData={() => setIsDataSourceModalOpen(true)}
      />

      {/* Data Source & Ingestion Modal */}
      <DataSourceModal
        isOpen={isDataSourceModalOpen}
        onClose={() => setIsDataSourceModalOpen(false)}
        datasets={datasets}
        activeDatasetId={activeDatasetId}
        onSelectDataset={(id) => setActiveDatasetId(id)}
        onAddDataset={handleAddDataset}
      />

      {/* Export Artifacts Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        dataset={currentDataset}
      />

      {/* Share & Embed Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={project}
      />

      {/* Studio Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        project={project}
        onUpdateCanvasSize={(width, height, gridSize) => {
          updateProjectWithHistory({
            ...project,
            canvas: {
              ...project.canvas,
              width,
              height,
              gridSize
            }
          });
        }}
      />

      {/* Sequential Query & Multi-Stage Sorter Modal */}
      <SequentialQueryModal
        isOpen={isSequentialModalOpen}
        onClose={() => {
          setIsSequentialModalOpen(false);
          setSequentialModalElement(null);
        }}
        dataset={currentDataset}
        element={sequentialModalElement || selectedElement}
        onApplyWidgetSort={handleApplyWidgetSort}
        onSortDatasetPermanently={handleSortDatasetPermanently}
      />
    </div>
  );
}
