import { motion } from "motion/react";
import { Hexagon, Circle, Orbit, Plus, Edit2 } from "lucide-react";
import { FloatingCharacters } from "./FloatingCharacters";
import { GateData, MAX_FOAM } from "./types";

export const WarpGate = ({ 
  data, 
  onInputFoam,
  onEditGate,
  isAdmin,
  gateRef,
  allGates
}: { 
  data: GateData; 
  onInputFoam: (id: string) => void;
  onEditGate: (id: string) => void;
  isAdmin: boolean;
  gateRef?: (el: HTMLDivElement | null) => void;
  allGates: GateData[];
}) => {
  const progress = Math.min((data.foam / MAX_FOAM) * 100, 100);
  const isBuilt = data.foam >= MAX_FOAM || data.built;
  const radius = 62;
  const brickCount = 420;

  const sortedContributors = [...data.contributors].sort((a, b) => b.amount - a.amount);

  const colors = [
    "text-[#00f2ff]",
    "text-[#94a3b8]",
  ];

  let cumulative = 0;
  const segments = sortedContributors.map((c, i) => {
    const start = cumulative;
    cumulative += c.amount;
    return { ...c, start, end: cumulative, colorClass: colors[i % colors.length] };
  });

  let side: 'left' | 'right' = 'left';
  if (data.connected_to) {
    const myIndex = allGates.findIndex(g => g.id === data.id);
    const otherGate = allGates.find(g => g.name.trim() === data.connected_to.trim());
    if (myIndex !== -1 && otherGate) {
      const otherIndex = allGates.findIndex(g => g.id === otherGate.id);
      if (myIndex > otherIndex) {
        side = 'right';
      } else {
        side = 'left';
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div 
        onClick={() => isAdmin && onEditGate(data.id)}
        className={`text-[10px] font-mono text-accent/60 tracking-widest flex items-center gap-2 mb-0 z-10 relative ${isAdmin ? "cursor-pointer hover:text-accent hover:bg-accent/5 px-2 py-0.5 border border-transparent hover:border-accent/20 transition-all pointer-events-auto" : ""}`}
      >
        {data.name}
        {isAdmin && <Edit2 size={10} className="opacity-70" />}
      </div>

      <div className="relative flex items-center justify-center w-48 h-48 group -mt-6" ref={gateRef}>
        {!isBuilt && (
          <div className="absolute top-0 right-[85%] flex flex-col gap-1 z-20 pointer-events-none items-end">
            {sortedContributors.map((c, i) => (
              <motion.div
                key={`${c.name}-${i}`}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-[8px] font-mono ${colors[i % colors.length]} whitespace-nowrap uppercase tracking-tighter font-black drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]`}
              >
                {c.name} {Math.round((c.amount / MAX_FOAM) * 100)}%
              </motion.div>
            ))}
          </div>
        )}

        <div className="absolute top-0 right-0 z-10 flex flex-col items-end gap-1">
          <div className={`text-[6px] font-black px-1 py-0.5 rounded-sm ${data.fuel_status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {data.fuel_status}
          </div>
          <div className="text-[5px] text-accent/40 font-mono">
            V:{data.fuel_value}
          </div>
        </div>

        {data.connected_to && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[6px] font-mono text-accent/30 whitespace-nowrap uppercase tracking-widest">
            LINKED_TO: {data.connected_to}
          </div>
        )}

        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
          {[...Array(brickCount)].map((_, i) => {
            const angle = (i * 360 / brickCount) - 90;
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + radius * Math.cos(rad);
            const y1 = 100 + radius * Math.sin(rad);
            const x2 = 100 + (radius + 4) * Math.cos(rad);
            const y2 = 100 + (radius + 4) * Math.sin(rad);
            
            const contributor = segments.find(s => i >= s.start && i < s.end);
            const isActive = i < data.foam;
            const colorClass = isBuilt 
              ? "text-slate-700" 
              : (contributor ? contributor.colorClass : "text-accent/5");
            
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth="1"
                className={`${isActive ? colorClass : "text-accent/5"} transition-colors duration-500`}
                style={{
                  filter: (isActive && !isBuilt) ? "drop-shadow(0 0 2px currentColor)" : "none"
                }}
              />
            );
          })}
        </svg>

        <Hexagon 
          size={96} 
          className={`text-accent/10 ${isBuilt ? "animate-[spin_36s_linear_infinite]" : "animate-[spin_164s_linear_infinite]"}`} 
          strokeWidth={0.5} 
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <Hexagon 
            size={75} 
            className={`text-accent/20 ${isBuilt ? "animate-[spin_22s_linear_infinite_reverse]" : ""}`} 
            strokeWidth={1} 
          />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <Circle 
            size={48} 
            className={`text-accent/40 ${isBuilt ? "animate-pulse" : ""}`} 
            strokeWidth={1.5} 
          />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <Circle 
              size={27} 
              className={`text-accent ${isBuilt ? "animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" : ""}`} 
              strokeWidth={2} 
            />
            <div className="absolute w-4 h-4 bg-accent rounded-full blur-[2px] opacity-90 shadow-[0_0_12px_rgba(var(--accent-rgb),0.5)]" />
            <div className="absolute w-11 h-11 bg-accent/10 rounded-full blur-2xl animate-pulse" />
            
            {isBuilt && (
              <div className="absolute inset-0 flex items-center justify-center animate-[spin_54s_linear_infinite]">
                <div className="relative w-28 h-28">
                  <div className="absolute top-[18%] right-[18%] w-1.5 h-1.5 bg-accent rounded-full blur-[1px] shadow-[0_0_10px_rgba(var(--accent-rgb),1)]" />
                  <div className="absolute bottom-[18%] left-[18%] w-1.5 h-1.5 bg-accent rounded-full blur-[1px] shadow-[0_0_10px_rgba(var(--accent-rgb),1)]" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <Orbit 
            size={115} 
            className={`text-accent/5 ${isBuilt ? "animate-[spin_54s_linear_infinite]" : ""}`} 
            strokeWidth={0.5} 
          />
        </div>
        
        {!isBuilt && <FloatingCharacters />}
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div className="w-px h-full bg-accent/30" />
          <div className="h-px w-full bg-accent/30 absolute" />
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-mono text-accent/20 tracking-tighter pointer-events-none">
          {Math.round(progress)}%
        </div>

        {!isBuilt && (
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 text-[9px] font-mono text-accent/40 tracking-widest pointer-events-none font-bold">
            {data.foam}/{MAX_FOAM}
          </div>
        )}
      </div>

      {!data.built && (
        <button 
          onClick={() => onInputFoam(data.id)}
          className="px-4 py-1.5 border border-accent/30 text-accent text-[8px] uppercase tracking-widest hover:bg-accent/10 transition-all font-bold flex items-center gap-2 mt-2"
        >
          <Plus size={10} />
          {">_ Input Foam"}
        </button>
      )}
    </div>
  );
};
