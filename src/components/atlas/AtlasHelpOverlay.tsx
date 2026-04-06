import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronDown, Save, Trash2, Map as MapIcon, Move, MousePointer2, RotateCw, Link as LinkIcon } from "lucide-react";

export const AtlasHelpOverlay = ({
  isHelpOpen,
  setIsHelpOpen,
  dimensions
}: {
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  dimensions: { width: number; height: number };
}) => {
  return (
    <AnimatePresence>
      {isHelpOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-[2px] pointer-events-auto overflow-hidden"
          onClick={() => setIsHelpOpen(false)}
        >
          {/* Close instruction */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-text-dim text-[10px] uppercase tracking-[0.3em] animate-pulse">
            Click anywhere to exit manual
          </div>

          {/* SVG Arrows Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-accent" />
              </marker>
            </defs>
            
            {/* Sidebar Top -> Extrapolation */}
            <motion.path 
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}
              d={`M 280 100 L 170 80`} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" markerEnd="url(#arrowhead)" className="text-accent/40"
            />

            {/* Sidebar Middle -> Map Management */}
            <motion.path 
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
              d={`M 280 300 L 170 320`} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" markerEnd="url(#arrowhead)" className="text-accent/40"
            />

            {/* Sidebar -> Clear Map */}
            <motion.path 
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.35 }}
              d={`M 280 380 L 170 370`} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" markerEnd="url(#arrowhead)" className="text-accent/40"
            />

            {/* Sidebar -> Cluster Vector */}
            <motion.path 
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
              d={`M 280 170 L 170 160`} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" markerEnd="url(#arrowhead)" className="text-accent/40"
            />

            {/* Top Right -> Map Selection */}
            <motion.path 
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.4 }}
              d={`M ${dimensions.width - 400} 120 L ${dimensions.width - 250} 60`} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" markerEnd="url(#arrowhead)" className="text-accent/40"
            />
          </svg>

          {/* Help Labels */}
          
          {/* Extrapolation */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="absolute top-[60px] left-[290px] max-w-[240px] space-y-2"
          >
            <div className="flex items-center gap-2 text-accent">
              <Search size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Extrapolation Protocol</span>
            </div>
            <p className="text-[11px] text-text-dim leading-relaxed">
              Submit a single system name. The AI will automatically map all connected systems in that cluster.
            </p>
          </motion.div>

          {/* Cluster Vector */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="absolute top-[145px] left-[290px] max-w-[240px] space-y-2"
          >
            <div className="flex items-center gap-2 text-accent">
              <ChevronDown size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Cluster Vector</span>
            </div>
            <p className="text-[11px] text-text-dim leading-relaxed">
              Choose the relative direction (North, South, etc.) where the new cluster will be placed upon extrapolation.
            </p>
          </motion.div>

          {/* Map Management */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="absolute top-[280px] left-[290px] max-w-[240px] space-y-2"
          >
            <div className="flex items-center gap-2 text-accent">
              <Save size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Map Management</span>
            </div>
            <p className="text-[11px] text-text-dim leading-relaxed">
              Name your map, save private <span className="text-text-main">Drafts</span>, or <span className="text-text-main">Update</span> the live public starmap.
            </p>
          </motion.div>

          {/* Clear Map */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="absolute top-[365px] left-[290px] max-w-[240px] space-y-2"
          >
            <div className="flex items-center gap-2 text-red-500">
              <Trash2 size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Clear Map</span>
            </div>
            <p className="text-[11px] text-text-dim leading-relaxed">
              Wipe the current map clean to start from a blank slate. <span className="text-red-400 italic">Warning: Unsaved changes will be lost.</span>
            </p>
          </motion.div>

          {/* Map Selection */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}
            className="absolute top-[100px] right-[350px] max-w-[240px] space-y-2 text-right"
          >
            <div className="flex items-center gap-2 text-accent justify-end">
              <span className="text-[10px] font-bold uppercase tracking-widest">Active Starmap</span>
              <MapIcon size={14} />
            </div>
            <p className="text-[11px] text-text-dim leading-relaxed">
              Switch between your drafts, live maps, or community starmaps. Set your preferred default.
            </p>
          </motion.div>

          {/* Central Controls */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
            className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-full max-w-4xl grid grid-cols-4 gap-6 px-12"
          >
            <div className="bg-bg-main/80 backdrop-blur-md border border-accent/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <Move size={14} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Navigation</span>
              </div>
              <p className="text-[10px] text-text-dim leading-tight">
                <span className="text-text-main">Drag</span> background to pan.<br/>
                <span className="text-text-main">Scroll</span> to zoom in/out.
              </p>
            </div>

            <div className="bg-bg-main/80 backdrop-blur-md border border-accent/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <MousePointer2 size={14} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Movement</span>
              </div>
              <p className="text-[10px] text-text-dim leading-tight">
                <span className="text-text-main">Click</span> to move system.<br/>
                <span className="text-text-main">Right-Click</span> to move cluster.
              </p>
            </div>

            <div className="bg-bg-main/80 backdrop-blur-md border border-accent/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <RotateCw size={14} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Rotation</span>
              </div>
              <p className="text-[10px] text-text-dim leading-tight">
                <span className="text-text-main">Ctrl + Click</span> to rotate a cluster 30° around a point.
              </p>
            </div>

            <div className="bg-bg-main/80 backdrop-blur-md border border-accent/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <LinkIcon size={14} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Jump Gates</span>
              </div>
              <p className="text-[10px] text-text-dim leading-tight">
                Click one system, then another to create a <span className="text-yellow-400">Manual Link</span>.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
