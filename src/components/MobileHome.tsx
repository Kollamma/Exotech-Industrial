import { ChevronRight } from "lucide-react";

interface MobileHomeProps {
  user: any;
  onUpdate?: (data: any) => void;
  setMobileView: (view: "home" | "scouting" | "wallet") => void;
}

export const MobileHome = ({ user, onUpdate, setMobileView }: MobileHomeProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-accent/20">
        <div className="w-5" />
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-text-main italic">Log personal data</h2>
        <button onClick={() => setMobileView("scouting")} className="text-text-dim">
          <ChevronRight size={20} />
        </button>
      </div>
      
      <div className="flex flex-col items-center justify-center flex-grow space-y-8 p-6">
        <div className="w-full space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.2em] text-text-dim">Ship Class</label>
            <select 
              value={user.ship_type || "Wend"} 
              onChange={(e) => onUpdate?.({ ship_type: e.target.value })}
              className="w-full bg-bg-main border border-accent/30 p-3 text-sm font-bold text-text-main uppercase tracking-widest outline-none focus:border-accent"
            >
              {["Wend", "Reflex", "Reiver", "USV", "Tades", "Maul"].map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.2em] text-text-dim">Industry Level</label>
            <select 
              value={user.industry_class || "Tutorial"} 
              onChange={(e) => onUpdate?.({ industry_class: e.target.value })}
              className="w-full bg-bg-main border border-accent/30 p-3 text-sm font-bold text-text-main uppercase tracking-widest outline-none focus:border-accent"
            >
              {["Tutorial", "Network Node / Refinery", "Mini-Berth / Mini-Printer", "Berth / Printer", "Heavy Refinery", "Heavy Berth"].map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.2em] text-text-dim">Home System</label>
            <input 
              type="text"
              value={user.home_system || ""}
              onChange={(e) => onUpdate?.({ home_system: e.target.value })}
              placeholder="UNDEFINED"
              className="w-full bg-bg-main border border-accent/30 p-3 text-sm font-bold text-text-main uppercase tracking-widest outline-none focus:border-accent placeholder:text-zinc-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
