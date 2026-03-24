import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, ShieldCheck, User } from "lucide-react";

interface UserData {
  uid: string;
  username: string;
  rank: number;
}

export const UserManagementModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleRankChange = async (targetUid: string, newRank: number) => {
    try {
      const res = await fetch("/api/users/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_uid: targetUid, rank: newRank })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update rank");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update rank");
    }
  };

  const getRankLabel = (rank: number) => {
    switch (rank) {
      case 2: return "Superadmin";
      case 1: return "Admin";
      default: return "User";
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 2: return <ShieldCheck size={14} className="text-purple-400" />;
      case 1: return <Shield size={14} className="text-blue-400" />;
      default: return <User size={14} className="text-zinc-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-bg-main border border-accent/30 shadow-[0_0_100px_rgba(var(--color-accent-rgb),0.2)] flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-accent/20 bg-accent/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-accent animate-pulse" />
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-text-main italic">
                  Personnel Management Protocol
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
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-text-main animate-pulse">
                    Synchronizing Personnel Data...
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[9px] uppercase tracking-widest text-text-dim border-b border-accent/10">
                    <div className="col-span-6">Username</div>
                    <div className="col-span-3">Current Rank</div>
                    <div className="col-span-3 text-right">Action</div>
                  </div>
                  {users.map((u) => (
                    <div key={u.uid} className="grid grid-cols-12 gap-4 px-4 py-3 items-center bg-white/5 border border-white/5 hover:border-accent/20 transition-all group">
                      <div className="col-span-6 flex items-center gap-3">
                        <div className="w-1 h-4 bg-accent/20 group-hover:bg-accent transition-colors" />
                        <span className="text-xs font-bold text-text-main uppercase tracking-wider">{u.username}</span>
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        {getRankIcon(u.rank)}
                        <span className="text-[10px] uppercase tracking-widest text-text-dim">{getRankLabel(u.rank)}</span>
                      </div>
                      <div className="col-span-3 text-right">
                        <select
                          value={u.rank}
                          onChange={(e) => handleRankChange(u.uid, parseInt(e.target.value))}
                          className="bg-bg-main border border-accent/20 text-[10px] text-text-main px-2 py-1 outline-none focus:border-accent transition-all uppercase tracking-widest"
                        >
                          <option value={0}>User</option>
                          <option value={1}>Admin</option>
                          <option value={2}>Superadmin</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-accent/10 bg-black/50 flex justify-between items-center">
              <div className="text-[8px] uppercase tracking-[0.2em] text-text-dim">
                Authorized Personnel Only // Rank 2 Clearance Required
              </div>
              <div className="text-[8px] uppercase tracking-[0.2em] text-text-dim">
                Total Nodes: {users.length}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
