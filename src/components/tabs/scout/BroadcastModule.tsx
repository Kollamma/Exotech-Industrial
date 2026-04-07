import { useState } from "react";
import { DebugLabel } from "../../../context/DebugContext";
import { AutocompleteInput } from "../../AutocompleteInput";
import { CornerAccents } from "./ScoutUI";
import { TOGGLE_ROWS, SITE_POINTS, CYPHER_MAP } from "./scoutUtils";

export const BroadcastModule = ({ 
  isMobile, 
  onBroadcastSuccess 
}: { 
  isMobile?: boolean;
  onBroadcastSuccess: () => void;
}) => {
  const [systemId, setSystemId] = useState("");
  const [activeToggles, setActiveToggles] = useState<Set<string>>(new Set());
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [alreadyScouted, setAlreadyScouted] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const toggleBox = async (label: string) => {
    if (!hasChecked && systemId.trim()) {
      setHasChecked(true);
      try {
        const res = await fetch(`/api/scouts/${systemId}`, { credentials: 'include' });
        const data = await res.json();
        if (data && data.system_id) {
          setAlreadyScouted(true);
        }
      } catch (e) {
        console.error("Check scout error:", e);
      }
    }

    const newToggles = new Set(activeToggles);
    if (newToggles.has(label)) {
      newToggles.delete(label);
    } else {
      newToggles.add(label);
    }
    setActiveToggles(newToggles);
  };

  const handleBroadcast = async () => {
    if (!systemId.trim()) {
      alert("SYSTEM ID REQUIRED");
      return;
    }

    setIsBroadcasting(true);
    
    const flatToggles = TOGGLE_ROWS.flat();
    const cypherMap: Record<string, string> = {};
    flatToggles.forEach((label, index) => {
      cypherMap[label] = String.fromCharCode(97 + index);
    });

    const encoded = Array.from(activeToggles)
      .filter(label => cypherMap[label])
      .map(label => cypherMap[label])
      .sort()
      .join("");

    const totalStrength = Array.from(activeToggles).reduce((acc, label) => {
      return acc + (SITE_POINTS[label] || 0);
    }, 0);

    try {
      const res = await fetch('/api/scouts/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_id: systemId,
          site_contents: encoded,
          system_strength: totalStrength
        }),
        credentials: 'include'
      });

      if (!res.ok) throw new Error("Broadcast failed");

      setSystemId("");
      setActiveToggles(new Set());
      setAlreadyScouted(false);
      setHasChecked(false);
      
      onBroadcastSuccess();
    } catch (e) {
      console.error(e);
      alert("BROADCAST FAILED");
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-text-main font-bold border-b border-accent/20 pb-1">
          Scouting Protocol
        </div>
        <AutocompleteInput 
          placeholder="SYSTEM ID" 
          maxLength={10}
          value={systemId}
          onChange={(val) => {
            setSystemId(val.toUpperCase());
            setHasChecked(false);
            setAlreadyScouted(false);
          }}
          className="w-full bg-bg-main border border-accent/30 p-4 text-sm text-text-main uppercase tracking-[0.2em] outline-none focus:border-accent"
        />
        
        <div className="grid grid-cols-2 gap-2">
          {TOGGLE_ROWS.flat().map((label) => (
            <button
              key={label}
              onClick={() => toggleBox(label)}
              className={`h-10 border text-[10px] uppercase tracking-tighter transition-all
                ${activeToggles.has(label) 
                  ? 'bg-accent text-bg-main border-accent font-bold' 
                  : 'bg-transparent text-text-accent/60 border-accent/20'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button 
          onClick={handleBroadcast}
          disabled={isBroadcasting}
          className="w-full py-4 text-sm uppercase tracking-[0.2em] bg-accent text-black font-black transition-all disabled:opacity-50"
        >
          {isBroadcasting ? "Synchronizing..." : ">_ Submit System Report"}
        </button>
      </div>
    );
  }

  return (
    <DebugLabel label="Broadcast Module" className="flex-[7]">
      <div className="border border-accent/20 bg-bg-main/50 p-1 flex flex-col space-y-1">
        <div className="flex items-center justify-start gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <DebugLabel label="System Input">
              <AutocompleteInput 
                placeholder="SYSTEM ID" 
                maxLength={10}
                value={systemId}
                onChange={(val) => {
                  setSystemId(val.toUpperCase());
                  setHasChecked(false);
                  setAlreadyScouted(false);
                }}
                className="w-28 bg-bg-main border border-accent/20 p-2.5 text-[11px] text-text-main uppercase tracking-[0.2em] outline-none focus:border-accent/60 transition-all placeholder:text-zinc-500"
              />
            </DebugLabel>
            
            <div className="flex items-center gap-4">
              <DebugLabel label="Broadcast Button">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleBroadcast}
                    disabled={isBroadcasting}
                    className="relative px-4 py-2.5 text-[11px] uppercase tracking-[0.1em] border border-accent bg-accent/10 text-text-accent font-medium rounded-sm hover:bg-accent/20 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,99,33,0.15)] disabled:opacity-50 whitespace-nowrap"
                  >
                    <CornerAccents color="white" />
                    {isBroadcasting ? ">_ Synchronizing..." : ">_ Submit System Report"}
                  </button>
                  <span className="text-[9px] text-text-dim uppercase tracking-widest flex-1 leading-tight">
                    Toggle the orbital sites you have scouted and submit the report to the database.
                  </span>
                </div>
              </DebugLabel>

              {alreadyScouted && (
                <div className="flex flex-col">
                  <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest animate-pulse">
                    This system has already been scouted.
                  </span>
                  <span className="text-[8px] text-red-500/80 uppercase tracking-widest">
                    Do you want to proceed?
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {TOGGLE_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1">
              {row.map((label) => (
                <DebugLabel key={label} label={`Site: ${label}`} className="flex-1">
                  <button
                    onClick={() => toggleBox(label)}
                    className={`w-full h-8 border text-[11px] uppercase tracking-tighter transition-all duration-200 text-center flex items-center justify-center leading-none whitespace-nowrap
                      ${activeToggles.has(label) 
                        ? 'bg-accent text-bg-main border-accent shadow-[0_0_15px_rgba(255,99,33,0.2)] font-bold' 
                        : 'bg-transparent text-text-accent/60 border-accent/20 hover:border-accent/40 hover:bg-accent/5'
                      }`}
                  >
                    {label}
                  </button>
                </DebugLabel>
              ))}
            </div>
          ))}
        </div>
      </div>
    </DebugLabel>
  );
};
