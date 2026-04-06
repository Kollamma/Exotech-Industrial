import { DebugLabel } from "../../../context/DebugContext";
import { calculateAge } from "./scoutUtils";

export const ReportedRifts = ({ 
  rifts = [], 
  setRiftToDelete 
}: { 
  rifts: any[]; 
  setRiftToDelete: (id: string) => void;
}) => {
  return (
    <DebugLabel label="Reported Rifts" className="flex-[3]">
      <div className="h-full border border-accent/20 bg-bg-main/50 p-0.5 flex flex-col space-y-0.5 min-h-0">
        <div className="border-b border-accent/10 pb-2 px-2 flex justify-between items-center">
          <span className="text-[18px] uppercase tracking-[0.2em] text-text-main font-bold">Reported Rifts</span>
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
  );
};
