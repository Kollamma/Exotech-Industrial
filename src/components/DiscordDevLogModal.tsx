import { motion, AnimatePresence } from "motion/react";
import { X, Terminal, ShieldAlert, ShieldCheck, RefreshCw, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface DiscordLog {
  timestamp: string;
  type: string;
  message: string;
  details?: any;
}

interface DiscordDevLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiscordDevLogModal = ({ isOpen, onClose }: DiscordDevLogModalProps) => {
  const [logs, setLogs] = useState<DiscordLog[]>([]);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/discord/dev/logs", { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setIsDisabled(data.disabled);
      }
    } catch (err) {
      console.error("Failed to fetch Discord logs:", err);
    }
  };

  const toggleBot = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/discord/dev/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !isDisabled }),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setIsDisabled(data.disabled);
        toast.success(`Discord Bot ${data.disabled ? "Disabled" : "Enabled"}`);
        fetchLogs();
      }
    } catch (err) {
      toast.error("Failed to toggle Discord bot");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl h-[80vh] bg-bg-main border border-accent/30 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-accent/20 flex items-center justify-between bg-accent/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg text-text-accent">
                <Terminal size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-main tracking-tight uppercase">Discord Interaction Monitor</h2>
                <p className="text-[10px] text-text-dim uppercase tracking-widest">Development Debugging Interface</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleBot}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded border transition-all duration-300 uppercase text-[10px] font-bold tracking-widest ${
                  isDisabled 
                    ? "bg-red-900/20 border-red-500/50 text-red-400 hover:bg-red-900/40" 
                    : "bg-green-900/20 border-green-500/50 text-green-400 hover:bg-green-900/40"
                }`}
              >
                {isDisabled ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                {isDisabled ? "Bot Disabled" : "Bot Active"}
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-accent/10 rounded-full text-text-dim hover:text-text-main transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Log Area */}
          <div 
            ref={scrollRef}
            className="flex-grow overflow-y-auto p-4 font-mono text-xs space-y-2 bg-black/40"
          >
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-dim opacity-50 italic">
                <RefreshCw size={32} className="animate-spin-slow mb-4" />
                Waiting for Discord interactions...
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="group border-l-2 border-accent/20 pl-3 py-1 hover:bg-accent/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-text-dim whitespace-nowrap opacity-50">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={`font-bold uppercase tracking-widest text-[10px] px-1.5 py-0.5 rounded ${
                      log.type.includes('ERROR') ? 'bg-red-900/40 text-red-400' :
                      log.type.includes('SUCCESS') ? 'bg-green-900/40 text-green-400' :
                      log.type.includes('COMMAND') ? 'bg-blue-900/40 text-blue-400' :
                      'bg-accent/20 text-text-accent'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-text-main flex-grow">{log.message}</span>
                  </div>
                  {log.details && (
                    <pre className="mt-2 ml-8 p-2 bg-black/50 rounded border border-accent/10 text-[10px] text-text-dim overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3 border-t border-accent/20 bg-accent/5 flex items-center justify-between text-[9px] text-text-dim uppercase tracking-[0.2em]">
            <div className="flex items-center gap-4">
              <span>Status: {isDisabled ? "OFFLINE" : "LISTENING"}</span>
              <span>Buffer: {logs.length}/100</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw size={10} className="animate-spin-slow" />
              Real-time Feed Active
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
