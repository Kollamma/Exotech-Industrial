import { useState, useEffect, useRef } from "react";
import { X, Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const SLOTS_PER_DAY = 48; // 24 hours * 2 slots per hour

const TIMEZONES = Array.from({ length: 23 }, (_, i) => {
  const offset = i - 12;
  const sign = offset >= 0 ? "+" : "";
  return `UTC ${sign}${offset}`;
}).filter(tz => {
    const offset = parseInt(tz.split(' ')[1]);
    return offset >= -12 && offset <= 10;
});

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  availabilityMask: string;
  timezone: string;
  onSave: (mask: string, timezone: string) => void;
}

// Helper to encode 7x48 boolean grid to Base64
const encodeAvailability = (grid: boolean[][]): string => {
  const bytes = new Uint8Array(42); // 336 bits / 8
  let bitIndex = 0;
  for (let d = 0; d < 7; d++) {
    for (let s = 0; s < 48; s++) {
      if (grid[d][s]) {
        const byteIdx = Math.floor(bitIndex / 8);
        const bitOffset = 7 - (bitIndex % 8);
        bytes[byteIdx] |= (1 << bitOffset);
      }
      bitIndex++;
    }
  }
  return btoa(String.fromCharCode(...bytes));
};

// Helper to decode Base64 to 7x48 boolean grid
const decodeAvailability = (mask: string): boolean[][] => {
  const grid = Array.from({ length: 7 }, () => new Array(48).fill(false));
  if (!mask) return grid;
  
  try {
    const binary = atob(mask);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    let bitIndex = 0;
    for (let d = 0; d < 7; d++) {
      for (let s = 0; s < 48; s++) {
        const byteIdx = Math.floor(bitIndex / 8);
        if (byteIdx < bytes.length) {
          const bitOffset = 7 - (bitIndex % 8);
          if ((bytes[byteIdx] >> bitOffset) & 1) {
            grid[d][s] = true;
          }
        }
        bitIndex++;
      }
    }
  } catch (e) {
    console.error("Failed to decode availability mask", e);
  }
  return grid;
};

export const AvailabilityModal = ({ isOpen, onClose, availabilityMask, timezone, onSave }: AvailabilityModalProps) => {
  const [localAvailability, setLocalAvailability] = useState<boolean[][]>(Array.from({ length: 7 }, () => new Array(SLOTS_PER_DAY).fill(false)));
  const [localTimezone, setLocalTimezone] = useState(timezone || "UTC +0");
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalAvailability(decodeAvailability(availabilityMask));
      setLocalTimezone(timezone || "UTC +0");
    }
  }, [isOpen, availabilityMask, timezone]);

  const toggleSlot = (dayIndex: number, slotIndex: number, forceValue?: boolean) => {
    setLocalAvailability(prev => {
      const next = prev.map(day => [...day]);
      const newValue = forceValue !== undefined ? forceValue : !next[dayIndex][slotIndex];
      next[dayIndex][slotIndex] = newValue;
      return next;
    });
  };

  const handleMouseDown = (dayIndex: number, slotIndex: number) => {
    setIsDragging(true);
    const newValue = !localAvailability[dayIndex][slotIndex];
    setDragValue(newValue);
    toggleSlot(dayIndex, slotIndex, newValue);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragValue === null) return;
    
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    if (!target) return;
    
    const day = target.getAttribute('data-day');
    const slot = target.getAttribute('data-slot');
    
    if (day !== null && slot !== null) {
      const dayIdx = parseInt(day);
      const slotIdx = parseInt(slot);
      if (localAvailability[dayIdx][slotIdx] !== dragValue) {
        toggleSlot(dayIdx, slotIdx, dragValue);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragValue(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragValue(null);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const handleSave = () => {
    const mask = encodeAvailability(localAvailability);
    onSave(mask, localTimezone);
    onClose();
  };

  const hours = [
    "00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", 
    "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "00"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-black/90 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="bg-bg-main border border-accent/40 w-full max-w-6xl relative flex flex-col max-h-[98vh] shadow-[0_0_100px_rgba(255,99,33,0.15)] overflow-hidden"
          >
            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50" />
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent z-10" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent z-10" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent z-10" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent z-10" />

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-accent/20 bg-accent/5 relative">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-2 h-2 bg-accent animate-ping absolute inset-0" />
                  <div className="w-2 h-2 bg-accent relative z-10" />
                </div>
                <div>
                  <h2 className="text-base uppercase tracking-[0.4em] text-text-main font-black italic leading-none">
                    Availability Synchronization Protocol
                  </h2>
                  <p className="text-[8px] text-text-dim uppercase tracking-widest mt-1 opacity-60">
                    System: EXOTECH-CHRONO-V4 | Status: Operational
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-accent/20 text-text-dim hover:text-text-accent transition-all border border-transparent hover:border-accent/20"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-4 bg-[radial-gradient(circle_at_50%_50%,rgba(255,99,33,0.02)_0%,transparent_100%)]">
              {/* Timezone Selector */}
              <div className="flex items-center gap-4 bg-accent/5 p-3 border border-accent/10">
                <div className="flex items-center gap-2 text-text-accent">
                  <Globe size={16} className="animate-pulse" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black">Temporal Sector:</span>
                </div>
                <select 
                  value={localTimezone}
                  onChange={(e) => setLocalTimezone(e.target.value)}
                  className="bg-bg-main border border-accent/30 text-[11px] text-text-main uppercase tracking-widest p-1.5 outline-none focus:border-accent shadow-[0_0_15px_rgba(255,99,33,0.1)] transition-all cursor-pointer hover:bg-accent/5"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
                <div className="flex-grow flex flex-col gap-0.5">
                  <div className="h-[1px] bg-accent/20" />
                  <div className="h-[1px] bg-accent/10 ml-4" />
                </div>
                <div className="text-[9px] text-text-dim uppercase tracking-[0.2em] italic font-bold">
                  Ref: {new Date().toLocaleTimeString()} LST
                </div>
              </div>

              {/* Grid Container */}
              <div 
                className="space-y-2 select-none relative" 
                ref={containerRef}
                onMouseMove={handleMouseMove}
              >
                {/* Hour Labels */}
                <div className="flex ml-24 relative h-6 items-end">
                  {hours.map((h, i) => (
                    <div 
                      key={i} 
                      className="absolute text-[8px] text-text-dim font-mono transform -translate-x-1/2 flex flex-col items-center gap-0.5"
                      style={{ left: `${(i / 24) * 100}%` }}
                    >
                      <span className="opacity-40">|</span>
                      <span className={i % 6 === 0 ? "text-text-accent font-black" : ""}>{h}:00</span>
                    </div>
                  ))}
                </div>

                {/* Days Rows */}
                <div className="space-y-1.5">
                  {DAYS.map((day, dayIdx) => (
                    <div key={day} className="flex items-center gap-4 group">
                      <div className="w-20 shrink-0 flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-text-dim font-black group-hover:text-text-accent transition-colors">
                          {day}
                        </span>
                        <div className="h-[1px] w-0 group-hover:w-full bg-accent transition-all duration-300" />
                      </div>
                      <div className="flex-grow flex h-7 gap-[1px] bg-accent/5 border border-accent/20 p-[1px] relative group/row">
                        {/* Row Glow */}
                        <div className="absolute inset-0 bg-accent/0 group-hover/row:bg-accent/[0.02] transition-colors pointer-events-none" />
                        
                        {localAvailability[dayIdx].map((isActive, slotIdx) => (
                          <div
                            key={slotIdx}
                            data-day={dayIdx}
                            data-slot={slotIdx}
                            onMouseDown={() => handleMouseDown(dayIdx, slotIdx)}
                            className={`flex-1 transition-all duration-75 cursor-crosshair relative group/slot
                              ${isActive 
                                ? 'bg-accent shadow-[0_0_10px_rgba(255,99,33,0.4),inset_0_0_5px_rgba(0,0,0,0.3)] z-10' 
                                : 'bg-bg-main/40 hover:bg-accent/20'
                              }
                            `}
                          >
                            {isActive && (
                              <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 4px)' }} />
                            )}
                            {/* Hour markers */}
                            {slotIdx % 2 === 0 && (
                              <div className={`absolute left-0 top-0 bottom-0 w-[1px] pointer-events-none ${slotIdx % 12 === 0 ? 'bg-accent/40' : 'bg-accent/10'}`} />
                            )}
                            {/* Hover Indicator */}
                            <div className="absolute inset-0 bg-white/0 group-hover/slot:bg-white/5 pointer-events-none" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend & Info */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-accent/20">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-accent shadow-[0_0_10px_rgba(255,99,33,0.5)]" />
                    <span className="text-[9px] uppercase tracking-[0.2em] text-text-main font-bold">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-bg-main border border-accent/30" />
                    <span className="text-[9px] uppercase tracking-[0.2em] text-text-dim font-bold">Standby</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-text-dim uppercase tracking-[0.2em] italic opacity-80">
                    &gt; Drag to define operational windows
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-text-dim uppercase tracking-widest leading-tight">
                    Personnel availability is used for mission planning. 
                    Keep your schedule updated for optimal fleet coordination.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-accent/5 border-t border-accent/20 flex justify-between items-center">
              <div className="flex gap-3">
                <div className="px-2 py-0.5 border border-accent/20 text-[8px] text-text-dim uppercase tracking-widest">
                  REV: 02.24.26
                </div>
                <div className="px-2 py-0.5 border border-accent/20 text-[8px] text-text-dim uppercase tracking-widest">
                  SEC: AUTHORISED
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={onClose}
                  className="px-6 py-2 text-[11px] uppercase tracking-[0.3em] text-text-dim hover:text-text-accent transition-all font-bold"
                >
                  Abort
                </button>
                <button 
                  onClick={handleSave}
                  className="px-8 py-2 bg-accent text-bg-main text-[11px] uppercase tracking-[0.4em] font-black hover:bg-accent/80 transition-all shadow-[0_0_30px_rgba(255,99,33,0.3)] active:scale-95"
                >
                  Commit to Database
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
