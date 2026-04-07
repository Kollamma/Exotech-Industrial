import { useState, useEffect } from "react";
import { DebugLabel } from "../../context/DebugContext";
import { Plus, Crosshair, Pickaxe, Shield, ShieldAlert, Hammer, ChevronRight } from "lucide-react";
import { StartOperationModal } from "./operations/StartOperationModal";
import { OperationList } from "./operations/OperationList";
import { OperationDetails } from "./operations/OperationDetails";
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
      const res = await fetch("/api/operations", { credentials: 'include' });
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
      const res = await fetch(`/api/operations/${opId}/join`, { 
        method: "POST",
        credentials: 'include'
      });
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
        }),
        credentials: 'include'
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
        method: "POST",
        credentials: 'include'
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
    <DebugLabel label="Operations Tab" className="flex-grow flex flex-col p-4 gap-4 overflow-hidden">
      <div className="flex flex-grow gap-4 overflow-hidden">
        <OperationList 
          operations={operations}
          selectedOp={selectedOp}
          setSelectedOp={setSelectedOp}
          isLoading={isLoading}
          setIsModalOpen={setIsModalOpen}
          handleJoinOp={handleJoinOp}
          user={user}
          getOpIcon={getOpIcon}
        />

        <OperationDetails 
          selectedOp={selectedOp}
          user={user}
          getOpIcon={getOpIcon}
          contributeItem={contributeItem}
          setContributeItem={setContributeItem}
          contributeAmount={contributeAmount}
          setContributeAmount={setContributeAmount}
          isSubmittingContribution={isSubmittingContribution}
          handleContribute={handleContribute}
          handleConfirmContribution={handleConfirmContribution}
        />
      </div>

      <StartOperationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={handleOpCreated}
        currentUser={user}
      />
    </DebugLabel>
  );
};
