import { motion, AnimatePresence } from "motion/react";
import { Plus, X } from "lucide-react";
import { GateData } from "./types";

export const GateEditModal = ({
  editGateId,
  showAddGate,
  gateForm,
  setGateForm,
  allUsers,
  gates,
  isSuperAdmin,
  onClose,
  onSave,
  onDelete
}: {
  editGateId: string | null;
  showAddGate: boolean;
  gateForm: any;
  setGateForm: (form: any) => void;
  allUsers: any[];
  gates: GateData[];
  isSuperAdmin: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}) => {
  return (
    <AnimatePresence>
      {(editGateId !== null || showAddGate) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-bg-main border border-accent/30 p-6 w-full max-w-md space-y-6 shadow-[0_0_50px_rgba(var(--accent-rgb),0.2)]"
          >
            <div className="flex items-center justify-between border-b border-accent/20 pb-2">
              <div className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold">
                {editGateId ? "RECONFIGURE_GATE_PARAMETERS" : "INITIALIZE_NEW_GATE"}
              </div>
              <button onClick={onClose} className="text-text-dim hover:text-accent transition-colors">
                <Plus size={16} className="rotate-45" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-widest text-text-dim">Gate Name</label>
                <input 
                  type="text" 
                  value={gateForm.name}
                  onChange={(e) => setGateForm({ ...gateForm, name: e.target.value.toUpperCase() })}
                  className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                  placeholder="NAME"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[8px] uppercase tracking-widest text-text-dim">Unique Code</label>
                  <span className="text-[7px] text-red-500 uppercase font-bold">do not edit this!</span>
                </div>
                <input 
                  type="text" 
                  value={gateForm.code}
                  onChange={(e) => setGateForm({ ...gateForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                  placeholder="CODE"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-widest text-text-dim">Gate Owner</label>
                <select 
                  value={gateForm.owner_uid}
                  onChange={(e) => {
                    const u = allUsers.find(u => u.uid === e.target.value);
                    if (u) {
                      setGateForm({ ...gateForm, owner_uid: u.uid, owner_username: u.username });
                    }
                  }}
                  className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                >
                  <option value="" disabled>SELECT OWNER</option>
                  {allUsers.map(u => (
                    <option key={u.uid} value={u.uid}>{u.username}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-widest text-text-dim">Fuel Status</label>
                <select 
                  value={gateForm.fuel_status}
                  onChange={(e) => setGateForm({ ...gateForm, fuel_status: e.target.value })}
                  className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                >
                  <option value="OFFLINE">OFFLINE</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="STABILIZING">STABILIZING</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-widest text-text-dim">Fuel Value</label>
                <input 
                  type="number" 
                  value={gateForm.fuel_value}
                  onChange={(e) => setGateForm({ ...gateForm, fuel_value: parseInt(e.target.value) || 0 })}
                  className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                  placeholder="VALUE"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-widest text-text-dim">Connected To</label>
                <select 
                  value={gateForm.connected_to}
                  onChange={(e) => setGateForm({ ...gateForm, connected_to: e.target.value })}
                  className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                >
                  <option value="">NONE</option>
                  {gates
                    .filter(g => g.built && g.id !== editGateId)
                    .map(bg => (
                      <option key={bg.id} value={bg.name}>{bg.name}</option>
                    ))
                  }
                </select>
              </div>
              <div className="space-y-1 flex items-center gap-2 pt-4">
                <input 
                  type="checkbox" 
                  id="built-checkbox"
                  checked={gateForm.built}
                  onChange={(e) => setGateForm({ ...gateForm, built: e.target.checked })}
                  className="w-4 h-4 bg-bg-main border border-accent/20 rounded-sm outline-none accent-accent"
                />
                <label htmlFor="built-checkbox" className="text-[8px] uppercase tracking-widest text-text-dim cursor-pointer">Gate is Fully Built</label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={onSave}
                className="flex-1 py-3 bg-accent text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent/80 transition-all"
              >
                {editGateId ? ">_ Update Parameters" : ">_ Initialize Gate"}
              </button>
              
              {editGateId && isSuperAdmin && (
                <button 
                  onClick={onDelete}
                  className="px-4 py-3 border border-red-500/50 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/10 transition-all"
                  title="Delete Gate"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
