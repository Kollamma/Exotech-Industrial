import { useState, useRef, useEffect } from "react";
import { DebugLabel } from "../../context/DebugContext";
import { Hexagon, Circle, Orbit, Plus, User, Edit2, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { io } from "socket.io-client";

interface Contributor {
  name: string;
  amount: number;
}

interface GateData {
  id: string; // Changed to string for UUID
  name: string;
  code: string;
  owner_username: string;
  owner_uid: string;
  fuel_status: string;
  fuel_value: number;
  connected_to: string;
  foam: number;
  contributors: Contributor[];
  built: boolean;
}

const MAX_FOAM = 420;
const CONNECTION_LINE_THICKNESS = 4; // Adjust this to change the thickness of the connection lines (4-5px recommended)

const FloatingCharacters = () => {
  const [chars, setChars] = useState<{ id: number; char: string; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    const symbols = "01X/?!@#$%&*<>[]{}|\\".split("");
    const initialChars = [...Array(10)].map((_, i) => ({
      id: i,
      char: symbols[Math.floor(Math.random() * symbols.length)],
      x: Math.random() * 60 + 20,
      y: Math.random() * 60 + 20,
      delay: Math.random() * 5
    }));
    setChars(initialChars);

    const interval = setInterval(() => {
      setChars(prev => prev.map(c => Math.random() > 0.8 ? {
        ...c,
        char: symbols[Math.floor(Math.random() * symbols.length)],
        x: Math.random() * 60 + 20,
        y: Math.random() * 60 + 20
      } : c));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {chars.map((c) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, delay: c.delay }}
          className="absolute text-[8px] font-mono text-accent/50"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
        >
          {c.char}
        </motion.div>
      ))}
    </div>
  );
};

const ConnectionLine = ({ start, end }: { start: { x: number, y: number }, end: { x: number, y: number } }) => {
  const [groups, setGroups] = useState<{ id: number; text: string; offset: number; speed: number }[]>([]);
  const [time, setTime] = useState(0);
  
  useEffect(() => {
    const symbols = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/?!@#$%&*<>[]{}|\\".split("");
    const alphanum = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    
    const baseSpeed = 0.05 + Math.random() * 0.02;
    
    const initialGroups = [...Array(10)].map((_, i) => {
      const rand = Math.random();
      let text = "";
      let speedMultiplier = 1;
      
      if (rand < 0.3) {
        // Single character (30%)
        text = symbols[Math.floor(Math.random() * symbols.length)];
        speedMultiplier = 1;
      } else if (rand < 0.5) {
        // Two characters (20%)
        text = symbols[Math.floor(Math.random() * symbols.length)] + symbols[Math.floor(Math.random() * symbols.length)];
        speedMultiplier = 2; // 100% faster
      } else if (rand < 0.7) {
        // Three characters (20%)
        text = [...Array(3)].map(() => symbols[Math.floor(Math.random() * symbols.length)]).join("");
        speedMultiplier = 3; // 200% faster
      } else {
        // Seven characters (30%)
        const suffix = [...Array(5)].map(() => alphanum[Math.floor(Math.random() * alphanum.length)]).join("");
        text = `>_${suffix}`;
        speedMultiplier = 9; // 800% faster
      }

      return {
        id: i,
        text,
        offset: Math.random() * Math.PI * 2,
        speed: baseSpeed * speedMultiplier
      };
    });
    setGroups(initialGroups);

    let frame: number;
    const animate = (t: number) => {
      setTime(t / 1000);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / length; // Unit normal X
  const ny = dx / length;  // Unit normal Y
  const offsetDistance = (CONNECTION_LINE_THICKNESS / 2) + 5;

  return (
    <g>
      {/* The Pulsing Line - Glow effect */}
      <motion.line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="currentColor"
        strokeWidth={CONNECTION_LINE_THICKNESS * 3}
        strokeLinecap="round"
        className="text-accent/10"
        animate={{ 
          opacity: [0.05, 0.2, 0.05],
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Core line for definition - The main visible line */}
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="currentColor"
        strokeWidth={CONNECTION_LINE_THICKNESS}
        strokeLinecap="round"
        className="text-accent/20"
      />
      
      {/* Floating Character Groups - Looping Path */}
      {groups.map(g => {
        const sinVal = Math.sin(time * g.speed + g.offset);
        const cosVal = Math.cos(time * g.speed + g.offset);
        const progress = (sinVal + 1) / 2;
        
        // Offset based on direction (cosVal)
        const directionOffset = cosVal > 0 ? 1 : -1;
        
        const x = start.x + dx * progress + nx * directionOffset * offsetDistance;
        const y = start.y + dy * progress + ny * directionOffset * offsetDistance;
        
        return (
          <text
            key={g.id}
            x={x}
            y={y}
            className="fill-slate-300 text-[6px] font-mono opacity-60"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {g.text}
          </text>
        );
      })}
    </g>
  );
};

const WarpGate = ({ 
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
  const radius = 62; // Shrunk by 20% from 78
  const brickCount = 420;

  // Sort contributors by amount descending - largest starts at 0%
  const sortedContributors = [...data.contributors].sort((a, b) => b.amount - a.amount);

  // Alternating colors: Cyberpunk (Blue/Grey) and Classic (Orange/White)
  const colors = [
    "text-[#00f2ff]", // Cyberpunk Blue
    "text-[#94a3b8]", // Cyberpunk Grey
  ];

  // Calculate segments for coloring
  let cumulative = 0;
  const segments = sortedContributors.map((c, i) => {
    const start = cumulative;
    cumulative += c.amount;
    return { ...c, start, end: cumulative, colorClass: colors[i % colors.length] };
  });

  // Determine side for names
  let side: 'left' | 'right' = 'left';
  if (data.connected_to) {
    const myIndex = allGates.findIndex(g => g.id === data.id);
    const otherGate = allGates.find(g => g.name.trim() === data.connected_to.trim());
    if (myIndex !== -1 && otherGate) {
      const otherIndex = allGates.findIndex(g => g.id === otherGate.id);
      // If we appear later in the grid than the gate we are connected to, we are the "second" gate -> right
      // This ensures the space BETWEEN the gates (right of first, left of second) is clear.
      if (myIndex > otherIndex) {
        side = 'right';
      } else {
        side = 'left';
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Gate Name / ID Label - Moved Above */}
      <div 
        onClick={() => isAdmin && onEditGate(data.id)}
        className={`text-[10px] font-mono text-accent/60 tracking-widest flex items-center gap-2 mb-0 z-10 relative ${isAdmin ? "cursor-pointer hover:text-accent hover:bg-accent/5 px-2 py-0.5 border border-transparent hover:border-accent/20 transition-all pointer-events-auto" : ""}`}
      >
        {data.name}
        {isAdmin && <Edit2 size={10} className="opacity-70" />}
      </div>

      <div className="relative flex items-center justify-center w-48 h-48 group -mt-6" ref={gateRef}>
        {/* Contributor Names List - Always Top Left */}
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

        {/* Fuel Status Indicator */}
        <div className="absolute top-0 right-0 z-10 flex flex-col items-end gap-1">
          <div className={`text-[6px] font-black px-1 py-0.5 rounded-sm ${data.fuel_status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {data.fuel_status}
          </div>
          <div className="text-[5px] text-accent/40 font-mono">
            V:{data.fuel_value}
          </div>
        </div>

        {/* Connection Label */}
        {data.connected_to && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[6px] font-mono text-accent/30 whitespace-nowrap uppercase tracking-widest">
            LINKED_TO: {data.connected_to}
          </div>
        )}

        {/* 420 Bricks Progress Bar */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
          {[...Array(brickCount)].map((_, i) => {
            const angle = (i * 360 / brickCount) - 90;
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + radius * Math.cos(rad);
            const y1 = 100 + radius * Math.sin(rad);
            const x2 = 100 + (radius + 4) * Math.cos(rad);
            const y2 = 100 + (radius + 4) * Math.sin(rad);
            
            // Find which contributor this brick belongs to
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

        {/* Gate Icons (Shrunk by 20%) */}
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
            
            {/* Built State Glow Dots in Orbit circles */}
            {isBuilt && (
              <div className="absolute inset-0 flex items-center justify-center animate-[spin_54s_linear_infinite]">
                <div className="relative w-28 h-28">
                  {/* Dot 1 - matches Orbit's first small circle position */}
                  <div className="absolute top-[18%] right-[18%] w-1.5 h-1.5 bg-accent rounded-full blur-[1px] shadow-[0_0_10px_rgba(var(--accent-rgb),1)]" />
                  {/* Dot 2 - matches Orbit's second small circle position */}
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
        
        {/* Floating Characters for Unbuilt State */}
        {!isBuilt && <FloatingCharacters />}
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div className="w-px h-full bg-accent/30" />
          <div className="h-px w-full bg-accent/30 absolute" />
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-mono text-accent/20 tracking-tighter pointer-events-none">
          {Math.round(progress)}%
        </div>

        {/* Foam Counter at the top of the icon - only if not built */}
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

export const LogisticTab = ({ user, initialData }: { user?: any; initialData?: any }) => {
  const [gates, setGates] = useState<GateData[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  
  const [activeGateId, setActiveGateId] = useState<string | null>(null);
  const [editGateId, setEditGateId] = useState<string | null>(null);
  const [showAddGate, setShowAddGate] = useState(false);
  
  const [inputAmount, setInputAmount] = useState("");
  const [gateForm, setGateForm] = useState({
    name: "",
    code: "",
    owner_username: "",
    owner_uid: "",
    fuel_status: "OFFLINE",
    fuel_value: 0,
    connected_to: "",
    built: false
  });

  const [isLoading, setIsLoading] = useState(true);
  const gateRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const gridRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } }[]>([]);

  const isAdmin = user?.rank >= 1;
  const isSuperAdmin = user?.rank >= 2;

  const updateConnections = () => {
    if (!gridRef.current) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    if (gridRect.width === 0) return;

    const newConnections: any[] = [];
    const processed = new Set<string>();
    const GATE_RADIUS = 62;

    gates.forEach(gate => {
      const connName = gate.connected_to?.trim();
      if (connName && !processed.has(gate.name.trim())) {
        const startEl = gateRefs.current.get(gate.name.trim());
        const endEl = gateRefs.current.get(connName);

        if (startEl && endEl) {
          const startRect = startEl.getBoundingClientRect();
          const endRect = endEl.getBoundingClientRect();

          if (startRect.width > 0 && endRect.width > 0) {
            const startCenterX = (startRect.left + startRect.width / 2) - gridRect.left;
            const startCenterY = (startRect.top + startRect.height / 2) - gridRect.top;
            const endCenterX = (endRect.left + endRect.width / 2) - gridRect.left;
            const endCenterY = (endRect.top + endRect.height / 2) - gridRect.top;

            // 150 degrees on gate to the left (Bottom-Right if 0 is Top)
            // 210 degrees on gate to the right (Bottom-Left if 0 is Top)
            // SVG Angle: 0 is Top, CW.
            // Math Angle: 0 is Right, CCW.
            // SVG 150 -> Math: 90 - 150 = -60 = 300
            // SVG 210 -> Math: 90 - 210 = -120 = 240
            
            const startAngleRad = (150 - 90) * Math.PI / 180;
            const endAngleRad = (210 - 90) * Math.PI / 180;

            newConnections.push({
              start: {
                x: startCenterX + GATE_RADIUS * Math.cos(startAngleRad),
                y: startCenterY + GATE_RADIUS * Math.sin(startAngleRad)
              },
              end: {
                x: endCenterX + GATE_RADIUS * Math.cos(endAngleRad),
                y: endCenterY + GATE_RADIUS * Math.sin(endAngleRad)
              }
            });
            processed.add(gate.name.trim());
            processed.add(connName);
          }
        }
      }
    });
    setConnections(newConnections);
  };

  useEffect(() => {
    updateConnections();
    // Multiple attempts to ensure layout has settled and refs are captured
    const timers = [100, 500, 1000, 2000].map(ms => setTimeout(updateConnections, ms));
    return () => timers.forEach(clearTimeout);
  }, [gates]);

  useEffect(() => {
    window.addEventListener('resize', updateConnections);
    return () => window.removeEventListener('resize', updateConnections);
  }, [gates]);

  const fetchGates = async () => {
    try {
      // Fetch metadata
      const metaRes = await fetch("/api/gates");
      const metaData = await metaRes.json();

      // Fetch foam data
      const foamRes = await fetch("/api/logistic/gates");
      const foamData = await foamRes.json();

      if (Array.isArray(metaData)) {
        const mergedGates = metaData.map(mg => {
          const foam = foamData.find((fd: any) => fd.name === mg.name);
          return {
            ...mg,
            foam: foam?.foam || 0,
            contributors: foam?.contributors || []
          };
        });
        setGates(mergedGates);
      }
    } catch (e) {
      console.error("Fetch gates error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllUsers(data);
      }
    } catch (e) {
      console.error("Fetch users error:", e);
    }
  };

  useEffect(() => {
    fetchGates();
    fetchUsers();

    const socket = io();
    socket.on("manifest_update", () => {
      fetchGates();
    });
    socket.on("gate_update", () => {
      fetchGates();
    });

    return () => {
      socket.disconnect();
    };
  }, [isAdmin]);

  useEffect(() => {
    if (user && !selectedDonor) {
      setSelectedDonor({ uid: user.id, username: user.username });
    }
  }, [user]);

  const handleInputFoam = (id: string) => {
    setActiveGateId(id);
  };

  const handleEditGate = (id: string) => {
    const gate = gates.find(g => g.id === id);
    if (gate) {
      setGateForm({
        name: gate.name,
        code: gate.code,
        owner_username: gate.owner_username,
        owner_uid: gate.owner_uid,
        fuel_status: gate.fuel_status,
        fuel_value: gate.fuel_value,
        connected_to: gate.connected_to,
        built: gate.built || false
      });
      setEditGateId(id);
    }
  };

  const handleSaveGate = async () => {
    if (!gateForm.name.trim() || !gateForm.code.trim()) return;
    
    try {
      const url = editGateId ? `/api/gates/${editGateId}` : "/api/gates";
      const method = editGateId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gateForm)
      });

      if (res.ok) {
        // If connected to another gate, update that gate too (Mirroring)
        if (gateForm.connected_to) {
          const targetGate = gates.find(g => g.name === gateForm.connected_to);
          if (targetGate) {
            await fetch(`/api/gates/${targetGate.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...targetGate,
                connected_to: gateForm.name
              })
            });
          }
        }

        setEditGateId(null);
        setShowAddGate(false);
        fetchGates();
      }
    } catch (e) {
      console.error("Save gate error:", e);
    }
  };

  const handleDeleteGate = async () => {
    if (!editGateId || !isSuperAdmin) return;
    if (!confirm("Are you absolutely sure you want to delete this gate? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/gates/${editGateId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setEditGateId(null);
        fetchGates();
      }
    } catch (e) {
      console.error("Delete gate error:", e);
    }
  };

  const handleAddGate = () => {
    setGateForm({
      name: `GATE_ID_${(gates.length + 1).toString().padStart(3, '0')}`,
      code: `G-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      owner_username: user?.username || "UNKNOWN",
      owner_uid: user?.id || "",
      fuel_status: "OFFLINE",
      fuel_value: 0,
      connected_to: "",
      built: false
    });
    setShowAddGate(true);
  };

  const handleSubmitFoam = async () => {
    if (!selectedDonor || !inputAmount || !activeGateId) return;
    const amount = parseInt(inputAmount);
    if (isNaN(amount) || amount <= 0) return;

    const gate = gates.find(g => g.id === activeGateId);
    if (!gate) return;

    try {
      const res = await fetch("/api/logistic/input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gate_name: gate.name,
          amount: amount,
          donor_uid: selectedDonor.uid
        })
      });

      if (res.ok) {
        setActiveGateId(null);
        setInputAmount("");
      }
    } catch (e) {
      console.error("Submit foam error:", e);
    }
  };

  const totalFoam = gates.reduce((acc, g) => acc + g.foam, 0);
  const totalMaxFoam = gates.length * MAX_FOAM;
  const totalProgress = totalMaxFoam > 0 ? (totalFoam / totalMaxFoam) * 100 : 0;

  return (
    <DebugLabel label="Logistic Module" className="flex flex-col h-full p-4 overflow-y-auto custom-scrollbar relative">
      <div className="flex items-center justify-between mb-0 border-b border-accent/10 pb-2">
        <div className="flex items-center gap-6">
          <div className="text-[11px] uppercase tracking-[0.5em] text-accent font-black animate-pulse whitespace-nowrap">
            LOGISTIC_NETWORK: {totalProgress >= 100 ? "STABILIZED" : "INITIALIZING"}
          </div>
          <div className="h-3 w-px bg-accent/20 hidden sm:block" />
          <p className="text-[9px] uppercase tracking-widest text-text-dim opacity-50 hidden md:block whitespace-nowrap">
            Quantum state stabilization active... awaiting nav-sync
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleAddGate}
            className="px-2 py-1 border border-accent/30 text-accent text-[8px] uppercase tracking-widest hover:bg-accent/20 transition-all font-bold flex items-center gap-1"
          >
            <Plus size={10} />
            Add Gate
          </button>
        )}
      </div>

      <div className="relative" ref={gridRef}>
        {/* Connection Lines Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 text-accent" style={{ minHeight: '100%' }}>
          {connections.map((conn, i) => (
            <ConnectionLine key={i} start={conn.start} end={conn.end} />
          ))}
        </svg>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-16 gap-y-10 justify-items-center py-2 pl-16 relative z-10">
          {gates.map((gate) => (
            <WarpGate 
              key={gate.id} 
              data={gate} 
              onInputFoam={handleInputFoam} 
              onEditGate={handleEditGate}
              isAdmin={isAdmin}
              allGates={gates}
              gateRef={(el) => {
                const name = gate.name.trim();
                if (el) gateRefs.current.set(name, el);
                else gateRefs.current.delete(name);
              }}
            />
          ))}
        </div>
      </div>

      {/* Foam Input Modal Overlay */}
      <AnimatePresence>
        {activeGateId !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-bg-main border border-accent/30 p-6 w-full max-w-sm space-y-6 shadow-[0_0_50px_rgba(var(--accent-rgb),0.2)]"
            >
              <div className="flex items-center justify-between border-b border-accent/20 pb-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold">
                  {gates.find(g => g.id === activeGateId)?.name} // FOAM_INGESTION
                </div>
                <button onClick={() => setActiveGateId(null)} className="text-text-dim hover:text-accent transition-colors">
                  <Plus size={16} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest text-text-dim">Pilot Identification</label>
                  <div className="relative">
                    <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent/50" />
                    {isAdmin ? (
                      <select 
                        value={selectedDonor?.uid || ""} 
                        onChange={(e) => {
                          const u = allUsers.find(u => u.uid === e.target.value);
                          if (u) setSelectedDonor(u);
                        }}
                        className="w-full bg-bg-main border border-accent/20 p-2 pl-8 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                      >
                        {allUsers.map(u => (
                          <option key={u.uid} value={u.uid}>{u.username}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full bg-bg-main/50 border border-accent/20 p-2 pl-8 text-[10px] uppercase tracking-widest text-text-main/40 cursor-not-allowed">
                        {user?.username}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest text-text-dim">Foam Quantity</label>
                  <input 
                    type="number" 
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                    placeholder="AMOUNT"
                  />
                </div>
              </div>

              <button 
                onClick={handleSubmitFoam}
                className="w-full py-3 bg-accent text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent/80 transition-all"
              >
                {">_ Initiate Ingestion"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit/Add Gate Modal Overlay */}
      <AnimatePresence>
        {(editGateId !== null || showAddGate) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-bg-main border border-accent/30 p-6 w-full max-w-md space-y-6 shadow-[0_0_50px_rgba(var(--accent-rgb),0.2)]"
            >
              <div className="flex items-center justify-between border-b border-accent/20 pb-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold">
                  {editGateId ? "RECONFIGURE_GATE_PARAMETERS" : "INITIALIZE_NEW_GATE"}
                </div>
                <button onClick={() => { setEditGateId(null); setShowAddGate(false); }} className="text-text-dim hover:text-accent transition-colors">
                  <Plus size={16} className="rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest text-text-dim">Gate Name</label>
                  <input 
                    type="text" 
                    value={gateForm.name}
                    onChange={(e) => setGateForm({ ...gateForm, name: e.target.value.toUpperCase() })}
                    className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                    placeholder="NAME"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] uppercase tracking-widest text-text-dim">Unique Code</label>
                    <span className="text-[7px] text-red-500 uppercase font-bold">do not edit this!</span>
                  </div>
                  <input 
                    type="text" 
                    value={gateForm.code}
                    onChange={(e) => setGateForm({ ...gateForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                    placeholder="CODE"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest text-text-dim">Gate Owner</label>
                  <select 
                    value={gateForm.owner_uid}
                    onChange={(e) => {
                      const u = allUsers.find(u => u.uid === e.target.value);
                      if (u) {
                        setGateForm({ ...gateForm, owner_uid: u.uid, owner_username: u.username });
                      }
                    }}
                    className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                  >
                    <option value="" disabled>SELECT OWNER</option>
                    {allUsers.map(u => (
                      <option key={u.uid} value={u.uid}>{u.username}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest text-text-dim">Fuel Status</label>
                  <select 
                    value={gateForm.fuel_status}
                    onChange={(e) => setGateForm({ ...gateForm, fuel_status: e.target.value })}
                    className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                  >
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="STABILIZING">STABILIZING</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest text-text-dim">Fuel Value</label>
                  <input 
                    type="number" 
                    value={gateForm.fuel_value}
                    onChange={(e) => setGateForm({ ...gateForm, fuel_value: parseInt(e.target.value) || 0 })}
                    className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                    placeholder="VALUE"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest text-text-dim">Connected To</label>
                  <select 
                    value={gateForm.connected_to}
                    onChange={(e) => setGateForm({ ...gateForm, connected_to: e.target.value })}
                    className="w-full bg-bg-main border border-accent/20 p-2 text-[10px] uppercase tracking-widest text-text-main outline-none focus:border-accent transition-colors"
                  >
                    <option value="">NONE</option>
                    {gates
                      .filter(g => g.built && g.id !== editGateId)
                      .map(bg => (
                        <option key={bg.id} value={bg.name}>{bg.name}</option>
                      ))
                    }
                  </select>
                </div>
                <div className="space-y-1 flex items-center gap-2 pt-4">
                  <input 
                    type="checkbox" 
                    id="built-checkbox"
                    checked={gateForm.built}
                    onChange={(e) => setGateForm({ ...gateForm, built: e.target.checked })}
                    className="w-4 h-4 bg-bg-main border border-accent/20 rounded-sm outline-none accent-accent"
                  />
                  <label htmlFor="built-checkbox" className="text-[8px] uppercase tracking-widest text-text-dim cursor-pointer">Gate is Fully Built</label>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSaveGate}
                  className="flex-1 py-3 bg-accent text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent/80 transition-all"
                >
                  {editGateId ? ">_ Update Parameters" : ">_ Initialize Gate"}
                </button>
                
                {editGateId && isSuperAdmin && (
                  <button 
                    onClick={handleDeleteGate}
                    className="px-4 py-3 border border-red-500/50 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/10 transition-all"
                    title="Delete Gate"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto pt-8 border-t border-accent/10 flex justify-between items-center">
        <div className="text-[8px] uppercase tracking-widest text-text-dim">
          Array Status: {totalProgress >= 100 ? "Active" : "Standby"}
        </div>
        <div className="text-[8px] uppercase tracking-widest text-accent font-bold">
          Sync: {totalProgress.toFixed(2)}%
        </div>
      </div>
    </DebugLabel>
  );
};
