import { useState, useEffect } from "react";
import { DebugLabel } from "../context/DebugContext";
import { RiftAlert } from "./RiftAlert";

export const Header = ({ user, onUpdate, onOpenAvailability }: { user?: any; onUpdate: (data: any) => void; onOpenAvailability: () => void }) => {
  const [homeSystem, setHomeSystem] = useState(user?.home_system || "Undefined");

  useEffect(() => {
    setHomeSystem(user?.home_system || "Undefined");
  }, [user?.home_system]);

  useEffect(() => {
    if (homeSystem === user?.home_system) return;

    const handler = setTimeout(() => {
      onUpdate({ home_system: homeSystem });
    }, 30000);

    return () => clearTimeout(handler);
  }, [homeSystem, user?.home_system, onUpdate]);

  const isAcquired = !!user?.availability_mask;

  return (
    <DebugLabel label="Header Container" className="w-full p-1 flex flex-col z-20 border border-accent/20 bg-accent/5 backdrop-blur-md shrink-0">
      <header className="flex items-center relative px-4 h-20">
        {/* 20% Title and Welcome */}
        <div className="w-[20%] flex items-center gap-4 min-w-0">
          <div className="space-y-0.5 truncate">
            <h1 className="text-sm md:text-base font-black tracking-[0.1em] uppercase text-text-main italic font-serif leading-tight truncate">
              Exotech Industrial
            </h1>
            {user && (
              <div className="space-y-0 truncate">
                <p className="hidden md:block text-[11px] text-text-main font-bold uppercase tracking-widest truncate">
                  Welcome, {user.username}
                </p>
                <p className="text-[8px] text-text-dim uppercase tracking-widest truncate">
                  {user.username} | Status: Authorised
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* 40% Rift Alert (Pride of Place) */}
        <div className="w-[40%] flex items-center justify-center px-4 border-l border-accent/20 h-full">
          <RiftAlert />
        </div>

        {/* 40% Personal Settings */}
        <div className="w-[40%] flex items-center gap-4 px-4 border-l border-accent/20">
          {user && (
            <div className="flex flex-col gap-0.5 w-full">
              <div className="text-[9px] uppercase tracking-widest text-accent font-bold">
                Please keep your personal intel up to date
              </div>
              <div className="flex items-center justify-between gap-2">
                <DebugLabel label="Ship Class Select" className="space-y-0.5 text-left flex-1 min-w-0">
                  <div className="text-[9px] uppercase tracking-widest text-text-dim truncate">Ship Class</div>
                  <select 
                    value={user.ship_type || "Wend"} 
                    onChange={(e) => onUpdate({ ship_type: e.target.value })}
                    className="bg-transparent text-[11px] font-bold text-text-main border-none focus:ring-0 cursor-pointer text-left p-0 h-auto w-full"
                  >
                    {["Wend", "Reflex", "Reiver", "USV", "Tades", "Maul"].map(option => (
                      <option key={option} value={option} className="bg-bg-main">{option}</option>
                    ))}
                  </select>
                </DebugLabel>
                <DebugLabel label="Industry Level Select" className="space-y-0.5 text-left flex-[1.5] min-w-0">
                  <div className="text-[9px] uppercase tracking-widest text-text-dim truncate">Industry Level</div>
                  <select 
                    value={user.industry_class || "Tutorial"} 
                    onChange={(e) => onUpdate({ industry_class: e.target.value })}
                    className="bg-transparent text-[11px] font-bold text-text-main border-none focus:ring-0 cursor-pointer text-left p-0 h-auto w-full"
                  >
                    {["Tutorial", "Network Node / Refinery", "Mini-Berth / Mini-Printer", "Berth / Printer", "Heavy Refinery", "Heavy Berth"].map(option => (
                      <option key={option} value={option} className="bg-bg-main">{option}</option>
                    ))}
                  </select>
                </DebugLabel>
                <DebugLabel label="Home System Input" className="space-y-0.5 text-left flex-1 min-w-0">
                  <div className="text-[9px] uppercase tracking-widest text-text-dim truncate">Home System</div>
                  <input 
                    type="text"
                    value={homeSystem}
                    onChange={(e) => setHomeSystem(e.target.value)}
                    className="bg-transparent text-[9px] font-bold text-text-main border-none focus:ring-0 w-full text-left p-0 h-auto"
                  />
                </DebugLabel>
                <DebugLabel label="Availability Metric" className="space-y-0.5 text-left flex-1 min-w-0">
                  <div className="text-[9px] uppercase tracking-widest text-text-dim truncate">Availability</div>
                  <button 
                    onClick={onOpenAvailability}
                    className="flex flex-col gap-1 group/avail cursor-pointer text-left w-full"
                  >
                    <div className={`relative w-12 h-2.5 border overflow-hidden transition-all group-hover/avail:border-accent/60 ${isAcquired ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                      <div className={`absolute inset-0 opacity-40`} style={{ backgroundImage: `repeating-linear-gradient(45deg, ${isAcquired ? '#22c55e' : '#ef4444'} 0, ${isAcquired ? '#22c55e' : '#ef4444'} 1px, transparent 0, transparent 4px)` }}></div>
                    </div>
                    <span className={`text-[8px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors group-hover/avail:text-text-accent ${isAcquired ? 'text-green-400' : 'text-red-400'}`}>
                      {isAcquired ? ">_Acquired" : ">_Unclassified"}
                    </span>
                  </button>
                </DebugLabel>
              </div>
            </div>
          )}
        </div>
      </header>
    </DebugLabel>
  );
};
