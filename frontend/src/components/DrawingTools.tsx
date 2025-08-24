import React from 'react';
import {
  MousePointer2,
  Square,
  Move,
  ZoomIn,
  ZoomOut,
  Grid,
  Undo2,
  Redo2,
  Maximize2,
  Save,
} from 'lucide-react';
import { useMapperStore } from '../stores/mapperStore';
import { DrawingTool } from '../types';
import { clsx } from 'clsx';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  label,
  onClick,
  isActive = false,
  disabled = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={clsx(
      'p-2 rounded-lg transition-all duration-200',
      'hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed',
      isActive && 'bg-primary-100 text-primary-600 hover:bg-primary-200'
    )}
  >
    {icon}
  </button>
);

export const DrawingTools: React.FC = () => {
  const {
    currentTool,
    setCurrentTool,
    showGrid,
    toggleGrid,
    snapToGrid,
    toggleSnapToGrid,
    history,
    historyIndex,
    undo,
    redo,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
  } = useMapperStore();

  const tools = [
    {
      tool: DrawingTool.SELECT,
      icon: <MousePointer2 size={20} />,
      label: 'Select (V)',
    },
    {
      tool: DrawingTool.RECTANGLE,
      icon: <Square size={20} />,
      label: 'Draw Rectangle (R)',
    },
    {
      tool: DrawingTool.PAN,
      icon: <Move size={20} />,
      label: 'Pan (H)',
    },
  ];

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setCurrentTool(DrawingTool.SELECT);
          break;
        case 'r':
          setCurrentTool(DrawingTool.RECTANGLE);
          break;
        case 'h':
          setCurrentTool(DrawingTool.PAN);
          break;
        case 'g':
          toggleGrid();
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            redo();
          }
          break;
        case '=':
        case '+':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetZoom();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setCurrentTool, toggleGrid, undo, redo, zoomIn, zoomOut, resetZoom]);

  return (
    <div className="flex items-center gap-2 p-3 bg-white shadow-lg rounded-lg">
      {/* Tool selection */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
        {tools.map(({ tool, icon, label }) => (
          <ToolButton
            key={tool}
            icon={icon}
            label={label}
            onClick={() => setCurrentTool(tool)}
            isActive={currentTool === tool}
          />
        ))}
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
        <ToolButton
          icon={<ZoomIn size={20} />}
          label="Zoom In (Ctrl++)"
          onClick={zoomIn}
        />
        <ToolButton
          icon={<ZoomOut size={20} />}
          label="Zoom Out (Ctrl+-)"
          onClick={zoomOut}
        />
        <ToolButton
          icon={<Maximize2 size={20} />}
          label="Fit to Screen"
          onClick={fitToScreen}
        />
      </div>

      {/* Grid controls */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
        <ToolButton
          icon={<Grid size={20} />}
          label="Toggle Grid (G)"
          onClick={toggleGrid}
          isActive={showGrid}
        />
        <button
          onClick={toggleSnapToGrid}
          title="Snap to Grid"
          className={clsx(
            'px-2 py-1 text-sm rounded transition-all duration-200',
            snapToGrid
              ? 'bg-primary-100 text-primary-600 hover:bg-primary-200'
              : 'hover:bg-gray-100'
          )}
        >
          Snap
        </button>
      </div>

      {/* History controls */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
        <ToolButton
          icon={<Undo2 size={20} />}
          label="Undo (Ctrl+Z)"
          onClick={undo}
          disabled={historyIndex < 0}
        />
        <ToolButton
          icon={<Redo2 size={20} />}
          label="Redo (Ctrl+Y)"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
        />
      </div>

      {/* Save button */}
      <ToolButton
        icon={<Save size={20} />}
        label="Save (Ctrl+S)"
        onClick={() => {
          // Trigger save action
          window.dispatchEvent(new CustomEvent('saveChanges'));
        }}
      />
    </div>
  );
};