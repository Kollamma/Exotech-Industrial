import { useState, useEffect } from "react";
import { DebugLabel } from "../../context/DebugContext";
import { io } from "socket.io-client";
import { Terminal, Send, Activity, Clock, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const OperationTab = ({ user, initialData }: { user?: any; initialData?: any }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [opName, setOpName] = useState("");
  const [opNotes, setOpNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/operations");
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (e) {
      console.error("Fetch operations error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    const socket = io();
    socket.on("manifest_update", (payload: any) => {
      if (payload.data?.type === "operation") {
        fetchLogs();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/operations/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation_name: opName,
          notes: opNotes
        })
      });

      if (res.ok) {
        setOpName("");
        setOpNotes("");
      }
    } catch (e) {
      console.error("Submit operation error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-1 gap-1 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 h-full min-h-0">
        {/* Left: Operation Form */}
        <div className="lg:col-span-1 flex flex-col gap-1 min-h-0">
          <DebugLabel label="Operation Input" className="flex-grow border border-accent/20 bg-bg-main/40 p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Terminal size={16} className="text-accent" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-main italic">Initialize Operation</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-widest text-text-dim">Operation Designation</label>
                <input 
                  type="text" 
                  value={opName}
                  onChange={(e) => setOpName(e.target.value.toUpperCase())}
                  placeholder="OP_CODE_NAME"
                  className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-widest text-text-dim">Mission Parameters / Notes</label>
                <textarea 
                  value={opNotes}
                  onChange={(e) => setOpNotes(e.target.value)}
                  placeholder="ENTER MISSION DETAILS..."
                  rows={4}
                  className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !opName.trim()}
                className="w-full py-3 bg-accent/10 border border-accent text-accent text-[10px] uppercase tracking-widest font-black hover:bg-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={12} />
                {isSubmitting ? "TRANSMITTING..." : "LOG OPERATION"}
              </button>
            </form>

            <div className="mt-auto pt-6 border-t border-accent/10">
              <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-text-dim">
                <Activity size={10} className="text-accent/50" />
                <span>Neural Link: Stable</span>
              </div>
              <p className="text-[8px] uppercase tracking-widest text-text-dim/40 mt-1">
                All operations are logged to the central manifest ledger for historical auditing.
              </p>
            </div>
          </DebugLabel>
        </div>

        {/* Right: Operation Logs */}
        <div className="lg:col-span-2 flex flex-col gap-1 min-h-0">
          <DebugLabel label="Operation Logs" className="flex-grow border border-accent/20 bg-bg-main/40 p-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between p-3 border-b border-accent/10">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-accent" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-main italic">Mission History</h2>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-text-dim">{logs.length} Operations Logged</span>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-1">
              <div className="space-y-1">
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border border-accent/10 bg-bg-main/20 p-3 hover:border-accent/30 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-text-main italic">{log.resource}</span>
                        </div>
                        <span className="text-[8px] font-mono text-text-dim uppercase tracking-widest">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      {log.notes && (
                        <p className="text-[10px] text-text-dim uppercase tracking-widest leading-relaxed mb-3 pl-4 border-l border-accent/20">
                          {log.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-4 pl-4">
                        <div className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-text-dim/60">
                          <User size={10} />
                          <span>Logged By: {log.username}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {logs.length === 0 && !isLoading && (
                  <div className="h-40 flex flex-col items-center justify-center text-text-dim/40 space-y-2">
                    <Activity size={24} className="opacity-20" />
                    <span className="text-[10px] uppercase tracking-widest italic">No mission data detected</span>
                  </div>
                )}
              </div>
            </div>
          </DebugLabel>
        </div>
      </div>
    </div>
  );
};
