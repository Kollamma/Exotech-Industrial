import { useState, useEffect, useMemo } from 'react';
import { io } from "socket.io-client";
import { Trash2, XCircle } from "lucide-react";
import { DebugLabel } from "../../context/DebugContext";
import { AutocompleteInput } from "../AutocompleteInput";

const TOGGLE_ROWS = [
  ["Trojan Annex", "Trojan Garden", "Stone Cluster", "Blue Drift", "Outer Grove"],
  ["Outer Shale", "Outer Vestiges", "Inner Ruins", "Derelict Bay", "Derelict Quarry"],
  ["Abandoned Foundry", "Ancient Cluster", "Fringe Crossing", "Fringe Latticeway", "Fringe Tallyport"]
];

const SITE_POINTS: Record<string, number> = {
  "Trojan Annex": 1,
  "Trojan Garden": 1,
  "Stone Cluster": 1,
  "Blue Drift": 3,
  "Outer Grove": 2,
  "Outer Shale": 2,
  "Outer Vestiges": 3,
  "Inner Ruins": 2,
  "Derelict Bay": 1,
  "Derelict Quarry": 1,
  "Abandoned Foundry": 2,
  "Ancient Cluster": 3,
  "Fringe Crossing": 3,
  "Fringe Latticeway": 3,
  "Fringe Tallyport": 4
};

const CYPHER_MAP: Record<string, string> = {};
TOGGLE_ROWS.flat().forEach((label, index) => {
  CYPHER_MAP[String.fromCharCode(97 + index)] = label;
});

const CornerAccents = ({ color = "#050505" }: { color?: string }) => (
  <>
    <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l" style={{ borderColor: color }} />
    <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r" style={{ borderColor: color }} />
    <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l" style={{ borderColor: color }} />
    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r" style={{ borderColor: color }} />
  </>
);

const VectorGrid = () => {
  const [chars, setChars] = useState<string[]>([]);
  const gridWidth = 40;
  const gridHeight = 12;

  useEffect(() => {
    const generateChars = () => {
      const newChars = [];
      for (let i = 0; i < gridWidth * gridHeight; i++) {
        if (Math.random() > 0.95) {
          newChars.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
        } else {
          newChars.push("-");
        }
      }
      return newChars;
    };

    setChars(generateChars());

    const interval = setInterval(() => {
      setChars(prev => prev.map(c => {
        if (Math.random() > 0.98) {
          return String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
        if (c !== "-" && Math.random() > 0.7) {
          return "-";
        }
        return c;
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-[repeat(40,minmax(0,1fr))] gap-0.5 font-mono text-[8px] leading-none select-none">
      {chars.map((char, i) => {
        const isGrey = Math.random() > 0.9;
        return (
          <span 
            key={i} 
            className={isGrey ? "text-zinc-700" : "text-text-accent/40"}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};

export const ScoutTab = ({ isMobile = false, user, initialData }: { isMobile?: boolean; user?: any; initialData?: any }) => {
  const [activeToggles, setActiveToggles] = useState<Set<string>>(new Set());
  const [systemId, setSystemId] = useState("");
  const [isolateSystemId, setIsolateSystemId] = useState("");
  const [selectedRift, setSelectedRift] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isIsolating, setIsIsolating] = useState(false);
  const [alreadyScouted, setAlreadyScouted] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Vector Repository State
  const [scouts, setScouts] = useState<any[]>([]);
  const [rifts, setRifts] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortByStrength, setSortByStrength] = useState(false);
  const [riftToDelete, setRiftToDelete] = useState<string | null>(null);

  const toggleBox = async (label: string) => {
    if (!hasChecked && systemId.trim()) {
      setHasChecked(true);
      try {
        const res = await fetch(`/api/scouts/${systemId}`);
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
        })
      });

      if (!res.ok) throw new Error("Broadcast failed");

      setSystemId("");
      setActiveToggles(new Set());
      setAlreadyScouted(false);
      setHasChecked(false);
      
      // If data is already loaded, refresh it
      if (isLoaded) {
        fetchScouts();
      }
    } catch (e) {
      console.error(e);
      alert("BROADCAST FAILED");
    } finally {
      setIsBroadcasting(false);
    }
  };

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
    } catch (e) {
      console.error(e);
      alert("ISOLATION FAILED");
    } finally {
      setIsIsolating(false);
    }
  };

  const fetchScouts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/scouts');
      const data = await res.json();
      setScouts(data);
      setIsLoaded(true);
    } catch (e) {
      console.error("Fetch scouts error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRifts = async () => {
    try {
      const res = await fetch('/api/rifts');
      const data = await res.json();
      setRifts(data);
    } catch (e) {
      console.error("Fetch rifts error:", e);
    }
  };

  const handleDeleteRift = async (id: string) => {
    try {
      const res = await fetch(`/api/rifts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Delete failed");
      setRiftToDelete(null);
      fetchRifts();
    } catch (e) {
      console.error(e);
      alert("DELETE FAILED");
    }
  };

  const handleRetrieveData = async () => {
    await Promise.all([fetchScouts(), fetchRifts()]);
  };

  useEffect(() => {
    const socket = io();
    socket.on("scout_update", () => {
      if (isLoaded) fetchScouts();
    });
    socket.on("rift_update", () => {
      if (isLoaded) fetchRifts();
    });
    return () => {
      socket.disconnect();
    };
  }, [isLoaded]);

  useEffect(() => {
    fetchRifts();
  }, []);

  const calculateAge = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffInMs = now - created;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m`;
  };

  const decodeVectors = (siteContents: string) => {
    return siteContents.split('').map(char => CYPHER_MAP[char] || char).join(", ");
  };

  const filteredScouts = useMemo(() => {
    let result = [...scouts];
    if (searchQuery) {
      result = result.filter(s => s.system_id.toLowerCase().startsWith(searchQuery.toLowerCase()));
    }
    
    if (sortByStrength) {
      result.sort((a, b) => (b.system_strength || 0) - (a.system_strength || 0));
    } else {
      // Default: date order (updated_at desc)
      result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    
    return result;
  }, [scouts, searchQuery, sortByStrength]);

  if (isMobile) {
    return (
      <div className="flex flex-col p-4 space-y-8 pb-20">
        {/* Scouting Section */}
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
            {isBroadcasting ? "Synchronizing..." : "Broadcast Vectors"}
          </button>
        </div>

        {/* Rift Reporting Section */}
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
            {isIsolating ? "Isolating..." : "Log Rift"}
          </button>
        </div>

        {/* Bug Warning Footer */}
        <div className="mt-8 pt-4 border-t border-red-500/20 text-red-500 text-[10px] uppercase tracking-widest text-center leading-relaxed font-bold">
          The Scout function has only just been created and may have bugs - be patient with it please and submit bugs to Kollamma in the EXTI App Dev channel.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-0.5 space-y-1 h-full">
      <div className="flex w-full gap-2">
        {/* Broadcast vector locations */}
        <DebugLabel label="Broadcast Module" className="flex-[7]">
          <div className="border border-accent/20 bg-bg-main/50 p-1 flex flex-col space-y-1">
            <div className="flex items-center justify-start gap-4">
              <div className="flex items-center gap-2">
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
                    <button 
                      onClick={handleBroadcast}
                      disabled={isBroadcasting}
                      className="relative px-4 py-2.5 text-[11px] uppercase tracking-[0.1em] border border-accent bg-accent/10 text-text-accent font-medium rounded-sm hover:bg-accent/20 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,99,33,0.15)] disabled:opacity-50"
                    >
                      <CornerAccents color="white" />
                      {isBroadcasting ? ">_ Synchronizing..." : ">_ Broadcast vector locations"}
                    </button>
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

        {/* Isolate Rift Apertures */}
        <DebugLabel label="Isolate Module" className="flex-[3]">
          <div className="border border-accent/20 bg-bg-main/50 p-1 flex flex-col space-y-1">
            <div className="flex items-center justify-start gap-4">
              <div className="flex items-center gap-2">
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
                    {isIsolating ? ">_ ISOLATING..." : ">_ Isolate Rift Apertures"}
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
            </div>
          </div>
        </DebugLabel>
      </div>

      <div className="flex w-full gap-2 flex-grow min-h-0">
        {/* Vector Repository */}
        <DebugLabel label="Vector Repository" className="flex-[7]">
          <div className="h-full border border-accent/20 bg-bg-main/50 p-0.5 flex flex-col space-y-0.5 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-accent/10 pb-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-main font-bold">Vector Repository</span>
              {isLoaded && (
                <DebugLabel label="Search Input">
                  <input 
                    type="text" 
                    placeholder="SEARCH SYSTEM..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    className="w-32 bg-transparent border-b border-accent/20 text-[9px] text-text-main uppercase tracking-widest outline-none focus:border-accent/60 transition-all placeholder:text-zinc-600"
                  />
                </DebugLabel>
              )}
            </div>

            {!isLoaded ? (
              <div className="flex-grow flex flex-col items-center justify-center space-y-4">
                <div className="w-full max-w-md overflow-hidden">
                  <VectorGrid />
                </div>
                <DebugLabel label="Retrieve Data Button">
                  <button 
                    onClick={handleRetrieveData}
                    disabled={isLoading}
                    className="relative px-4 py-2.5 text-[11px] uppercase tracking-[0.1em] border border-accent bg-accent/10 text-text-accent font-medium rounded-sm hover:bg-accent/20 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,99,33,0.15)] disabled:opacity-50"
                  >
                    <CornerAccents color="white" />
                    {isLoading ? ">_ ACCESSING DATA..." : ">_ Retrieve vector data"}
                  </button>
                </DebugLabel>
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-bg-main z-10">
                    <tr className="border-b border-accent/20">
                      <th className="py-2 px-3 text-[12px] uppercase tracking-widest text-text-dim font-medium">System Name</th>
                      <th className="py-2 px-3 text-[12px] uppercase tracking-widest text-text-dim font-medium">Last Scouted By</th>
                      <th 
                        className="py-2 px-3 text-[12px] uppercase tracking-widest text-text-dim font-medium cursor-pointer hover:text-text-main transition-colors"
                        onClick={() => setSortByStrength(!sortByStrength)}
                      >
                        <div className="flex items-center gap-1">
                          Strength
                          {sortByStrength ? (
                            <span className="text-text-main">▼</span>
                          ) : (
                            <span className="opacity-20">▽</span>
                          )}
                        </div>
                      </th>
                      <th className="py-2 px-3 text-[12px] uppercase tracking-widest text-text-dim font-medium">Vectors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accent/5">
                    {filteredScouts.map((scout) => (
                      <tr key={scout.system_id} className="hover:bg-accent/5 transition-colors group">
                        <td className="py-2 px-3 text-[13px] uppercase tracking-widest text-text-main font-mono">{scout.system_id}</td>
                        <td className="py-2 px-3">
                          <div className="flex flex-col">
                            <span className="text-[13px] uppercase tracking-widest text-text-main">{scout.last_scouted_by_user?.username || 'Unknown'}</span>
                            <span className="text-[10px] uppercase tracking-widest text-text-dim">
                              {new Date(scout.updated_at).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-[13px] uppercase tracking-widest text-text-main font-mono">{scout.system_strength}</td>
                        <td className="py-2 px-3 text-[12px] uppercase tracking-widest text-text-dim max-w-[200px] truncate group-hover:whitespace-normal group-hover:overflow-visible">
                          {decodeVectors(scout.site_contents)}
                        </td>
                      </tr>
                    ))}
                    {filteredScouts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[10px] uppercase tracking-widest text-text-dim">
                          No matching vector data found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DebugLabel>

        {/* Tangible Rifts */}
        <DebugLabel label="Tangible Rifts" className="flex-[3]">
          <div className="h-full border border-accent/20 bg-bg-main/50 p-0.5 flex flex-col space-y-0.5 min-h-0">
            <div className="border-b border-accent/10 pb-2 px-2 flex justify-between items-center">
              <span className="text-[18px] uppercase tracking-[0.2em] text-text-main font-bold">Tangible Rifts</span>
              <span className="text-[14px] text-text-dim uppercase tracking-widest">{rifts.length} Detected</span>
            </div>
            
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-0.5">
              {rifts.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[18px] uppercase tracking-widest text-text-dim animate-pulse">
                    Awaiting rift synchronization...
                  </span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-bg-main z-10">
                    <tr className="border-b border-accent/10">
                      <th className="py-2 px-3 text-[14px] uppercase tracking-widest text-text-dim font-medium">System ID</th>
                      <th className="py-2 px-3 text-[14px] uppercase tracking-widest text-text-dim font-medium">Rift Type</th>
                      <th className="py-2 px-3 text-[14px] uppercase tracking-widest text-text-dim font-medium text-right">Age</th>
                      <th className="py-2 px-3 text-[14px] uppercase tracking-widest text-text-dim font-medium text-right">Closed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accent/5">
                    {rifts.map((rift) => (
                      <tr key={rift.id} className="hover:bg-accent/5 transition-colors group">
                        <td className="py-3 px-3 text-[14px] uppercase tracking-wider text-text-main font-mono">{rift.system_id}</td>
                        <td className="py-3 px-3 text-[14px] uppercase tracking-tighter text-text-dim">{rift.type}</td>
                        <td className="py-3 px-3 text-[12px] uppercase tracking-widest text-text-main text-right font-mono">
                          {calculateAge(rift.created_at)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button 
                            onClick={() => setRiftToDelete(rift.id)}
                            className="text-[10px] uppercase tracking-widest text-text-dim hover:text-red-500 transition-colors border border-text-dim/20 px-2 py-1 rounded-sm"
                          >
                            &gt;_close aperture?
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </DebugLabel>
      </div>

      {/* Confirmation Modal */}
      {riftToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-bg-main border border-accent/40 p-6 space-y-6 max-w-xs w-full relative">
            <CornerAccents color="var(--color-accent)" />
            <div className="text-center space-y-2">
              <h3 className="text-[12px] uppercase tracking-[0.2em] text-text-main font-bold">Confirm Deletion</h3>
              <p className="text-[10px] uppercase tracking-widest text-text-dim">Are you sure you want to close this aperture?</p>
            </div>
            <div className="flex justify-center gap-8">
              <button 
                onClick={() => handleDeleteRift(riftToDelete)}
                className="p-3 bg-red-600/20 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all rounded-full"
              >
                <Trash2 size={20} />
              </button>
              <button 
                onClick={() => setRiftToDelete(null)}
                className="p-3 bg-zinc-800/20 border border-zinc-700 text-zinc-500 hover:bg-zinc-700 hover:text-white transition-all rounded-full"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bug Warning Footer */}
      <div className="h-[5%] min-h-[32px] flex items-center justify-center border border-red-500/30 bg-red-500/5 text-red-600 text-[10px] uppercase tracking-[0.15em] font-bold text-center px-4 shrink-0 mt-1">
        The Scout function has only just been created and may have bugs - be patient with it please and submit bugs to Kollamma in the EXTI App Dev channel.
      </div>
    </div>
  );
};
