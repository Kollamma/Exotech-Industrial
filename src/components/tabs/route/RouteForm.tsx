import { Navigation, Loader2, Check, Copy } from "lucide-react";
import { AutocompleteInput } from "../../AutocompleteInput";
import { motion, AnimatePresence } from "motion/react";

interface RouteFormProps {
  user: any;
  startSystem: string;
  setStartSystem: (val: string) => void;
  endSystem: string;
  setEndSystem: (val: string) => void;
  jumpRange: string;
  handleJumpRangeChange: (val: string) => void;
  routeMode: "fastest" | "cheapest";
  setRouteMode: (val: "fastest" | "cheapest") => void;
  handleCalculate: () => void;
  isLoading: boolean;
  route: any[] | null;
  handleCopyRoute: () => void;
  copied: boolean;
  error: string | null;
  formatSystemName: (val: string) => string;
}

export const RouteForm = ({
  user,
  startSystem,
  setStartSystem,
  endSystem,
  setEndSystem,
  jumpRange,
  handleJumpRangeChange,
  routeMode,
  setRouteMode,
  handleCalculate,
  isLoading,
  route,
  handleCopyRoute,
  copied,
  error,
  formatSystemName
}: RouteFormProps) => {
  const handleSetHome = () => {
    if (user?.home_system) {
      setStartSystem(formatSystemName(user.home_system));
    }
  };

  return (
    <div className="flex-[4] border border-accent/20 bg-bg-main/50 p-4 flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
      <div className="text-[10px] uppercase tracking-[0.3em] text-text-main font-bold border-b border-accent/20 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation size={14} className="text-accent" />
          Navigation Parameters
        </div>
        
        <div className="flex items-center bg-bg-main border border-accent/20 p-0.5 rounded-sm">
          <button
            onClick={() => setRouteMode("fastest")}
            className={`px-2 py-1 text-[8px] uppercase tracking-widest transition-all ${
              routeMode === "fastest" 
              ? "bg-accent text-black font-bold" 
              : "text-text-dim hover:text-text-main"
            }`}
          >
            Fastest
          </button>
          <button
            onClick={() => setRouteMode("cheapest")}
            className={`px-2 py-1 text-[8px] uppercase tracking-widest transition-all ${
              routeMode === "cheapest" 
              ? "bg-accent text-black font-bold" 
              : "text-text-dim hover:text-text-main"
            }`}
          >
            Cheapest
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-text-dim">Start System</label>
          <div className="relative">
            <AutocompleteInput
              value={startSystem}
              onChange={(val) => setStartSystem(formatSystemName(val))}
              placeholder="E.G. ERS7R4"
              className="w-full bg-bg-main border border-accent/30 p-3 pr-16 text-sm font-bold text-text-main uppercase tracking-widest outline-none focus:border-accent placeholder:text-zinc-800"
            />
            {user?.home_system && (
              <button
                onClick={handleSetHome}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[8px] uppercase tracking-widest bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all font-bold"
              >
                Home
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-text-dim">End System</label>
          <AutocompleteInput
            value={endSystem}
            onChange={(val) => setEndSystem(formatSystemName(val))}
            placeholder="DESTINATION"
            className="w-full bg-bg-main border border-accent/30 p-3 text-sm font-bold text-text-main uppercase tracking-widest outline-none focus:border-accent placeholder:text-zinc-800"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-text-dim">Jump Range (LY)</label>
          <input
            type="number"
            step="0.1"
            max="111"
            value={jumpRange}
            onChange={(e) => handleJumpRangeChange(e.target.value)}
            className="w-full bg-bg-main border border-accent/30 p-3 text-sm font-bold text-text-main uppercase tracking-widest outline-none focus:border-accent"
          />
        </div>
      </div>

      <button
        onClick={handleCalculate}
        disabled={isLoading}
        className="w-full py-4 text-sm uppercase tracking-[0.2em] bg-accent text-black font-black transition-all hover:bg-accent/80 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Calculating...
          </>
        ) : (
          ">_ Calculate Route"
        )}
      </button>

      <AnimatePresence>
        {route && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={handleCopyRoute}
            className="w-full py-4 text-sm uppercase tracking-[0.2em] border border-accent text-accent font-bold transition-all hover:bg-accent/10 flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check size={18} />
                Note Created
              </>
            ) : (
              <>
                <Copy size={18} />
                {">_ Create In-Game Note"}
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {error && (
        <div className="p-3 border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] uppercase tracking-widest text-center animate-pulse">
          {error}
        </div>
      )}
    </div>
  );
};
