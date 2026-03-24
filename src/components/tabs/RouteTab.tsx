import { useState } from "react";
import { DebugLabel } from "../../context/DebugContext";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Navigation, Loader2, Copy, Check, Rocket } from "lucide-react";
import { AutocompleteInput } from "../AutocompleteInput";

interface RouteStep {
  name: string;
  dist: number;
  ingame_link: string;
  type: "START" | "DRIVE" | "GATE";
}

const GateIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" />
    <rect x="9" y="9" width="6" height="6" fill="currentColor" />
  </svg>
);

export const RouteTab = ({ user, initialData }: { user?: any; initialData?: any }) => {
  const [startSystem, setStartSystem] = useState("");
  const [endSystem, setEndSystem] = useState("");
  const [jumpRange, setJumpRange] = useState("50");
  const [routeMode, setRouteMode] = useState<"fastest" | "cheapest">("fastest");
  const [isLoading, setIsLoading] = useState(false);
  const [route, setRoute] = useState<RouteStep[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSetHome = () => {
    if (user?.home_system) {
      setStartSystem(formatSystemName(user.home_system));
    }
  };

  const formatSystemName = (val: string) => {
    const cleaned = val.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6);
    if (cleaned.length > 3) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    return cleaned;
  };

  const handleJumpRangeChange = (val: string) => {
    if (val === "") {
      setJumpRange("");
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num) && num > 111) {
      setJumpRange("111");
    } else {
      setJumpRange(val);
    }
  };

  const handleCalculate = async () => {
    if (!startSystem || !endSystem) {
      setError("START AND END SYSTEMS REQUIRED");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRoute(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const rawBaseUrl = import.meta.env.VITE_NAV_SERVICE_URL || "https://nav-service.railway.app";
      const baseUrl = rawBaseUrl.replace(/\/+$/, "");
      const params = new URLSearchParams({
        start: startSystem.toUpperCase(),
        end: endSystem.toUpperCase(),
        max_ly: jumpRange,
        mode: routeMode,
      });

      console.log(`Polling navigation service at: ${baseUrl}/plan?${params.toString()}`);
      const response = await fetch(`${baseUrl}/plan?${params.toString()}`, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Service Error: ${response.statusText}`);
      }

      const data = await response.json();
      setRoute(data.route);
    } catch (err: any) {
      console.error("Route calculation error:", err);
      if (err.name === 'AbortError') {
        setError("REQUEST TIMED OUT (10S)");
      } else {
        setError(err.message || "FAILED TO CALCULATE ROUTE");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleCopyRoute = () => {
    if (!route) return;

    let header = `<font size="10" color="#ff4c4c4c">&gt;_STELLAR_NETWORK_INITIALIZED<br>&gt;_UPLINK_ESTABLISHED_WITH_EXOTECH_NAV_ARRAY<br>&gt;_STELLAR_ROUTE_CALCULATED<br><br></font>`;
    
    if (routeMode === "cheapest") {
      header = `<font size="14" color="#bfffffff"></font><font size="10" color="#ff4c4c4c">&gt;_STELLAR_NETWORK_INITIALIZED<br>&gt;_UPLINK_ESTABLISHED_WITH_EXOTECH_NAV_ARRAY<br>&gt;_STELLAR_ROUTE_CALCULATED<br><br>&gt;_ROUTE OPTIMISED FOR CHEAPEST ROUTE - </font><font size="10" color="#ff7f0000">CAUTION, YOU ARE POTENTIALLY EXPENDING ADDITIONAL FUEL<br><br></font>`;
    }
    
    const start = `<font size="14" color="#bfffffff">:|&gt;Starting at ${startSystem.toUpperCase()}<br>`;
    
    const steps = route.map((step, index) => {
      if (step.type === "START") return null;
      const prefix = step.type === "GATE" ? ":Z Gate-Jump to " : ":| Drive-Jump to ";
      const link = step.type === "GATE" ? step.name : step.ingame_link;
      return `${prefix}</font><font size="14" color="#ffd98d00">${link}</font><font size="14" color="#bfffffff"> - (${step.dist.toFixed(2)} LY)<br>`;
    }).filter(Boolean).join('');

    const footer = `<br></font><font size="10" color="#ff4c4c4c">&gt;_NAVIGATION_DATA_SYNC_COMPLETE<br>&gt;_SAFE_TRAVELS_PILOT<br></font><font size="10" color="#ff7f7f00">&gt;_THANK_YOU_FOR_ROUTE-PLANNING_WITH_EXOTECH_INDUSTRIAL_TODAY</font>`;

    const fullText = `${header}${start}${steps}${footer}`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DebugLabel label="Route Module" className="flex flex-col h-full p-1 gap-1">
      <div className="flex flex-grow gap-2 min-h-0">
        {/* Left Column: Input Form */}
        <div className="flex-[4] border border-accent/20 bg-bg-main/50 p-4 flex flex-col space-y-6">
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
                    Route Ingested
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    {">_ Ingest Route"}
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

        {/* Right Column: Results Pane */}
        <div className="flex-[6] border border-accent/20 bg-bg-main/50 p-4 flex flex-col space-y-4 min-h-0">
          <div className="text-[10px] uppercase tracking-[0.3em] text-text-main font-bold border-b border-accent/20 pb-2">
            Stellar Path Projection
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
            <AnimatePresence mode="wait">
              {!route && !isLoading && (
                <motion.div
                  key="awaiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center space-y-4 opacity-30"
                >
                  <MapPin size={48} className="text-text-dim" />
                  <div className="text-[10px] uppercase tracking-[0.2em] text-text-dim text-center">
                    Awaiting navigation parameters...
                  </div>
                </motion.div>
              )}

              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center space-y-4"
                >
                  <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <div className="text-[10px] uppercase tracking-[0.2em] text-accent animate-pulse">
                    Calculating Route...
                  </div>
                </motion.div>
              )}

              {route && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  {route.map((step, index) => (
                    <div
                      key={`${step.name}-${index}`}
                      className="group relative border border-accent/10 bg-accent/5 p-3 flex items-center justify-between hover:border-accent/40 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] font-mono text-text-dim w-6">
                          {index.toString().padStart(2, '0')}
                        </div>
                        
                        <div className="flex items-center justify-center w-6 text-accent">
                          {step.type === "START" ? (
                            <MapPin size={14} />
                          ) : step.type === "GATE" ? (
                            <GateIcon size={14} />
                          ) : (
                            <Rocket size={14} />
                          )}
                        </div>

                        <div className="flex flex-col">
                          <div className="text-sm font-bold text-text-main uppercase tracking-widest flex items-center gap-2">
                            {step.name}
                            {step.type !== "GATE" && (
                              <span 
                                dangerouslySetInnerHTML={{ __html: step.ingame_link }} 
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-accent hover:underline cursor-pointer" 
                              />
                            )}
                          </div>
                          <div className="text-[10px] text-text-dim uppercase tracking-widest">
                            {step.type === "START" ? "Starting Location" : `Distance: ${step.dist.toFixed(2)} LY`}
                          </div>
                        </div>
                      </div>
                      {index < route.length - 1 && (
                        <div className="absolute -bottom-2 left-7 w-px h-2 bg-accent/30" />
                      )}
                    </div>
                  ))}
                  
                  <div className="pt-4 flex justify-between items-center border-t border-accent/10">
                    <div className="text-[10px] uppercase tracking-widest text-text-dim">
                      Total Jumps: {route.length - 1}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-text-accent font-bold">
                      Route Verified
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bug Warning Footer */}
      <div className="h-[5%] min-h-[32px] flex items-center justify-center border border-red-500/30 bg-red-500/5 text-red-600 text-[10px] uppercase tracking-[0.15em] font-bold text-center px-4 shrink-0">
        The Route function has only just been created and may have bugs - be patient with it please and submit bugs to Kollamma in the EXTI App Dev channel.
      </div>
    </DebugLabel>
  );
};
