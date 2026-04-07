import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Users, Crosshair, FileText, MapPin } from "lucide-react";
import { AutocompleteInput } from "../../AutocompleteInput";

interface StartOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  currentUser: any;
}

const OPERATION_TYPES = ["Mining", "Scouting", "Defence", "Offense", "Construction"];

export const StartOperationModal = ({ isOpen, onClose, onCreated, currentUser }: StartOperationModalProps) => {
  const [operationType, setOperationType] = useState<string>("Mining");
  const [systemId, setSystemId] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOperationType("Mining");
      setSystemId("");
      setDescription("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operationType || !systemId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/operations/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_uid: currentUser?.uid,
          operation_type: operationType,
          system_id: systemId,
          description: description
        }),
        credentials: 'include'
      });

      if (res.ok) {
        onCreated();
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to start operation");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to start operation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-bg-main border border-accent/30 shadow-[0_0_50px_rgba(var(--color-accent-rgb),0.15)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-accent/20 bg-accent/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-accent animate-pulse" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-text-main italic">
                  Initialize Operation
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-accent/20 text-text-accent transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-dim">
                  <Users size={12} className="text-accent" />
                  Operation Lead
                </label>
                <div className="w-full bg-black/50 border border-accent/20 text-sm text-text-main p-2 opacity-70">
                  {currentUser?.username || "Unknown User"}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-dim">
                  <Crosshair size={12} className="text-accent" />
                  Operation Type
                </label>
                <select
                  value={operationType}
                  onChange={(e) => setOperationType(e.target.value)}
                  className="w-full bg-black/50 border border-accent/20 text-sm text-text-main p-2 outline-none focus:border-accent transition-colors"
                  required
                >
                  {OPERATION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-dim">
                  <MapPin size={12} className="text-accent" />
                  Target System ID
                </label>
                <AutocompleteInput 
                  placeholder="SYSTEM ID" 
                  maxLength={10}
                  value={systemId}
                  onChange={(val) => setSystemId(val.toUpperCase())}
                  className="w-full bg-black/50 border border-accent/20 text-sm text-text-main p-2 outline-none focus:border-accent transition-colors uppercase tracking-[0.2em]"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-dim">
                  <FileText size={12} className="text-accent" />
                  Description / Objectives
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-black/50 border border-accent/20 text-sm text-text-main p-2 outline-none focus:border-accent transition-colors resize-none font-mono"
                  placeholder="Enter operation details..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs uppercase tracking-widest text-text-dim hover:text-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !systemId.trim()}
                  className="px-6 py-2 bg-accent/20 hover:bg-accent/40 border border-accent/50 text-text-accent text-xs uppercase tracking-widest font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Initializing..." : "Start Operation"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
