import React from 'react';
import { GripHorizontal, Maximize2, MoreVertical, Trash2, Sliders } from 'lucide-react';
import { DashboardElement } from '../../types/dashboard';

interface WidgetContainerProps {
  element: DashboardElement;
  isSelected: boolean;
  isEditMode: boolean;
  children: React.ReactNode;
  onSelect: () => void;
  onDelete?: () => void;
  onConfigure?: () => void;
  onMouseDownDrag?: (e: React.MouseEvent) => void;
  onMouseDownResize?: (e: React.MouseEvent) => void;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  element,
  isSelected,
  isEditMode,
  children,
  onSelect,
  onDelete,
  onConfigure,
  onMouseDownDrag,
  onMouseDownResize
}) => {
  const isKpi = element.type === 'kpi';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        position: 'absolute',
        left: `${element.layout.x}px`,
        top: `${element.layout.y}px`,
        width: `${element.layout.w}px`,
        height: `${element.layout.h}px`,
      }}
      className={`group flex flex-col bg-[#111827] rounded-[4px] border transition-shadow duration-150 overflow-hidden ${
        isSelected
          ? 'border-[#3b82f6] shadow-[0_0_0_1px_#3b82f6,0_8px_20px_rgba(0,0,0,0.5)] z-20'
          : 'border-[#1e293b] hover:border-[#334155] z-10'
      }`}
    >
      {/* Widget Header Rail (unless KPI card which has its own embedded minimalist header) */}
      {!isKpi && (
        <div
          className={`flex items-center justify-between px-3 h-8 border-b border-[#1e293b] bg-[#111827] select-none ${
            isEditMode ? 'cursor-move' : ''
          }`}
          onMouseDown={isEditMode ? onMouseDownDrag : undefined}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {isEditMode && (
              <GripHorizontal className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#94a3b8] flex-shrink-0" />
            )}
            <h3 className="text-[12px] font-semibold text-[#f8fafc] truncate tracking-tight font-sans">
              {element.title}
            </h3>
          </div>

          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
            {onConfigure && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigure();
                }}
                className="p-1 hover:bg-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc] rounded-[2px]"
                title="Configure Widget"
              >
                <Sliders className="w-3 h-3" />
              </button>
            )}
            {isEditMode && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 hover:bg-[#93000a]/30 text-[#94a3b8] hover:text-[#ffb4ab] rounded-[2px]"
                title="Delete Widget"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Widget Body Content */}
      <div className="flex-1 w-full h-full overflow-hidden relative">
        {children}
      </div>

      {/* Resize handle in edit mode */}
      {isEditMode && onMouseDownResize && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            onMouseDownResize(e);
          }}
          className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize flex items-center justify-center opacity-40 hover:opacity-100 group-hover:opacity-80"
          title="Resize widget"
        >
          <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-[#adc6ff]" />
        </div>
      )}
    </div>
  );
};
