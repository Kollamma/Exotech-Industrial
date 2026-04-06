import { useState } from "react";
import { DebugLabel } from "../../../context/DebugContext";
import { AutocompleteInput } from "../../AutocompleteInput";
import { CornerAccents } from "./ScoutUI";

export const IsolateModule = ({ 
  isMobile, 
  onIsolateSuccess 
}: { 
  isMobile?: boolean;
  onIsolateSuccess: () => void;
}) => {
  const [isolateSystemId, setIsolateSystemId] = useState("");
  const [selectedRift, setSelectedRift] = useState<string | null>(null);
  const [isIsolating, setIsIsolating] = useState(false);

  const handleIsolate = async () => {
    if (!isolateSystemId.trim()) {
      alert("SYSTEM ID REQUIRED");
      return;
    }
    if (!selectedRift) {
      alert("RIFT TYPE REQUIRED");
      return;
    }

    setIsIsolating(true);
    try {
      const res = await fetch('/api/rifts/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_id: isolateSystemId,
          type: selectedRift.replace(/>_/g, '')
        })
      });

      if (!res.ok) throw new Error("Isolation failed");

      setIsolateSystemId("");
      setSelectedRift(null);
      alert("RIFT LOGGED SUCCESSFULLY");
      onIsolateSuccess();
    } catch (e) {
      console.error(e);
      alert("ISOLATION FAILED");
    } finally {
      setIsIsolating(false);
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-text-main font-bold border-b border-accent/20 pb-1">
          Rift Isolation
        </div>
        <AutocompleteInput 
          placeholder="SYSTEM ID" 
          maxLength={10}
          value={isolateSystemId}
          onChange={(val) => setIsolateSystemId(val.toUpperCase())}
          className="w-full bg-bg-main border border-accent/30 p-4 text-sm text-text-main uppercase tracking-[0.2em] outline-none focus:border-accent"
        />

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {[">_0633", ">_F8DA", ">_F9BF", ">_0769"].map((label) => (
              <button
                key={label}
                onClick={() => setSelectedRift(selectedRift === label ? null : label)}
                className={`h-12 border text-xs uppercase tracking-widest transition-all
                  ${selectedRift === label 
                    ? 'bg-accent text-bg-main border-accent font-bold' 
                    : 'bg-transparent text-text-accent/60 border-accent/20'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleIsolate}
          disabled={isIsolating}
          className="w-full py-4 text-sm uppercase tracking-[0.2em] border-2 border-accent text-text-accent font-black transition-all disabled:opacity-50"
        >
          {isIsolating ? "Isolating..." : ">_ Report New Rift"}
        </button>
      </div>
    );
  }

  return (
    <DebugLabel label="Isolate Module" className="flex-[3]">
      <div className="border border-accent/20 bg-bg-main/50 p-1 flex flex-col space-y-1">
        <div className="flex items-center justify-start gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <DebugLabel label="System Input">
              <AutocompleteInput 
                placeholder="SYSTEM ID" 
                maxLength={10}
                value={isolateSystemId}
                onChange={(val) => setIsolateSystemId(val.toUpperCase())}
                className="w-28 bg-bg-main border border-accent/20 p-2.5 text-[11px] text-text-main uppercase tracking-[0.2em] outline-none focus:border-accent/60 transition-all placeholder:text-zinc-500"
              />
            </DebugLabel>
            <DebugLabel label="Isolate Button">
              <button 
                onClick={handleIsolate}
                disabled={isIsolating}
                className="relative px-8 py-2.5 text-[11px] uppercase tracking-[0.05em] border border-accent bg-accent/10 text-text-accent font-medium rounded-sm hover:bg-accent/20 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,99,33,0.15)] whitespace-nowrap disabled:opacity-50"
              >
                <CornerAccents color="white" />
                {isIsolating ? ">_ REPORTING..." : ">_ Report New Rift"}
              </button>
            </DebugLabel>
          </div>
        </div>
        
        <div className="flex flex-col space-y-1">
          <div className="flex gap-1 w-full">
            {[">_0633", ">_F8DA"].map((label) => (
              <DebugLabel key={label} label={`Toggle: ${label}`} className="flex-1">
                <button
                  onClick={() => setSelectedRift(selectedRift === label ? null : label)}
                  className={`w-full h-8 border text-[13px] uppercase tracking-tighter transition-all duration-200 flex items-center justify-center
                    ${selectedRift === label 
                      ? 'bg-accent text-bg-main border-accent shadow-[0_0_15px_rgba(255,99,33,0.2)] font-bold' 
                      : 'bg-transparent text-accent/60 border-accent/20 hover:border-accent/40 hover:bg-accent/5'
                    }`}
                >
                  {label}
                </button>
              </DebugLabel>
            ))}
          </div>

          <div className="flex gap-1 w-full">
            {[">_F9BF", ">_0769"].map((label) => (
              <DebugLabel key={label} label={`Toggle: ${label}`} className="flex-1">
                <button
                  onClick={() => setSelectedRift(selectedRift === label ? null : label)}
                  className={`w-full h-8 border text-[13px] uppercase tracking-tighter transition-all duration-200 flex items-center justify-center
                    ${selectedRift === label 
                      ? 'bg-accent text-bg-main border-accent shadow-[0_0_15px_rgba(255,99,33,0.2)] font-bold' 
                      : 'bg-transparent text-accent/60 border-accent/20 hover:border-accent/40 hover:bg-accent/5'
                    }`}
                >
                  {label}
                </button>
              </DebugLabel>
            ))}
          </div>
          <div className="text-[9px] text-text-dim uppercase tracking-widest leading-tight pt-1">
            If you find O5D8 or F935 rifts, these hold very little fuel are not worth mining
          </div>
        </div>
      </div>
    </DebugLabel>
  );
};
