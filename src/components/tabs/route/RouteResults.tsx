import { MapPin, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RouteStep {
  name: string;
  dist: number;
  ingame_link: string;
  type: "START" | "DRIVE" | "GATE";
}

interface RouteResultsProps {
  route: RouteStep[] | null;
  isLoading: boolean;
}

const GateIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" />
    <rect x="9" y="9" width="6" height="6" fill="currentColor" />
  </svg>
);

export const RouteResults = ({ route, isLoading }: RouteResultsProps) => {
  return (
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
  );
};
