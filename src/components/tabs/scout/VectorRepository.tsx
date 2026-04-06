import { useState, useMemo } from "react";
import { DebugLabel } from "../../../context/DebugContext";
import { CornerAccents, VectorGrid } from "./ScoutUI";
import { decodeVectors } from "./scoutUtils";

export const VectorRepository = ({ 
  scouts = [], 
  isLoaded, 
  isLoading, 
  handleRetrieveData 
}: { 
  scouts: any[]; 
  isLoaded: boolean; 
  isLoading: boolean; 
  handleRetrieveData: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortByStrength, setSortByStrength] = useState(false);

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

  return (
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
                {isLoading ? ">_ ACCESSING DATA..." : ">_ Open Scouting Database"}
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
  );
};
