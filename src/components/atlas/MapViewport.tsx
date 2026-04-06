import { RefreshCw } from "lucide-react";
import { SystemNode } from "./SystemNode";
import { findConnectedComponent } from "../../lib/atlasUtils";
import { useMemo } from "react";

interface System {
  name: string;
  grid_x: number;
  grid_y: number;
}

interface Connection {
  from_system: string;
  to_system: string;
  is_manual?: boolean;
}

interface MapViewportProps {
  loading: boolean;
  isUpdating: boolean;
  systems: System[];
  connections: Connection[];
  panOffset: { x: number; y: number };
  zoom: number;
  selectedSystem: string | null;
  isNestSelection: boolean;
  cellSize: number;
  padding: number;
  virtualCols: number;
  virtualRows: number;
  handleMapMouseDown: (e: React.MouseEvent) => void;
  handleMapMouseMove: (e: React.MouseEvent) => void;
  handleMapMouseUp: () => void;
  handleWheel: (e: React.WheelEvent) => void;
  handleSystemClick: (name: string, e: React.MouseEvent) => void;
  handleSystemRightClick: (name: string) => void;
  handleMoveToGrid: (x: number, y: number) => void;
}

export const MapViewport = ({
  loading,
  isUpdating,
  systems,
  connections,
  panOffset,
  zoom,
  selectedSystem,
  isNestSelection,
  cellSize,
  padding,
  virtualCols,
  virtualRows,
  handleMapMouseDown,
  handleMapMouseMove,
  handleMapMouseUp,
  handleWheel,
  handleSystemClick,
  handleSystemRightClick,
  handleMoveToGrid
}: MapViewportProps) => {
  // Calculate potential move targets around the selected system
  const moveTargets = useMemo(() => {
    if (!selectedSystem) return [];
    const sys = systems.find(s => s.name === selectedSystem);
    if (!sys) return [];

    const targets = [];
    const radius = 8; // Show targets in an 8-unit radius
    
    // Use a Set for faster lookup of occupied positions
    const occupied = new Set(systems.map(s => `${s.grid_x},${s.grid_y}`));

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (dx === 0 && dy === 0) continue;
        const tx = sys.grid_x + dx;
        const ty = sys.grid_y + dy;
        if (tx >= 0 && tx < virtualCols && ty >= 0 && ty < virtualRows) {
          // Only show if not occupied by another system
          if (!occupied.has(`${tx},${ty}`)) {
            targets.push({ x: tx, y: ty });
          }
        }
      }
    }
    return targets;
  }, [selectedSystem, systems, virtualCols, virtualRows]);

  // If nest selection, find all names in the nest
  const nestNames = useMemo(() => {
    if (!selectedSystem || !isNestSelection) return [];
    return findConnectedComponent(selectedSystem, systems, connections);
  }, [selectedSystem, isNestSelection, systems, connections]);

  return (
    <div 
      id="map-viewport"
      className="flex-1 h-full relative flex flex-col overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleMapMouseDown}
      onMouseMove={handleMapMouseMove}
      onMouseUp={handleMapMouseUp}
      onMouseLeave={handleMapMouseUp}
      onWheel={handleWheel}
    >
      {isUpdating && (
        <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-bg-main border border-accent/20 text-accent text-[10px] uppercase tracking-widest">
            <RefreshCw size={14} className="animate-spin" />
            Recalculating Layout...
          </div>
        </div>
      )}
      {/* Map Content */}
      <div className="flex-1 relative bg-[radial-gradient(circle_at_center,rgba(255,99,33,0.03)_0%,transparent_70%)]">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <RefreshCw size={32} className="text-accent animate-spin" />
            <div className="text-[10px] uppercase tracking-[0.3em] text-text-dim animate-pulse">Synchronizing Starmap...</div>
          </div>
        ) : (
          <div 
            className="absolute origin-top-left transition-transform duration-75 ease-out" 
            style={{ 
              width: virtualCols * cellSize + padding * 2, 
              height: virtualRows * cellSize + padding * 2,
              padding: padding,
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`
            }}
          >
            {/* Background Grid */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(var(--color-accent) 1px, transparent 1px)`,
                backgroundSize: `${cellSize}px ${cellSize}px`,
                backgroundPosition: `${padding}px ${padding}px`
              }}
            />

            {/* SVG Connections */}
            <svg 
              className="absolute inset-0 pointer-events-none" 
              style={{ width: '100%', height: '100%' }}
            >
              {connections.map((conn, i) => {
                const from = systems.find(s => s.name === conn.from_system);
                const to = systems.find(s => s.name === conn.to_system);
                if (!from || !to) return null;

                const x1 = from.grid_x * cellSize + cellSize / 2 + padding;
                const y1 = from.grid_y * cellSize + cellSize / 2 + padding;
                const x2 = to.grid_x * cellSize + cellSize / 2 + padding;
                const y2 = to.grid_y * cellSize + cellSize / 2 + padding;

                return (
                  <line 
                    key={i}
                    x1={x1} y1={y1}
                    x2={x2} y2={y2}
                    stroke={conn.is_manual ? "#FFD700" : "var(--color-accent)"}
                    strokeWidth={conn.is_manual ? "2" : "1.5"}
                    strokeOpacity={conn.is_manual ? "0.8" : "0.4"}
                  />
                );
              })}
            </svg>

            {/* Move Targets (Faint Grey Circles) */}
            {moveTargets.map((target, i) => (
              <div
                key={`target-${i}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveToGrid(target.x, target.y);
                }}
                className="absolute w-4 h-4 rounded-full border border-accent/20 hover:bg-accent/20 cursor-pointer z-0 transition-colors"
                style={{
                  left: target.x * cellSize + cellSize / 2 + padding - 8,
                  top: target.y * cellSize + cellSize / 2 + padding - 8,
                }}
              />
            ))}

            {/* Systems */}
            {systems.map((sys) => {
              const isPartOfNest = nestNames.includes(sys.name);
              return (
                <SystemNode 
                  key={sys.name}
                  sys={sys}
                  cellSize={cellSize}
                  padding={padding}
                  isSearchResult={false}
                  isSelected={selectedSystem === sys.name || isPartOfNest}
                  zoom={zoom}
                  onClick={(e) => handleSystemClick(sys.name, e)}
                  onContextMenu={() => handleSystemRightClick(sys.name)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
