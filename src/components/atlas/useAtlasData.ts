import { useState, useEffect } from "react";
import { toast } from "sonner";
import { findConnectedComponent } from "../../lib/atlasUtils";

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

export const useAtlasData = (user: any, CELL_SIZE: number, PADDING: number) => {
  const [systems, setSystems] = useState<System[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExtrapolating, setIsExtrapolating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [mapTitle, setMapTitle] = useState(`${user?.username || 'User'}'s Map`);
  
  // Snapshots State
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [currentSnapshotId, setCurrentSnapshotId] = useState<string | null>(null);
  const [currentMapRef, setCurrentMapRef] = useState<string | null>(null);
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  // Map View State
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.8);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // System Selection State
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [isNestSelection, setIsNestSelection] = useState(false);

  // Form State
  const [targetSystem, setTargetSystem] = useState("");
  const [direction, setDirection] = useState("C");

  useEffect(() => {
    if (user?.username && mapTitle === "User's Map") {
      setMapTitle(`${user.username}'s Map`);
    }
  }, [user]);

  const fetchMap = async (snapshotId?: string) => {
    setLoading(true);
    try {
      const url = snapshotId ? `/api/atlas/map?snapshot_id=${snapshotId}` : '/api/atlas/map';
      const res = await fetch(url, { credentials: 'include' });
      const result = await res.json();
      if (result.success && result.data) {
        setSystems(result.data.systems || []);
        setConnections(result.data.connections || []);
        if (result.map_name) {
          setMapTitle(result.map_name);
        }
        if (result.snapshot_id) {
          setCurrentSnapshotId(result.snapshot_id);
        }
        if (result.map_ref) {
          setCurrentMapRef(result.map_ref);
        }
      }
    } catch (error) {
      console.error("Fetch Map Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSnapshots = async () => {
    try {
      const res = await fetch('/api/atlas/snapshots', { credentials: 'include' });
      const result = await res.json();
      if (result.success) {
        setSnapshots(result.data);
      }
    } catch (error) {
      console.error("Fetch Snapshots Error:", error);
    }
  };

  useEffect(() => {
    fetchMap();
    fetchSnapshots();
  }, []);

  const centerMap = () => {
    if (systems.length === 0) return;
    
    const minX = Math.min(...systems.map(s => s.grid_x));
    const maxX = Math.max(...systems.map(s => s.grid_x));
    const minY = Math.min(...systems.map(s => s.grid_y));
    const maxY = Math.max(...systems.map(s => s.grid_y));

    const centerX = (minX + maxX) / 2 * CELL_SIZE + PADDING;
    const centerY = (minY + maxY) / 2 * CELL_SIZE + PADDING;

    const container = document.getElementById('map-viewport');
    if (container) {
      const { width, height } = container.getBoundingClientRect();
      setPanOffset({
        x: width / 2 - centerX * zoom,
        y: height / 2 - centerY * zoom
      });
    }
  };

  useEffect(() => {
    if (systems.length > 0 && panOffset.x === 0 && panOffset.y === 0) {
      centerMap();
    }
  }, [systems]);

  const handleExtrapolate = async () => {
    if (!targetSystem.trim()) return;
    setIsExtrapolating(true);
    try {
      const res = await fetch('/api/atlas/extrapolate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          system_name: targetSystem, 
          direction,
          current_systems: systems 
        }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error("Extrapolation failed");
      const result = await res.json();
      
      if (result.success) {
        const newSystems = [...systems];
        result.systems.forEach((sys: System) => {
          if (!newSystems.find(s => s.name === sys.name)) {
            newSystems.push(sys);
          }
        });
        
        const newConnections = [...connections];
        result.connections.forEach((conn: Connection) => {
          if (!newConnections.find(c => 
            (c.from_system === conn.from_system && c.to_system === conn.to_system) ||
            (c.from_system === conn.to_system && c.to_system === conn.from_system)
          )) {
            newConnections.push(conn);
          }
        });

        setSystems(newSystems);
        setConnections(newConnections);
        setTargetSystem("");
        toast.success("SECTOR EXTRAPOLATED");
      }
    } catch (error) {
      console.error(error);
      toast.error("EXTRAPOLATION FAILED");
    } finally {
      setIsExtrapolating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (systems.length === 0) return;
    
    setIsSavingDraft(true);
    try {
      const res = await fetch('/api/atlas/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          map_name: mapTitle, 
          map_data: { systems, connections },
          is_draft: true
        }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error("Draft save failed");
      const result = await res.json();
      toast.success("DRAFT SAVED SUCCESSFULLY");
      
      if (result.data?.id) {
        setCurrentSnapshotId(result.data.id);
      }
      if (result.data?.map_ref) {
        setCurrentMapRef(result.data.map_ref);
      }
    } catch (error) {
      console.error(error);
      toast.error("DRAFT SAVE FAILED");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSetDefault = async () => {
    if (!currentMapRef) return;
    setIsSettingDefault(true);
    try {
      const res = await fetch('/api/atlas/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ map_name: currentMapRef }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error("Failed to set default");
      toast.success("DEFAULT MAP UPDATED");
    } catch (error) {
      console.error(error);
      toast.error("FAILED TO SET DEFAULT");
    } finally {
      setIsSettingDefault(false);
    }
  };

  return {
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
  };
};
