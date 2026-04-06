import { useState, useEffect, useRef } from "react";
import { RefreshCw, Map as MapIcon, ChevronDown, User } from "lucide-react";
import { DebugLabel } from "../../context/DebugContext";
import { Sidebar } from "../atlas/Sidebar";
import { MapViewport } from "../atlas/MapViewport";
import { ConfirmationModal } from "../ConfirmationModal";
import { toast } from "sonner";
import { findConnectedComponent } from "../../lib/atlasUtils";
import { AtlasHelpOverlay } from "../atlas/AtlasHelpOverlay";
import { useAtlasData } from "../atlas/useAtlasData";

export const AtlasTab = ({ user }: { user: any }) => {
  const CELL_SIZE = 80;
  const PADDING = 100;
  const VIRTUAL_COLS = 200;
  const VIRTUAL_ROWS = 200;

  const {
    systems, setSystems,
    connections, setConnections,
    loading,
    isExtrapolating,
    isUpdating, setIsUpdating,
    isSavingDraft,
    mapTitle, setMapTitle,
    snapshots,
    currentSnapshotId, setCurrentSnapshotId,
    currentMapRef, setCurrentMapRef,
    isSettingDefault,
    panOffset, setPanOffset,
    zoom, setZoom,
    isPanning, setIsPanning,
    dragStart, setDragStart,
    selectedSystem, setSelectedSystem,
    isNestSelection, setIsNestSelection,
    targetSystem, setTargetSystem,
    direction, setDirection,
    fetchMap,
    fetchSnapshots,
    handleExtrapolate,
    handleSaveDraft,
    handleSetDefault
  } = useAtlasData(user, CELL_SIZE, PADDING);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Container ref for responsive help overlay
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isHelpOpen && containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, [isHelpOpen]);

  // Close help when component unmounts (switching tabs)
  useEffect(() => {
    return () => setIsHelpOpen(false);
  }, []);

  const handleUpdateMap = async () => {
    if (isHelpOpen) return;
    if (systems.length === 0) return;
    
    setIsUpdating(true);
    try {
      const checkRes = await fetch(`/api/atlas/check-existing?is_draft=false`);
      const checkData = await checkRes.json();
      
      const isOverwrite = checkData.exists;
      const title = isOverwrite ? "Overwrite Protocol" : "Publication Protocol";
      const message = isOverwrite 
        ? "You are about to overwrite your current live map. This will update the public starmap for all users. Proceed?"
        : "You are about to create a public live map. This will be visible to all users. Proceed?";

      setModalConfig({
        isOpen: true,
        title,
        message,
        confirmText: isOverwrite ? "Overwrite" : "Publish",
        isDestructive: isOverwrite,
        onConfirm: async () => {
          try {
            const res = await fetch('/api/atlas/ingest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                map_name: mapTitle, 
                map_data: { systems, connections },
                is_draft: false
              })
            });
            if (!res.ok) throw new Error("Update failed");
            const result = await res.json();
            toast.success("STARMAP UPDATED SUCCESSFULLY");
            
            fetchSnapshots();
            if (result.data?.id) {
              setCurrentSnapshotId(result.data.id);
            }
            if (result.data?.map_ref) {
              setCurrentMapRef(result.data.map_ref);
            }
          } catch (error) {
            console.error(error);
            toast.error("UPDATE FAILED");
          }
        }
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearMap = () => {
    if (isHelpOpen) return;
    setModalConfig({
      isOpen: true,
      title: "Clear Map Protocol",
      message: "Are you sure you want to clear the entire map? This will remove all systems and connections, giving you a blank slate. All unsaved changes will be lost.",
      confirmText: "Clear Map",
      isDestructive: true,
      onConfirm: () => {
        setSystems([]);
        setConnections([]);
        setSelectedSystem(null);
        setIsNestSelection(false);
        setTargetSystem("");
        setCurrentSnapshotId(null);
        setMapTitle(`${user?.username || 'User'}'s Map`);
      }
    });
  };

  const handleResetMap = () => {
    if (isHelpOpen) return;
    setModalConfig({
      isOpen: true,
      title: "Reset Protocol",
      message: "Are you sure you want to reset the map? This will undo all unsaved changes and reload your current map.",
      confirmText: "Reset Map",
      isDestructive: true,
      onConfirm: () => {
        fetchMap(currentSnapshotId || undefined);
        setSelectedSystem(null);
        setIsNestSelection(false);
        setTargetSystem("");
      }
    });
  };

  // Panning Handlers
  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (isHelpOpen) return;
    if ((e.target as HTMLElement).closest('.system-node')) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (isHelpOpen) return;
    if (isPanning) {
      setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMapMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isHelpOpen) return;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * delta, 0.1), 3);
    
    const container = document.getElementById('map-viewport');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dx = (mouseX - panOffset.x) / zoom;
    const dy = (mouseY - panOffset.y) / zoom;
    
    setPanOffset({
      x: mouseX - dx * newZoom,
      y: mouseY - dy * newZoom
    });
    setZoom(newZoom);
  };

  // System Selection/Movement Logic
  const handleSystemClick = (name: string, e: React.MouseEvent) => {
    if (isHelpOpen) return;
    if (e.ctrlKey) {
      // Rotate nest 30 degrees clockwise around the clicked system
      const nestNames = findConnectedComponent(name, systems, connections);
      const centerSys = systems.find(s => s.name === name);
      if (!centerSys) return;

      const angle = 30 * (Math.PI / 180); // 30 degrees in radians
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      setSystems(prev => prev.map(s => {
        if (nestNames.includes(s.name)) {
          const dx = s.grid_x - centerSys.grid_x;
          const dy = s.grid_y - centerSys.grid_y;
          
          // Rotate (dx, dy) clockwise
          const newDx = dx * cos - dy * sin;
          const newDy = dx * sin + dy * cos;
          
          return {
            ...s,
            grid_x: Math.round(centerSys.grid_x + newDx),
            grid_y: Math.round(centerSys.grid_y + newDy)
          };
        }
        return s;
      }));
      return;
    }

    if (selectedSystem === name) {
      setSelectedSystem(null);
      setIsNestSelection(false);
    } else if (selectedSystem) {
      // Link the two systems
      const from = selectedSystem;
      const to = name;
      
      // Check if connection already exists
      const existingIndex = connections.findIndex(c => 
        (c.from_system === from && c.to_system === to) ||
        (c.from_system === to && c.to_system === from)
      );

      if (existingIndex !== -1) {
        // Remove existing connection if it's manual
        if (connections[existingIndex].is_manual) {
          setConnections(prev => prev.filter((_, i) => i !== existingIndex));
        }
      } else {
        setConnections(prev => [...prev, { from_system: from, to_system: to, is_manual: true }]);
      }
      
      setSelectedSystem(null);
      setIsNestSelection(false);
    } else {
      setSelectedSystem(name);
      setIsNestSelection(false);
    }
  };

  const handleSystemRightClick = (name: string) => {
    if (isHelpOpen) return;
    setSelectedSystem(name);
    setIsNestSelection(true);
  };

  const handleMoveToGrid = (newX: number, newY: number) => {
    if (isHelpOpen) return;
    if (!selectedSystem) return;
    
    const sys = systems.find(s => s.name === selectedSystem);
    if (!sys) return;

    if (newX === sys.grid_x && newY === sys.grid_y) {
      setSelectedSystem(null);
      setIsNestSelection(false);
      return;
    }
    
    if (isNestSelection) {
      // Move the whole nest
      const nestNames = findConnectedComponent(sys.name, systems, connections);
      const dx = newX - sys.grid_x;
      const dy = newY - sys.grid_y;

      setSystems(prev => prev.map(s => {
        if (nestNames.includes(s.name)) {
          return { ...s, grid_x: s.grid_x + dx, grid_y: s.grid_y + dy };
        }
        return s;
      }));
    } else {
      // Update only the selected system
      setSystems(prev => prev.map(s => 
        s.name === selectedSystem ? { ...s, grid_x: newX, grid_y: newY } : s
      ));
    }

    setSelectedSystem(null);
    setIsNestSelection(false);
  };

  return (
    <DebugLabel label="Atlas Module" className="w-full h-full flex flex-row overflow-hidden bg-bg-main relative" ref={containerRef}>
      <Sidebar 
        targetSystem={targetSystem}
        setTargetSystem={setTargetSystem}
        direction={direction}
        setDirection={setDirection}
        isExtrapolating={isExtrapolating}
        handleExtrapolate={handleExtrapolate}
        handleUpdateMap={handleUpdateMap}
        handleSaveDraft={handleSaveDraft}
        handleClearMap={handleClearMap}
        isUpdating={isUpdating}
        isSavingDraft={isSavingDraft}
        mapTitle={mapTitle}
        setMapTitle={setMapTitle}
        systemsCount={systems.length}
        connectionsCount={connections.length}
        zoom={zoom}
        isHelpOpen={isHelpOpen}
        setIsHelpOpen={setIsHelpOpen}
      />

      <MapViewport 
        loading={loading}
        isUpdating={isUpdating}
        systems={systems}
        connections={connections}
        panOffset={panOffset}
        zoom={zoom}
        selectedSystem={selectedSystem}
        isNestSelection={isNestSelection}
        cellSize={CELL_SIZE}
        padding={PADDING}
        virtualCols={VIRTUAL_COLS}
        virtualRows={VIRTUAL_ROWS}
        handleMapMouseDown={handleMapMouseDown}
        handleMapMouseMove={handleMapMouseMove}
        handleMapMouseUp={handleMapMouseUp}
        handleWheel={handleWheel}
        handleSystemClick={handleSystemClick}
        handleSystemRightClick={handleSystemRightClick}
        handleMoveToGrid={handleMoveToGrid}
      />

      {/* Top Right Controls - Map Selection */}
      <div className="absolute top-4 right-6 z-20 flex items-start gap-3">
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <div className="relative">
              <select 
                value={currentSnapshotId || ""}
                disabled={isHelpOpen}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedSnapshot = snapshots.find(s => s.id === selectedId);
                  fetchMap(selectedId);
                  if (selectedSnapshot?.map_ref) {
                    setCurrentMapRef(selectedSnapshot.map_ref);
                  }
                }}
                className="appearance-none bg-bg-main/80 backdrop-blur-md border border-accent/20 px-3 py-2 pr-8 text-[10px] uppercase tracking-widest outline-none focus:border-accent cursor-pointer text-text-main min-w-[200px] disabled:opacity-50"
              >
                <option value="" disabled>Select Map...</option>
                {snapshots.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.map_name || s.creator_username || "Untitled Map"}
                    {s.is_draft ? " (DRAFT)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim" />
            </div>
            <button 
              onClick={handleSetDefault}
              disabled={isSettingDefault || !currentMapRef || isHelpOpen}
              className="px-3 py-2 bg-bg-main/80 border border-accent/20 text-text-accent hover:bg-accent/10 text-[9px] uppercase tracking-widest disabled:opacity-50 transition-all flex items-center gap-2"
              title="Set as Default"
            >
              {isSettingDefault ? <RefreshCw size={12} className="animate-spin" /> : <User size={12} />}
              Set Default
            </button>
          </div>
          <label className="text-[8px] uppercase tracking-[0.2em] text-text-dim mt-0.5 mr-1 font-display font-medium">&gt;_active starmap</label>
        </div>
      </div>

      {/* Help Overlay */}
      <AtlasHelpOverlay 
        isHelpOpen={isHelpOpen} 
        setIsHelpOpen={setIsHelpOpen} 
        dimensions={dimensions} 
      />

      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        isDestructive={modalConfig.isDestructive}
      />
    </DebugLabel>
  );
};
