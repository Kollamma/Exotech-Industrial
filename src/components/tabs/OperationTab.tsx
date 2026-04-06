import { useState, useEffect } from "react";
import { DebugLabel } from "../../context/DebugContext";
import { Plus, Crosshair, Pickaxe, Shield, ShieldAlert, Hammer, ChevronRight } from "lucide-react";
import { StartOperationModal } from "./operations/StartOperationModal";
import { io } from "socket.io-client";
import { ASSET_OPTIONS } from "./manifest/ManifestForm";

interface Operation {
  id: string;
  operation_number: number;
  lead_uid: string;
  username: string; // Lead username
  operation_type: string; // Operation Type
  system_id: string; // Target System
  description: string; // Description
  members: string;
  contributions: string;
  status: string;
  created_at: string;
}

export const OperationTab = ({ user }: { user?: any }) => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [contributeItem, setContributeItem] = useState("");
  const [contributeAmount, setContributeAmount] = useState("");
  const [isSubmittingContribution, setIsSubmittingContribution] = useState(false);

  const fetchOperations = async () => {
    try {
      const res = await fetch("/api/operations");
      const data = await res.json();
      if (Array.isArray(data)) {
        setOperations(data);
        // Update selectedOp if it exists in the new data
        if (selectedOp) {
          const updatedOp = data.find(op => op.id === selectedOp.id);
          if (updatedOp) setSelectedOp(updatedOp);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinOp = async (opId: string) => {
    try {
      const res = await fetch(`/api/operations/${opId}/join`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to join operation");
    } catch (e) {
      console.error(e);
    }
  };

  const handleContribute = async () => {
    if (!selectedOp || !contributeItem || !contributeAmount) return;
    setIsSubmittingContribution(true);
    try {
      const res = await fetch(`/api/operations/${selectedOp.id}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_type: contributeItem,
          amount: contributeAmount,
          username: user?.username || "Unknown"
        })
      });
      if (res.ok) {
        setContributeItem("");
        setContributeAmount("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to contribute");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingContribution(false);
    }
  };

  const handleConfirmContribution = async (opId: string, contributionId: string) => {
    try {
      const res = await fetch(`/api/operations/${opId}/contributions/${contributionId}/confirm`, {
        method: "POST"
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to confirm contribution");
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOperations();

    const socket = io();
    socket.on("operation_update", () => {
      fetchOperations();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleOpCreated = () => {
    fetchOperations();
  };

  const getOpIcon = (type: string) => {
    switch (type) {
      case "Mining": return <Pickaxe size={16} className="text-orange-400" />;
      case "Scouting": return <Crosshair size={16} className="text-blue-400" />;
      case "Defence": return <Shield size={16} className="text-green-400" />;
      case "Offense": return <ShieldAlert size={16} className="text-red-400" />;
      case "Construction": return <Hammer size={16} className="text-yellow-400" />;
      default: return <Crosshair size={16} className="text-accent" />;
    }
  };

  return (
    <div className="flex h-full p-1 gap-1 overflow-hidden">
      {/* Left Panel - 30% */}
      <DebugLabel label="Operations List" className="w-[30%] flex flex-col gap-1 border border-accent/20 bg-bg-main/40 p-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-text-accent flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={16} />
          <span className="text-[10px] uppercase tracking-widest font-bold">Start Operation</span>
        </button>

        <div className="flex-grow overflow-y-auto custom-scrollbar mt-2 space-y-2">
          {isLoading ? (
            <div className="text-[10px] uppercase tracking-widest text-text-dim text-center py-4 animate-pulse">
              Loading Operations...
            </div>
          ) : operations.length === 0 ? (
            <div className="text-[10px] uppercase tracking-widest text-text-dim text-center py-4">
              No active operations
            </div>
          ) : (
            operations.map((op) => (
              <div
                key={op.id}
                onClick={() => setSelectedOp(op)}
                className={`p-3 border cursor-pointer transition-all ${
                  selectedOp?.id === op.id 
                    ? 'border-accent bg-accent/10' 
                    : 'border-accent/20 bg-black/20 hover:border-accent/50 hover:bg-accent/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getOpIcon(op.operation_type)}
                    <span className="text-xs font-bold text-text-main uppercase tracking-wider">
                      OP-{op.operation_number?.toString().padStart(3, '0')} {op.operation_type}
                    </span>
                  </div>
                  <ChevronRight size={14} className={`text-text-dim transition-transform ${selectedOp?.id === op.id ? 'translate-x-1 text-accent' : ''}`} />
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-[9px] uppercase tracking-widest text-text-dim">
                    Lead: <span className="text-text-accent">{op.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!op.members?.split(',').includes(user?.uid) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinOp(op.id);
                        }}
                        className="px-2 py-1 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-[8px] uppercase tracking-widest text-text-accent transition-colors"
                      >
                        Join Op
                      </button>
                    )}
                    <div className="text-[8px] uppercase tracking-widest text-text-dim opacity-60">
                      {new Date(op.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DebugLabel>

      {/* Right Panel - 70% */}
      <DebugLabel label="Operation Details" className="w-[70%] border border-accent/20 bg-bg-main/40 p-4 flex flex-col">
        {selectedOp ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-accent/20">
              <div className="p-3 bg-accent/10 rounded-full border border-accent/30">
                {getOpIcon(selectedOp.operation_type)}
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-[0.2em] text-text-main">
                  OP-{selectedOp.operation_number?.toString().padStart(3, '0')} {selectedOp.operation_type}
                </h2>
                <div className="text-[10px] uppercase tracking-widest text-text-dim mt-1">
                  Lead: <span className="text-text-accent">{selectedOp.username}</span> | 
                  System: <span className="text-text-accent">{selectedOp.system_id || "N/A"}</span> | 
                  Status: <span className="text-text-accent">{selectedOp.status}</span> | 
                  Initiated: {new Date(selectedOp.created_at).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4">
              <div className="bg-black/30 border border-accent/10 p-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-text-dim mb-3 border-b border-accent/10 pb-2">
                  Operation Description
                </h3>
                <div className="text-sm text-text-main whitespace-pre-wrap font-mono leading-relaxed">
                  {selectedOp.description || "No description provided."}
                </div>
              </div>

              <div className="bg-black/30 border border-accent/10 p-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-text-dim mb-3 border-b border-accent/10 pb-2">
                  Contribute
                </h3>
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-text-dim">Item Type</label>
                    <select
                      value={contributeItem}
                      onChange={(e) => setContributeItem(e.target.value)}
                      className="w-full bg-black/50 border border-accent/20 text-sm text-text-main p-2 outline-none focus:border-accent transition-colors"
                    >
                      <option value="" disabled>Select item...</option>
                      {ASSET_OPTIONS.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32 space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-text-dim">Amount</label>
                    <input
                      type="number"
                      min="1"
                      value={contributeAmount}
                      onChange={(e) => setContributeAmount(e.target.value)}
                      className="w-full bg-black/50 border border-accent/20 text-sm text-text-main p-2 outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleContribute}
                    disabled={isSubmittingContribution || !contributeItem || !contributeAmount}
                    className="px-6 py-2 bg-accent/20 hover:bg-accent/40 border border-accent/50 text-text-accent text-xs uppercase tracking-widest font-bold transition-all disabled:opacity-50 h-[38px]"
                  >
                    {isSubmittingContribution ? "..." : "Submit"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[30%_70%] gap-4">
                <div className="bg-black/30 border border-accent/10 p-4">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-text-dim mb-3 border-b border-accent/10 pb-2">
                    Members
                  </h3>
                  <div className="text-xs text-text-main whitespace-pre-wrap font-mono leading-relaxed space-y-1">
                    {selectedOp.members ? selectedOp.members.split(',').map(uid => (
                      <div key={uid} className="truncate" title={uid}>{uid}</div>
                    )) : "No members assigned yet."}
                  </div>
                </div>

                <div className="bg-black/30 border border-accent/10 p-4">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-text-dim mb-3 border-b border-accent/10 pb-2">
                    Contributions
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-accent/10">
                          <th className="py-2 text-[9px] uppercase tracking-widest text-text-dim font-normal">Name</th>
                          <th className="py-2 text-[9px] uppercase tracking-widest text-text-dim font-normal">Item Type</th>
                          <th className="py-2 text-[9px] uppercase tracking-widest text-text-dim font-normal">Amount</th>
                          <th className="py-2 text-[9px] uppercase tracking-widest text-text-dim font-normal">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOp.contributions ? JSON.parse(selectedOp.contributions).map((c: any) => (
                          <tr key={c.id} className="border-b border-accent/5 hover:bg-accent/5">
                            <td className="py-2 text-xs text-text-main font-mono">{c.username}</td>
                            <td className="py-2 text-xs text-text-main font-mono">{c.item_type}</td>
                            <td className="py-2 text-xs text-text-main font-mono">{c.amount}</td>
                            <td className="py-2 text-xs font-mono">
                              {c.status === 'pending' ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-yellow-400">Pending</span>
                                  {(selectedOp.lead_uid === user?.uid || user?.rank >= 1) && (
                                    <button
                                      onClick={() => handleConfirmContribution(selectedOp.id, c.id)}
                                      className="px-2 py-1 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-[8px] uppercase tracking-widest text-text-accent transition-colors"
                                    >
                                      Confirm
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-green-400">Confirmed</span>
                              )}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={4} className="py-4 text-xs text-text-dim italic text-center">
                              No contributions recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest text-text-dim italic">
              Select an operation to view details
            </span>
          </div>
        )}
      </DebugLabel>

      <StartOperationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={handleOpCreated}
        currentUser={user}
      />
    </div>
  );
};
