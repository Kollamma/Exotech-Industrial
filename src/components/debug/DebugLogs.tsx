import React, { useEffect, useState } from "react";
import { useDebug } from "../../context/DebugContext";
import { Terminal, X, RefreshCw } from "lucide-react";

export const DebugLogs: React.FC = () => {
  const { debugMode } = useDebug();
  const [logs, setLogs] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/debug/logs", { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch debug logs:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (debugMode && isOpen) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [debugMode, isOpen]);

  if (!debugMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-xl transition-all flex items-center gap-2 group"
          title="Show Server Logs"
        >
          <Terminal size={20} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-xs font-mono">
            SERVER LOGS
          </span>
        </button>
      ) : (
        <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-[500px] max-h-[400px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2 text-blue-400">
              <Terminal size={16} />
              <span className="text-xs font-bold font-mono">SERVER DEBUG LOGS</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchLogs}
                disabled={isRefreshing}
                className="text-slate-400 hover:text-white transition-colors"
                title="Refresh Logs"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1 bg-black/50">
            {logs.length === 0 ? (
              <div className="text-slate-500 italic">No logs available...</div>
            ) : (
              logs.map((log, i) => {
                const isError = log.includes("ERROR:");
                return (
                  <div
                    key={i}
                    className={`${
                      isError ? "text-red-400" : "text-slate-300"
                    } border-b border-slate-800/50 pb-1 last:border-0`}
                  >
                    {log}
                  </div>
                );
              })
            )}
          </div>
          <div className="bg-slate-800 px-4 py-1 text-[8px] text-slate-500 flex justify-between">
            <span>Last 100 entries</span>
            <span>Auto-refreshing every 5s</span>
          </div>
        </div>
      )}
    </div>
  );
};
