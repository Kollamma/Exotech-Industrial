import { motion, AnimatePresence } from "motion/react";
import { Plus, User } from "lucide-react";
import { GateData } from "./types";

export const FoamInputModal = ({
  activeGateId,
  gates,
  isAdmin,
  allUsers,
  selectedDonor,
  setSelectedDonor,
  user,
  inputAmount,
  setInputAmount,
  onClose,
  onSubmit
}: {
  activeGateId: string | null;
  gates: GateData[];
  isAdmin: boolean;
  allUsers: any[];
  selectedDonor: any;
  setSelectedDonor: (user: any) => void;
  user: any;
  inputAmount: string;
  setInputAmount: (amount: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) => {
  return (
    <AnimatePresence>
      {activeGateId !== null && (
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
            className="bg-bg-main border border-accent/30 p-6 w-full max-w-sm space-y-6 shadow-[0_0_50px_rgba(var(--accent-rgb),0.2)]"
          >
            <div className="flex items-center justify-between border-b border-accent/20 pb-2">
              <div className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold">
                {gates.find(g => g.id === activeGateId)?.name} // FOAM_INGESTION
              </div>
              <button onClick={onClose} className="text-text-dim hover:text-accent transition-colors">
                <Plus size={16} className="rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-widest text-text-dim">Pilot Identification</label>
                <div className="relative">
                  <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent/50" />
                  {isAdmin ? (
                    <select 
                      value={selectedDonor?.uid || ""} 
                      onChange={(e) => {
                        const u = allUsers.find(u => u.uid === e.target.value);
                        if (u) setSelectedDonor(u);
                      }}
                      className="w-full bg-bg-main border border-accent/20 p-2 pl-8 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                    >
                      {allUsers.map(u => (
                        <option key={u.uid} value={u.uid}>{u.username}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-bg-main/50 border border-accent/20 p-2 pl-8 text-[10px] uppercase tracking-widest text-text-main/40 cursor-not-allowed">
                      {user?.username}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-widest text-text-dim">Foam Quantity</label>
                <input 
                  type="number" 
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                  placeholder="AMOUNT"
                />
              </div>
            </div>

            <button 
              onClick={onSubmit}
              className="w-full py-3 bg-accent text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent/80 transition-all"
            >
              {">_ Initiate Ingestion"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
