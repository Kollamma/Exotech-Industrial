import { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { DebugLabel } from "../../context/DebugContext";

const CornerAccents = ({ color = "var(--color-accent)" }: { color?: string }) => (
  <>
    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l" style={{ borderColor: color }} />
    <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r" style={{ borderColor: color }} />
    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l" style={{ borderColor: color }} />
    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r" style={{ borderColor: color }} />
  </>
);

const ManifestContainer = ({ title, children, className = "" }: { title: string; children?: React.ReactNode; className?: string }) => (
  <DebugLabel label={title} className={`relative border border-accent/20 bg-bg-main/40 p-2 flex flex-col min-h-0 overflow-hidden ${className}`}>
    <CornerAccents color="var(--color-accent-dim)" />
    <div className="border-b border-accent/10 pb-1 mb-2 flex justify-between items-center shrink-0">
      <span className="text-[10px] uppercase tracking-[0.2em] text-text-main font-bold">{title}</span>
    </div>
    <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar">
      {children}
    </div>
  </DebugLabel>
);

const ASSET_OPTIONS = [
  "LUX",
  "Lens 3x",
  "Feral Data",
  "Synod Cores",
  "Building Foam",
  "Reiver",
  "USV",
  "Tades",
  "Maul"
];

export const ManifestTab = ({ user, initialData, isMobile }: { user: any; initialData?: any; isMobile?: boolean }) => {
  const [manifestLogs, setManifestLogs] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [gates, setGates] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user && user.rank >= 1;

  const fetchManifest = async () => {
    try {
      const res = await fetch("/api/manifest");
      const data = await res.json();
      if (Array.isArray(data)) {
        setManifestLogs(data);
      } else {
        console.error("Manifest data is not an array:", data);
        setManifestLogs([]);
      }
    } catch (e) {
      console.error("Fetch manifest error:", e);
      setManifestLogs([]);
    }
  };

  const fetchStock = async () => {
    try {
      const res = await fetch("/api/manifest/stock");
      const data = await res.json();
      if (Array.isArray(data)) {
        setStockData(data);
      } else {
        console.error("Stock data is not an array:", data);
        setStockData([]);
      }
    } catch (e) {
      console.error("Fetch stock error:", e);
      setStockData([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllUsers(data);
      } else {
        console.error("Users data is not an array:", data);
        setAllUsers([]);
      }
    } catch (e) {
      console.error("Fetch users error:", e);
      setAllUsers([]);
    }
  };

  const fetchGates = async () => {
    try {
      const res = await fetch("/api/gates");
      const data = await res.json();
      if (Array.isArray(data)) {
        setGates(data);
      } else {
        setGates([]);
      }
    } catch (e) {
      console.error("Fetch gates error:", e);
      setGates([]);
    }
  };

  useEffect(() => {
    fetchManifest();
    fetchStock();
    fetchUsers();
    fetchGates();

    const socket = io();
    socket.on("manifest_update", () => {
      fetchManifest();
    });
    socket.on("stock_update", () => {
      fetchStock();
    });

    return () => {
      socket.disconnect();
    };
  }, [isAdmin]);

  useEffect(() => {
    if (user && !selectedUser) {
      setSelectedUser({ uid: user.id, username: user.username });
    }
  }, [user]);

  const handleContribute = async () => {
    if (!selectedUser || !selectedItem || !quantity) {
      alert("MISSING FIELDS");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/manifest/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donor_uid: selectedUser.uid,
          item: selectedItem,
          amount: Number(quantity),
          target_id: selectedTarget || null,
          notes: notes
        })
      });

      if (!res.ok) throw new Error("Contribution failed");

      // Reset fields
      setSelectedItem("");
      setQuantity("");
      setNotes("");
      setSelectedTarget("");
      if (!isAdmin) {
        setSelectedUser({ uid: user.id, username: user.username });
      }
      alert("CONTRIBUTION LOGGED SUCCESSFULLY");
    } catch (e) {
      console.error(e);
      alert("CONTRIBUTION FAILED");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (id: string) => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`/api/manifest/verify/${id}`, { method: "POST" });
      if (!res.ok) throw new Error("Verification failed");
    } catch (e) {
      console.error(e);
      alert("VERIFICATION FAILED");
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-full p-4 space-y-6 pb-20">
        {/* Contribute Section */}
        <div className="relative border border-accent/20 bg-bg-main/40 p-4 flex flex-col">
          <CornerAccents color="var(--color-accent-dim)" />
          <div className="border-b border-accent/10 pb-2 mb-4">
            <span className="text-xs uppercase tracking-[0.2em] text-text-main font-bold">_&gt; Contribute</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-[10px] uppercase tracking-widest text-text-dim w-24 shrink-0">Name</label>
              <div className="flex-grow">
                {isAdmin ? (
                  <select 
                    value={selectedUser?.uid || ""} 
                    onChange={(e) => {
                      const u = allUsers.find(u => u.uid === e.target.value);
                      if (u) setSelectedUser(u);
                    }}
                    className="w-full max-w-full bg-bg-main border border-accent/20 text-sm text-text-main p-2 outline-none focus:border-accent/60 transition-all min-w-0"
                  >
                    {allUsers.map(u => (
                      <option key={u.uid} value={u.uid}>{u.username}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full max-w-full bg-bg-main/50 border border-accent/10 text-sm text-text-main/40 p-2 cursor-not-allowed truncate min-w-0">
                    {user?.username}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-[10px] uppercase tracking-widest text-text-dim w-24 shrink-0">_&gt;asset</label>
              <div className="flex-grow">
                <select 
                  value={selectedItem} 
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full max-w-full bg-bg-main border border-accent/20 text-sm text-text-main p-2 outline-none focus:border-accent/60 transition-all min-w-0"
                >
                  <option value="" disabled>SELECT ASSET...</option>
                  {ASSET_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-[10px] uppercase tracking-widest text-text-dim w-24 shrink-0">Quantity</label>
              <div className="flex-grow">
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full max-w-full bg-bg-main border border-accent/20 text-sm text-text-main p-2 outline-none focus:border-accent/60 transition-all placeholder:text-zinc-700 min-w-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-[10px] uppercase tracking-widest text-text-dim w-24 shrink-0">_&gt;target</label>
              <div className="flex-grow">
                <select 
                  value={selectedTarget} 
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full max-w-full bg-bg-main border border-accent/20 text-sm text-text-main p-2 outline-none focus:border-accent/60 transition-all min-w-0"
                >
                  <option value="">MANIFEST (CENTRAL)</option>
                  {gates.map(gate => (
                    <option key={gate.id} value={gate.name}>{gate.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-[10px] uppercase tracking-widest text-text-dim w-24 shrink-0">Notes</label>
              <div className="flex-grow">
                <input 
                  type="text" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="OPTIONAL_NOTES"
                  className="w-full max-w-full bg-bg-main border border-accent/20 text-sm text-text-main p-2 outline-none focus:border-accent/60 transition-all placeholder:text-zinc-700 min-w-0"
                />
              </div>
            </div>

            <button 
              onClick={handleContribute}
              disabled={isSubmitting}
              className="w-full py-4 border border-accent bg-accent/10 text-text-accent text-xs uppercase tracking-[0.2em] font-bold hover:bg-accent/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {isSubmitting ? "ALLOCATING..." : ">_ Allocate materials"}
            </button>
          </div>
        </div>

        {/* Contribution Log Section */}
        <div className="relative border border-accent/20 bg-bg-main/40 p-4 flex flex-col">
          <CornerAccents color="var(--color-accent-dim)" />
          <div className="border-b border-accent/10 pb-2 mb-4">
            <span className="text-xs uppercase tracking-[0.2em] text-text-main font-bold">_&gt; Manifest log</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-accent/20">
                  <th className="py-2 px-1 text-[10px] uppercase tracking-widest text-text-dim font-medium">User</th>
                  <th className="py-2 px-1 text-[10px] uppercase tracking-widest text-text-dim font-medium">Item</th>
                  <th className="py-2 px-1 text-[10px] uppercase tracking-widest text-text-dim font-medium">Qty</th>
                  <th className="py-2 px-1 text-[10px] uppercase tracking-widest text-text-dim font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent/5">
                {manifestLogs
                  .slice(0, 20) 
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-accent/5 transition-colors">
                      <td className="py-3 px-1 text-[11px] uppercase tracking-widest text-text-main truncate max-w-[60px]">{log.username}</td>
                      <td className="py-3 px-1 text-[11px] uppercase tracking-widest text-text-dim">{log.resource}</td>
                      <td className={`py-3 px-1 text-[11px] uppercase tracking-widest font-mono ${Number(log.ledger_impact) < 0 ? 'text-red-400' : 'text-text-main'}`}>
                        {log.resource === "LUX" ? `⌬${log.amount}` : log.amount}
                      </td>
                      <td className="py-3 px-1 text-right">
                        <span className={`text-[8px] uppercase tracking-widest px-1 py-0.5 border ${
                          log.verified 
                            ? 'border-blue-500/40 text-blue-400' 
                            : 'border-accent/40 text-text-accent'
                        }`}>
                          {log.verified ? "OK" : "..."}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-1 p-0.5">
      {/* Top Grid */}
      <div className="flex flex-grow gap-1 min-h-0">
        {/* Left Column (30% width) */}
        <div className="w-[30%] flex flex-col gap-1 min-w-0">
          <ManifestContainer title=">_Contribute" className="flex-1">
              <div className="flex flex-col space-y-2 px-2 py-1">
                <div className="flex items-center gap-2">
                  <label className="text-[8px] uppercase tracking-widest text-text-dim w-16 shrink-0">Name</label>
                  <div className="flex-grow">
                    {isAdmin ? (
                      <select 
                        value={selectedUser?.uid || ""} 
                        onChange={(e) => {
                          const u = allUsers.find(u => u.uid === e.target.value);
                          if (u) setSelectedUser(u);
                        }}
                        className="w-full max-w-full bg-bg-main border border-accent/20 text-[10px] text-text-main p-1 outline-none focus:border-accent/60 transition-all min-w-0"
                      >
                        {allUsers.map(u => (
                          <option key={u.uid} value={u.uid}>{u.username}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full max-w-full bg-bg-main/50 border border-accent/10 text-[10px] text-text-main/40 p-1 cursor-not-allowed truncate min-w-0">
                        {user?.username}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[8px] uppercase tracking-widest text-text-dim w-16 shrink-0">_&gt;asset</label>
                  <div className="flex-grow">
                    <select 
                      value={selectedItem} 
                      onChange={(e) => setSelectedItem(e.target.value)}
                      className="w-full max-w-full bg-bg-main border border-accent/20 text-[10px] text-text-main p-1 outline-none focus:border-accent/60 transition-all min-w-0"
                    >
                      <option value="" disabled>SELECT ASSET...</option>
                      {ASSET_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[8px] uppercase tracking-widest text-text-dim w-16 shrink-0">Quantity</label>
                  <div className="flex-grow">
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                      className="w-full max-w-full bg-bg-main border border-accent/20 text-[10px] text-text-main p-1 outline-none focus:border-accent/60 transition-all placeholder:text-zinc-700 min-w-0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[8px] uppercase tracking-widest text-text-dim w-16 shrink-0">_&gt;target</label>
                  <div className="flex-grow">
                    <select 
                      value={selectedTarget} 
                      onChange={(e) => setSelectedTarget(e.target.value)}
                      className="w-full max-w-full bg-bg-main border border-accent/20 text-[10px] text-text-main p-1 outline-none focus:border-accent/60 transition-all min-w-0"
                    >
                      <option value="">MANIFEST (CENTRAL)</option>
                      {gates.map(gate => (
                        <option key={gate.id} value={gate.name}>{gate.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[8px] uppercase tracking-widest text-text-dim w-16 shrink-0">Notes</label>
                  <div className="flex-grow">
                    <input 
                      type="text" 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="OPTIONAL_NOTES"
                      className="w-full max-w-full bg-bg-main border border-accent/20 text-[10px] text-text-main p-1 outline-none focus:border-accent/60 transition-all placeholder:text-zinc-700 min-w-0"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleContribute}
                  disabled={isSubmitting}
                  className="w-full py-1.5 border border-accent bg-accent/10 text-text-accent text-[9px] uppercase tracking-[0.2em] font-bold hover:bg-accent/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-1 shrink-0"
                >
                  {isSubmitting ? "ALLOCATING..." : ">_ Allocate materials"}
                </button>
              </div>
          </ManifestContainer>
        </div>

        {/* Right Column (70% width) */}
        <div className="w-[70%] flex flex-col gap-1 min-w-0">
          <ManifestContainer title=">_Manifest log" className="flex-1">
            <div className="h-full overflow-y-auto custom-scrollbar pr-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-bg-main z-10">
                    <tr className="border-b border-accent/20">
                      <th className="py-2 px-2 text-[12px] uppercase tracking-widest text-text-dim font-medium">Username</th>
                      <th className="py-2 px-2 text-[12px] uppercase tracking-widest text-text-dim font-medium">Item</th>
                      <th className="py-2 px-2 text-[12px] uppercase tracking-widest text-text-dim font-medium">Amount</th>
                      <th className="py-2 px-2 text-[12px] uppercase tracking-widest text-text-dim font-medium">Target</th>
                      <th className="py-2 px-2 text-[12px] uppercase tracking-widest text-text-dim font-medium">Date</th>
                      <th className="py-2 px-2 text-[12px] uppercase tracking-widest text-text-dim font-medium text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-accent/5">
                  {manifestLogs
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-accent/5 transition-colors">
                        <td className="py-3 px-2 text-[13px] uppercase tracking-widest text-text-main">{log.username}</td>
                        <td className="py-3 px-2 text-[13px] uppercase tracking-widest text-text-dim">{log.resource}</td>
                        <td className={`py-3 px-2 text-[13px] uppercase tracking-widest font-mono ${Number(log.ledger_impact) < 0 ? 'text-red-400' : 'text-text-main'}`}>
                          {log.resource === "LUX" ? `⌬ ${Number(log.amount).toLocaleString()}` : Number(log.amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-[11px] uppercase tracking-widest text-text-dim/60">
                          {log.target_id || "MANIFEST"}
                        </td>
                        <td className="py-3 px-2 text-[12px] uppercase tracking-widest text-text-dim/40">
                          {log.created_at ? new Date(log.created_at).toLocaleDateString() : "---"}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button 
                            onClick={() => !log.verified && handleVerify(log.id)}
                            disabled={log.verified || !isAdmin}
                            className={`text-[10px] uppercase tracking-widest px-2 py-1 border transition-all ${
                              log.verified 
                                ? 'border-blue-500/40 text-blue-400 bg-blue-500/5 cursor-default' 
                                : isAdmin 
                                  ? 'border-accent/40 text-text-accent bg-accent/5 hover:bg-accent/20' 
                                  : 'border-accent/20 text-text-accent/40 bg-accent/5 cursor-not-allowed'
                            }`}
                          >
                            {log.verified ? "CONFIRMED" : "PENDING"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  {manifestLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[12px] uppercase tracking-widest text-text-dim">
                        NO RECENT ENTRIES RECORDED
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ManifestContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <ManifestContainer title=">_Manifest" className="h-fit py-1">
        <div className="h-full flex items-center px-4 overflow-x-auto custom-scrollbar gap-8">
          {stockData
            .sort((a, b) => ASSET_OPTIONS.indexOf(a.resource) - ASSET_OPTIONS.indexOf(b.resource))
            .map((stock) => (
              <div key={stock.resource} className="flex flex-col shrink-0">
                <span className="text-[9px] uppercase tracking-widest text-text-dim">{stock.resource}</span>
                <span className="text-[12px] font-mono text-text-main font-bold">
                  {stock.resource === "LUX" ? `⌬ ${Number(stock.total_amount).toLocaleString()}` : Number(stock.total_amount).toLocaleString()}
                </span>
              </div>
            ))}
          {stockData.length === 0 && (
            <span className="text-[10px] uppercase tracking-[0.3em] text-text-dim">System manifest synchronised // All nodes operational</span>
          )}
        </div>
      </ManifestContainer>
    </div>
  );
};
