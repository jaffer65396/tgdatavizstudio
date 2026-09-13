import React, { useState, useRef } from 'react';
import { DashboardElement, DashboardProject, Dataset } from '../../types/dashboard';
import { WidgetContainer } from './WidgetContainer';
import { KpiCardWidget } from '../widgets/KpiCardWidget';
import { EChartWidget } from '../widgets/EChartWidget';
import { TableWidget } from '../widgets/TableWidget';
import { DataEngine } from '../../services/dataEngine';
import { ExportService } from '../../services/exportService';

interface DashboardCanvasProps {
  project: DashboardProject;
  dataset: Dataset;
  isEditMode: boolean;
  zoom: number;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (updated: DashboardElement) => void;
  onDeleteElement: (id: string) => void;
  onCrossFilter: (dimension: string, value: string) => void;
  onConfigureElement: (element: DashboardElement) => void;
}

export const DashboardCanvas: React.FC<DashboardCanvasProps> = ({
  project,
  dataset,
  isEditMode,
  zoom,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onCrossFilter,
  onConfigureElement
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const activePage = project.pages[project.activePageIndex] || project.pages[0];

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);

  // Resize state
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ mouseX: number; mouseY: number; initialW: number; initialH: number } | null>(null);

  const snap = (val: number, step: number = project.canvas.gridSize) => {
    if (!project.canvas.gridSnap) return val;
    return Math.round(val / step) * step;
  };

  const handleMouseDownDrag = (e: React.MouseEvent, element: DashboardElement) => {
    if (!isEditMode) return;
    e.preventDefault();
    setDraggingId(element.id);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: element.layout.x,
      initialY: element.layout.y
    });
  };

  const handleMouseDownResize = (e: React.MouseEvent, element: DashboardElement) => {
    if (!isEditMode) return;
    e.preventDefault();
    setResizingId(element.id);
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialW: element.layout.w,
      initialH: element.layout.h
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const scale = zoom / 100;

    if (draggingId && dragStart) {
      const deltaX = (e.clientX - dragStart.mouseX) / scale;
      const deltaY = (e.clientY - dragStart.mouseY) / scale;

      const element = activePage.elements.find((el) => el.id === draggingId);
      if (element) {
        const newX = Math.max(0, snap(dragStart.initialX + deltaX));
        const newY = Math.max(0, snap(dragStart.initialY + deltaY));
        onUpdateElement({
          ...element,
          layout: {
            ...element.layout,
            x: newX,
            y: newY
          }
        });
      }
    }

    if (resizingId && resizeStart) {
      const deltaW = (e.clientX - resizeStart.mouseX) / scale;
      const deltaH = (e.clientY - resizeStart.mouseY) / scale;

      const element = activePage.elements.find((el) => el.id === resizingId);
      if (element) {
        const newW = Math.max(160, snap(resizeStart.initialW + deltaW));
        const newH = Math.max(90, snap(resizeStart.initialH + deltaH));
        onUpdateElement({
          ...element,
          layout: {
            ...element.layout,
            w: newW,
            h: newH
          }
        });
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setDragStart(null);
    setResizingId(null);
    setResizeStart(null);
  };

  return (
    <div
      className="flex-1 w-full h-full overflow-auto bg-[#0b0f17] relative flex items-start justify-start p-6"
      onClick={() => onSelectElement(null)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 1440x900 Canvas Stage */}
      <div
        id="dashboard-canvas"
        ref={canvasRef}
        style={{
          width: `${project.canvas.width}px`,
          height: `${project.canvas.height}px`,
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
        }}
        className="relative bg-[#0a0e16] border border-[#1e293b] rounded-[6px] shadow-2xl flex-shrink-0 select-none overflow-hidden"
      >
        {/* Optional background grid dot matrix */}
        {isEditMode && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
        )}

        {/* Render elements */}
        {activePage.elements.map((element) => {
          const isSelected = element.id === selectedElementId;

          // Process OLAP data for this element
          if (element.type === 'kpi') {
            const val = DataEngine.calculateKpi(
              dataset,
              element.config.measure,
              element.config.aggregation || 'SUM',
              project.activeFilters,
              project.crossFilters
            );

            return (
              <WidgetContainer
                key={element.id}
                element={element}
                isSelected={isSelected}
                isEditMode={isEditMode}
                onSelect={() => onSelectElement(element.id)}
                onDelete={() => onDeleteElement(element.id)}
                onConfigure={() => onConfigureElement(element)}
                onMouseDownDrag={(e) => handleMouseDownDrag(e, element)}
                onMouseDownResize={(e) => handleMouseDownResize(e, element)}
              >
                <KpiCardWidget
                  title={element.title}
                  config={element.config}
                  currentValue={val}
                />
              </WidgetContainer>
            );
          }

          if (element.type === 'table') {
            const filteredRows = DataEngine.filterRows(
              dataset.data,
              project.activeFilters,
              project.crossFilters
            );

            return (
              <WidgetContainer
                key={element.id}
                element={element}
                isSelected={isSelected}
                isEditMode={isEditMode}
                onSelect={() => onSelectElement(element.id)}
                onDelete={() => onDeleteElement(element.id)}
                onConfigure={() => onConfigureElement(element)}
                onMouseDownDrag={(e) => handleMouseDownDrag(e, element)}
                onMouseDownResize={(e) => handleMouseDownResize(e, element)}
              >
                <TableWidget
                  rows={filteredRows}
                  config={element.config}
                  onExportCsv={() => ExportService.exportDatasetCsv(dataset)}
                />
              </WidgetContainer>
            );
          }

          // Charts
          const queryResult = DataEngine.query(dataset, {
            dimension: element.config.dimension,
            measure: element.config.measure,
            secondaryMeasure: element.config.secondaryMeasure,
            aggregation: element.config.aggregation || 'SUM',
            filters: project.activeFilters,
            crossFilters: project.crossFilters,
            limit: 14
          });

          const currentCrossFilterVals = element.config.dimension
            ? project.crossFilters[element.config.dimension] || []
            : [];

          return (
            <WidgetContainer
              key={element.id}
              element={element}
              isSelected={isSelected}
              isEditMode={isEditMode}
              onSelect={() => onSelectElement(element.id)}
              onDelete={() => onDeleteElement(element.id)}
              onConfigure={() => onConfigureElement(element)}
              onMouseDownDrag={(e) => handleMouseDownDrag(e, element)}
              onMouseDownResize={(e) => handleMouseDownResize(e, element)}
            >
              <EChartWidget
                config={element.config}
                data={queryResult}
                selectedValues={currentCrossFilterVals}
                onSliceClick={(val) => {
                  if (project.crossFilteringEnabled && element.config.dimension) {
                    onCrossFilter(element.config.dimension, val);
                  }
                }}
              />
            </WidgetContainer>
          );
        })}
      </div>
    </div>
  );
};
