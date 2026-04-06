import { useState, useEffect } from "react";
import { CornerAccents, ManifestContainer } from "./ManifestContainer";

export const ASSET_OPTIONS = [
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

export const ManifestForm = ({ 
  user, 
  isAdmin, 
  allUsers, 
  gates, 
  isMobile 
}: { 
  user: any; 
  isAdmin: boolean; 
  allUsers: any[]; 
  gates: any[]; 
  isMobile?: boolean;
}) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !selectedUser) {
      setSelectedUser({ uid: user.id, username: user.username });
    }
  }, [user, selectedUser]);

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

  const formContent = (
    <div className={`flex flex-col ${isMobile ? "space-y-4" : "space-y-2 px-2 py-1"}`}>
      <div className={`flex items-center ${isMobile ? "gap-3" : "gap-2"}`}>
        <label className={`text-[10px] uppercase tracking-widest text-text-dim shrink-0 ${isMobile ? "w-24" : "w-16 text-[8px]"}`}>Name</label>
        <div className="flex-grow">
          {isAdmin ? (
            <select 
              value={selectedUser?.uid || ""} 
              onChange={(e) => {
                const u = allUsers.find(u => u.uid === e.target.value);
                if (u) setSelectedUser(u);
              }}
              className={`w-full max-w-full bg-bg-main border border-accent/20 text-text-main outline-none focus:border-accent/60 transition-all min-w-0 ${isMobile ? "text-sm p-2" : "text-[10px] p-1"}`}
            >
              {allUsers.map(u => (
                <option key={u.uid} value={u.uid}>{u.username}</option>
              ))}
            </select>
          ) : (
            <div className={`w-full max-w-full bg-bg-main/50 border border-accent/10 text-text-main/40 cursor-not-allowed truncate min-w-0 ${isMobile ? "text-sm p-2" : "text-[10px] p-1"}`}>
              {user?.username}
            </div>
          )}
        </div>
      </div>

      <div className={`flex items-center ${isMobile ? "gap-3" : "gap-2"}`}>
        <label className={`text-[10px] uppercase tracking-widest text-text-dim shrink-0 ${isMobile ? "w-24" : "w-16 text-[8px]"}`}>_&gt;asset</label>
        <div className="flex-grow">
          <select 
            value={selectedItem} 
            onChange={(e) => setSelectedItem(e.target.value)}
            className={`w-full max-w-full bg-bg-main border border-accent/20 text-text-main outline-none focus:border-accent/60 transition-all min-w-0 ${isMobile ? "text-sm p-2" : "text-[10px] p-1"}`}
          >
            <option value="" disabled>SELECT ASSET...</option>
            {ASSET_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={`flex items-center ${isMobile ? "gap-3" : "gap-2"}`}>
        <label className={`text-[10px] uppercase tracking-widest text-text-dim shrink-0 ${isMobile ? "w-24" : "w-16 text-[8px]"}`}>Quantity</label>
        <div className="flex-grow">
          <input 
            type="number" 
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className={`w-full max-w-full bg-bg-main border border-accent/20 text-text-main outline-none focus:border-accent/60 transition-all placeholder:text-zinc-700 min-w-0 ${isMobile ? "text-sm p-2" : "text-[10px] p-1"}`}
          />
        </div>
      </div>

      <div className={`flex items-center ${isMobile ? "gap-3" : "gap-2"}`}>
        <label className={`text-[10px] uppercase tracking-widest text-text-dim shrink-0 ${isMobile ? "w-24" : "w-16 text-[8px]"}`}>_&gt;target</label>
        <div className="flex-grow">
          <select 
            value={selectedTarget} 
            onChange={(e) => setSelectedTarget(e.target.value)}
            className={`w-full max-w-full bg-bg-main border border-accent/20 text-text-main outline-none focus:border-accent/60 transition-all min-w-0 ${isMobile ? "text-sm p-2" : "text-[10px] p-1"}`}
          >
            <option value="">MANIFEST (CENTRAL)</option>
            {gates.map(gate => (
              <option key={gate.id} value={gate.name}>{gate.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={`flex items-center ${isMobile ? "gap-3" : "gap-2"}`}>
        <label className={`text-[10px] uppercase tracking-widest text-text-dim shrink-0 ${isMobile ? "w-24" : "w-16 text-[8px]"}`}>Notes</label>
        <div className="flex-grow">
          <input 
            type="text" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="OPTIONAL_NOTES"
            className={`w-full max-w-full bg-bg-main border border-accent/20 text-text-main outline-none focus:border-accent/60 transition-all placeholder:text-zinc-700 min-w-0 ${isMobile ? "text-sm p-2" : "text-[10px] p-1"}`}
          />
        </div>
      </div>

      <button 
        onClick={handleContribute}
        disabled={isSubmitting}
        className={`w-full border border-accent bg-accent/10 text-text-accent uppercase font-bold hover:bg-accent/20 transition-all active:scale-[0.98] disabled:opacity-50 shrink-0 ${isMobile ? "py-4 text-xs tracking-[0.2em] mt-4" : "py-1.5 text-[9px] tracking-[0.2em] mt-1"}`}
      >
        {isSubmitting ? "ALLOCATING..." : ">_ Allocate materials"}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="relative border border-accent/20 bg-bg-main/40 p-4 flex flex-col">
        <CornerAccents color="var(--color-accent-dim)" />
        <div className="border-b border-accent/10 pb-2 mb-4">
          <span className="text-xs uppercase tracking-[0.2em] text-text-main font-bold">_&gt; Contribute</span>
        </div>
        {formContent}
      </div>
    );
  }

  return (
    <ManifestContainer title=">_Contribute" className="flex-1">
      {formContent}
    </ManifestContainer>
  );
};
