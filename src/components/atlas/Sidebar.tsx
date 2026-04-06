import { RefreshCw, Plus, ChevronDown, Save, Upload, Trash2 } from "lucide-react";
import { AutocompleteInput } from "../AutocompleteInput";
import { useTheme } from "../../context/ThemeContext";

interface SidebarProps {
  targetSystem: string;
  setTargetSystem: (val: string) => void;
  direction: string;
  setDirection: (val: string) => void;
  isExtrapolating: boolean;
  handleExtrapolate: () => void;
  mapTitle: string;
  setMapTitle: (val: string) => void;
  handleUpdateMap: () => void;
  handleSaveDraft: () => void;
  handleClearMap: () => void;
  isUpdating: boolean;
  isSavingDraft: boolean;
  systemsCount: number;
  connectionsCount: number;
  zoom: number;
  isHelpOpen: boolean;
  setIsHelpOpen: (val: boolean) => void;
}

export const Sidebar = ({
  targetSystem,
  setTargetSystem,
  direction,
  setDirection,
  isExtrapolating,
  handleExtrapolate,
  mapTitle,
  setMapTitle,
  handleUpdateMap,
  handleSaveDraft,
  handleClearMap,
  isUpdating,
  isSavingDraft,
  systemsCount,
  connectionsCount,
  zoom,
  isHelpOpen,
  setIsHelpOpen
}: SidebarProps) => {
  const { theme } = useTheme();

  const helpButtonColor = theme === 'cyberpunk' 
    ? 'text-[#FF6321] border-[#FF6321] hover:bg-[#FF6321]/10' 
    : 'text-[#00f3ff] border-[#00f3ff] hover:bg-[#00f3ff]/10';

  return (
    <div className="w-40 h-full border-r border-accent/20 bg-bg-main/50 backdrop-blur-md flex flex-col p-4 z-30 overflow-y-auto custom-scrollbar">
      <div className="space-y-6">
        <div className="space-y-4 relative">
          <div className="text-[9px] uppercase tracking-[0.2em] text-text-accent font-display font-bold italic break-words">Extrapolation Protocol</div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[8px] uppercase tracking-widest text-text-dim font-display font-medium">Target</label>
              <AutocompleteInput 
                placeholder="NAME"
                value={targetSystem}
                onChange={(val) => setTargetSystem(val.toUpperCase())}
                disabled={isHelpOpen}
                className="w-full bg-bg-main border border-accent/20 px-2 py-1.5 text-[10px] uppercase tracking-widest outline-none focus:border-accent disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[8px] uppercase tracking-widest text-text-dim font-display font-medium">Direction</label>
              <div className="relative">
                <select 
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  disabled={isHelpOpen}
                  className="w-full appearance-none bg-bg-main border border-accent/20 px-2 py-1.5 pr-6 text-[10px] uppercase tracking-widest outline-none focus:border-accent cursor-pointer disabled:opacity-50"
                >
                  <option value="C">CENTER</option>
                  <option value="N">NORTH</option>
                  <option value="NE">N-EAST</option>
                  <option value="E">EAST</option>
                  <option value="SE">S-EAST</option>
                  <option value="S">SOUTH</option>
                  <option value="SW">S-WEST</option>
                  <option value="W">WEST</option>
                  <option value="NW">N-WEST</option>
                </select>
                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim" />
              </div>
            </div>

            <button 
              onClick={handleExtrapolate}
              disabled={isExtrapolating || !targetSystem || isHelpOpen}
              className="w-full px-2 py-2.5 bg-accent text-black text-[9px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1 transition-all"
            >
              {isExtrapolating ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
              extrapolate
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-accent/10 space-y-4">
          <div className="space-y-1">
            <label className="text-[8px] uppercase tracking-widest text-text-dim font-display font-medium">Map Title</label>
            <input 
              type="text"
              value={mapTitle}
              onChange={(e) => setMapTitle(e.target.value)}
              disabled={isHelpOpen}
              placeholder="Map Title"
              className="w-full bg-bg-main border border-accent/20 px-2 py-1.5 text-[10px] uppercase tracking-widest outline-none focus:border-accent disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <button 
              onClick={handleUpdateMap}
              disabled={isUpdating || systemsCount === 0 || isHelpOpen}
              className="w-full px-2 py-2.5 bg-accent text-black text-[9px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1 transition-all"
            >
              {isUpdating ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
              update starmap
            </button>
            <button 
              onClick={handleSaveDraft}
              disabled={isSavingDraft || systemsCount === 0 || isHelpOpen}
              className="w-full px-2 py-2.5 border border-accent/40 text-text-accent text-[9px] font-bold uppercase tracking-widest hover:bg-accent/10 disabled:opacity-50 flex items-center justify-center gap-1 transition-all"
            >
              {isSavingDraft ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              save draft
            </button>
            <button 
              onClick={handleClearMap}
              disabled={systemsCount === 0 || isHelpOpen}
              className="w-full px-2 py-2.5 border border-red-500/40 text-red-500 text-[9px] font-bold uppercase tracking-widest hover:bg-red-500/10 disabled:opacity-50 flex items-center justify-center gap-1 transition-all"
            >
              <Trash2 size={12} />
              clear map
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-accent/10">
        <div className="mt-2 pt-4 border-t border-accent/5">
          <div className="flex items-center justify-between text-[8px] uppercase tracking-widest text-accent/40 font-mono">
            <span>[DRAFT_LOG]</span>
            {/* Help Button */}
            <button 
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className={`w-5 h-5 border backdrop-blur-md transition-all z-10 flex items-center justify-center font-mono text-[10px] font-bold ${isHelpOpen ? 'bg-white text-black border-white' : `bg-bg-main ${helpButtonColor}`}`}
              title="Protocol Manual"
            >
              ?
            </button>
          </div>
          <div className="text-[8px] uppercase tracking-widest text-accent/40 font-mono">
            <div className="mt-1 opacity-60">
              NODES: {systemsCount}<br/>
              LINKS: {connectionsCount}<br/>
              ZOOM: {(zoom * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
