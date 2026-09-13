import React, { useState, useEffect } from 'react';
import { DashboardProject, DashboardElement, Dataset, FilterRule } from './types/dashboard';
import { generateSalesDataset, getInitialProject } from './data/sampleDatasets';
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
import { PropertiesDrawer } from './components/panels/PropertiesDrawer';
import { DataDrawer } from './components/panels/DataDrawer';
import { FilterDrawer } from './components/panels/FilterDrawer';
import { LayersDrawer } from './components/panels/LayersDrawer';
import { WorkflowView } from './components/panels/WorkflowView';

export default function App() {
  // Core state
  const [datasets, setDatasets] = useState<Dataset[]>([generateSalesDataset()]);
  const [project, setProject] = useState<DashboardProject>(getInitialProject());
  const [history, setHistory] = useState<DashboardProject[]>([getInitialProject()]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // UI state
  // Notice: In the user's screenshot, the "Create Dashboard" modal is open in the center over the dimmed dashboard!
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(true);
  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>('none');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const currentDataset = datasets.find((d) => d.id === 'ds-sales-global') || datasets[0];
  const activePage = project.pages[project.activePageIndex] || project.pages[0];
  const selectedElement = activePage.elements.find((el) => el.id === selectedElementId) || null;

  // Push project state to undo history
  const updateProjectWithHistory = (newProject: DashboardProject) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newProject);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setProject(newProject);
    setSaveStatus('unsaved');

    // Auto-save debounced simulation
    setTimeout(() => {
      setSaveStatus('saved');
    }, 1200);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setProject(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setProject(history[historyIndex + 1]);
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
    if (templateId === 'blank') {
      const blankProj: DashboardProject = {
        ...getInitialProject(),
        id: `proj-${Date.now()}`,
        name,
        pages: [
          {
            id: 'p-blank-1',
            name: 'Main View',
            elements: []
          }
        ]
      };
      setProject(blankProj);
      setHistory([blankProj]);
      setHistoryIndex(0);
      setIsEditMode(true);
    } else {
      const initial = getInitialProject();
      const newProj = {
        ...initial,
        id: `proj-${Date.now()}`,
        name
      };
      setProject(newProj);
      setHistory([newProj]);
      setHistoryIndex(0);
    }
  };

  // Active cross-filter count
  const activeCrossFilterCount = Object.keys(project.crossFilters).length;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0f17] text-[#dfe2ee] overflow-hidden font-sans select-none">
      {/* 1. Top Header (Application Rail) */}
      <Header
        project={project}
        onOpenProjectModal={() => setIsCreateModalOpen(true)}
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
        onAddWidget={handleAddWidget}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        activeCrossFilterCount={activeCrossFilterCount}
        onClearCrossFilters={handleClearCrossFilters}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
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
        />

        {/* Collapsible Left Drawers */}
        {activeDrawer === 'datasets' && (
          <DataDrawer
            isOpen={true}
            onClose={() => setActiveDrawer('none')}
            dataset={currentDataset}
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
          />
        )}

        {/* Right Collapsible Inspector / Filter Drawers */}
        {selectedElement && (
          <PropertiesDrawer
            element={selectedElement}
            dataset={currentDataset}
            onClose={() => setSelectedElementId(null)}
            onUpdateElement={handleUpdateElement}
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
          setProject({ ...project, activePageIndex: index });
        }}
        onAddPage={handleAddPage}
      />

      {/* 5. Modals */}
      {/* Centerpiece Create Dashboard Modal matching screenshot */}
      <CreateDashboardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateDashboard}
        datasets={datasets}
      />

      {/* Data Source & Ingestion Modal */}
      <DataSourceModal
        isOpen={isDataSourceModalOpen}
        onClose={() => setIsDataSourceModalOpen(false)}
        datasets={datasets}
        onAddDataset={(newDs) => {
          setDatasets([...datasets, newDs]);
        }}
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
    </div>
  );
}
