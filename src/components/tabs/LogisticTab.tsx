import { useState, useRef, useEffect } from "react";
import { DebugLabel } from "../../context/DebugContext";
import { Plus } from "lucide-react";
import { ConnectionLine } from "./logistic/ConnectionLine";
import { WarpGate } from "./logistic/WarpGate";
import { FoamInputModal } from "./logistic/FoamInputModal";
import { GateEditModal } from "./logistic/GateEditModal";
import { useLogisticData } from "./logistic/useLogisticData";
import { MAX_FOAM } from "./logistic/types";

export const LogisticTab = ({ user, initialData }: { user?: any; initialData?: any }) => {
  const isAdmin = user?.rank >= 1;
  const isSuperAdmin = user?.rank >= 2;

  const { gates, allUsers, isLoading, gateRefs, fetchGates } = useLogisticData(isAdmin);

  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [activeGateId, setActiveGateId] = useState<string | null>(null);
  const [editGateId, setEditGateId] = useState<string | null>(null);
  const [showAddGate, setShowAddGate] = useState(false);
  
  const [inputAmount, setInputAmount] = useState("");
  const [gateForm, setGateForm] = useState({
    name: "",
    code: "",
    owner_username: "",
    owner_uid: "",
    fuel_status: "OFFLINE",
    fuel_value: 0,
    connected_to: "",
    built: false
  });

  const gridRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } }[]>([]);

  const updateConnections = () => {
    if (!gridRef.current) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    if (gridRect.width === 0) return;

    const newConnections: any[] = [];
    const processed = new Set<string>();
    const GATE_RADIUS = 62;

    gates.forEach(gate => {
      const connName = gate.connected_to?.trim();
      if (connName && !processed.has(gate.name.trim())) {
        const startEl = gateRefs.current.get(gate.name.trim());
        const endEl = gateRefs.current.get(connName);

        if (startEl && endEl) {
          const startRect = startEl.getBoundingClientRect();
          const endRect = endEl.getBoundingClientRect();

          if (startRect.width > 0 && endRect.width > 0) {
            const startCenterX = (startRect.left + startRect.width / 2) - gridRect.left;
            const startCenterY = (startRect.top + startRect.height / 2) - gridRect.top;
            const endCenterX = (endRect.left + endRect.width / 2) - gridRect.left;
            const endCenterY = (endRect.top + endRect.height / 2) - gridRect.top;

            const startAngleRad = (150 - 90) * Math.PI / 180;
            const endAngleRad = (210 - 90) * Math.PI / 180;

            newConnections.push({
              start: {
                x: startCenterX + GATE_RADIUS * Math.cos(startAngleRad),
                y: startCenterY + GATE_RADIUS * Math.sin(startAngleRad)
              },
              end: {
                x: endCenterX + GATE_RADIUS * Math.cos(endAngleRad),
                y: endCenterY + GATE_RADIUS * Math.sin(endAngleRad)
              }
            });
            processed.add(gate.name.trim());
            processed.add(connName);
          }
        }
      }
    });
    setConnections(newConnections);
  };

  useEffect(() => {
    updateConnections();
    const timers = [100, 500, 1000, 2000].map(ms => setTimeout(updateConnections, ms));
    return () => timers.forEach(clearTimeout);
  }, [gates]);

  useEffect(() => {
    window.addEventListener('resize', updateConnections);
    return () => window.removeEventListener('resize', updateConnections);
  }, [gates]);

  useEffect(() => {
    if (user && !selectedDonor) {
      setSelectedDonor({ uid: user.id, username: user.username });
    }
  }, [user]);

  const handleInputFoam = (id: string) => {
    setActiveGateId(id);
  };

  const handleEditGate = (id: string) => {
    const gate = gates.find(g => g.id === id);
    if (gate) {
      setGateForm({
        name: gate.name,
        code: gate.code,
        owner_username: gate.owner_username,
        owner_uid: gate.owner_uid,
        fuel_status: gate.fuel_status,
        fuel_value: gate.fuel_value,
        connected_to: gate.connected_to,
        built: gate.built || false
      });
      setEditGateId(id);
    }
  };

  const handleSaveGate = async () => {
    if (!gateForm.name.trim() || !gateForm.code.trim()) return;
    
    try {
      const url = editGateId ? `/api/gates/${editGateId}` : "/api/gates";
      const method = editGateId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gateForm),
        credentials: 'include'
      });

      if (res.ok) {
        if (gateForm.connected_to) {
          const targetGate = gates.find(g => g.name === gateForm.connected_to);
          if (targetGate) {
            await fetch(`/api/gates/${targetGate.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...targetGate,
                connected_to: gateForm.name
              }),
              credentials: 'include'
            });
          }
        }

        setEditGateId(null);
        setShowAddGate(false);
        fetchGates();
      }
    } catch (e) {
      console.error("Save gate error:", e);
    }
  };

  const handleDeleteGate = async () => {
    if (!editGateId || !isSuperAdmin) return;
    if (!confirm("Are you absolutely sure you want to delete this gate? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/gates/${editGateId}`, {
        method: "DELETE",
        credentials: 'include'
      });

      if (res.ok) {
        setEditGateId(null);
        fetchGates();
      }
    } catch (e) {
      console.error("Delete gate error:", e);
    }
  };

  const handleAddGate = () => {
    setGateForm({
      name: `GATE_ID_${(gates.length + 1).toString().padStart(3, '0')}`,
      code: `G-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      owner_username: user?.username || "UNKNOWN",
      owner_uid: user?.id || "",
      fuel_status: "OFFLINE",
      fuel_value: 0,
      connected_to: "",
      built: false
    });
    setShowAddGate(true);
  };

  const handleSubmitFoam = async () => {
    if (!selectedDonor || !inputAmount || !activeGateId) return;
    const amount = parseInt(inputAmount);
    if (isNaN(amount) || amount <= 0) return;

    const gate = gates.find(g => g.id === activeGateId);
    if (!gate) return;

    try {
      const res = await fetch("/api/logistic/input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gate_name: gate.name,
          amount: amount,
          donor_uid: selectedDonor.uid
        }),
        credentials: 'include'
      });

      if (res.ok) {
        setActiveGateId(null);
        setInputAmount("");
      }
    } catch (e) {
      console.error("Submit foam error:", e);
    }
  };

  const totalFoam = gates.reduce((acc, g) => acc + g.foam, 0);
  const totalMaxFoam = gates.length * MAX_FOAM;
  const totalProgress = totalMaxFoam > 0 ? (totalFoam / totalMaxFoam) * 100 : 0;

  return (
    <DebugLabel label="Logistic Module" className="flex flex-col h-full p-4 overflow-y-auto custom-scrollbar relative">
      <div className="flex items-center justify-between mb-0 border-b border-accent/10 pb-2">
        <div className="flex items-center gap-6">
          <div className="text-[11px] uppercase tracking-[0.5em] text-accent font-black animate-pulse whitespace-nowrap">
            LOGISTIC_NETWORK: {totalProgress >= 100 ? "STABILIZED" : "INITIALIZING"}
          </div>
          <div className="h-3 w-px bg-accent/20 hidden sm:block" />
          <p className="text-[9px] uppercase tracking-widest text-text-dim opacity-50 hidden md:block whitespace-nowrap">
            Quantum state stabilization active... awaiting nav-sync
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleAddGate}
            className="px-2 py-1 border border-accent/30 text-accent text-[8px] uppercase tracking-widest hover:bg-accent/20 transition-all font-bold flex items-center gap-1"
          >
            <Plus size={10} />
            Add Gate
          </button>
        )}
      </div>

      <div className="relative" ref={gridRef}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 text-accent" style={{ minHeight: '100%' }}>
          {connections.map((conn, i) => (
            <ConnectionLine key={i} start={conn.start} end={conn.end} />
          ))}
        </svg>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-16 gap-y-10 justify-items-center py-2 pl-16 relative z-10">
          {gates.map((gate) => (
            <WarpGate 
              key={gate.id} 
              data={gate} 
              onInputFoam={handleInputFoam} 
              onEditGate={handleEditGate}
              isAdmin={isAdmin}
              allGates={gates}
              gateRef={(el) => {
                const name = gate.name.trim();
                if (el) gateRefs.current.set(name, el);
                else gateRefs.current.delete(name);
              }}
            />
          ))}
        </div>
      </div>

      <FoamInputModal
        activeGateId={activeGateId}
        gates={gates}
        isAdmin={isAdmin}
        allUsers={allUsers}
        selectedDonor={selectedDonor}
        setSelectedDonor={setSelectedDonor}
        user={user}
        inputAmount={inputAmount}
        setInputAmount={setInputAmount}
        onClose={() => setActiveGateId(null)}
        onSubmit={handleSubmitFoam}
      />

      <GateEditModal
        editGateId={editGateId}
        showAddGate={showAddGate}
        gateForm={gateForm}
        setGateForm={setGateForm}
        allUsers={allUsers}
        gates={gates}
        isSuperAdmin={isSuperAdmin}
        onClose={() => { setEditGateId(null); setShowAddGate(false); }}
        onSave={handleSaveGate}
        onDelete={handleDeleteGate}
      />

      <div className="mt-auto pt-8 border-t border-accent/10 flex justify-between items-center">
        <div className="text-[8px] uppercase tracking-widest text-text-dim">
          Array Status: {totalProgress >= 100 ? "Active" : "Standby"}
        </div>
        <div className="text-[8px] uppercase tracking-widest text-accent font-bold">
          Sync: {totalProgress.toFixed(2)}%
        </div>
      </div>
    </DebugLabel>
  );
};
