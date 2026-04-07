import { ChevronDown, RefreshCw, User } from "lucide-react";

interface MapSelectorProps {
  currentSnapshotId: string | null;
  isHelpOpen: boolean;
  snapshots: any[];
  fetchMap: (id: string) => void;
  setCurrentMapRef: (ref: string) => void;
  handleSetDefault: () => void;
  isSettingDefault: boolean;
  currentMapRef: string | null;
}

export const MapSelector = ({
  currentSnapshotId,
  isHelpOpen,
  snapshots,
  fetchMap,
  setCurrentMapRef,
  handleSetDefault,
  isSettingDefault,
  currentMapRef
}: MapSelectorProps) => {
  return (
    <div className="absolute top-4 right-6 z-20 flex items-start gap-3">
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-2">
          <div className="relative">
            <select 
              value={currentSnapshotId || ""}
              disabled={isHelpOpen}
              onChange={(e) => {
                const selectedId = e.target.value;
                const selectedSnapshot = snapshots.find(s => s.id === selectedId);
                fetchMap(selectedId);
                if (selectedSnapshot?.map_ref) {
                  setCurrentMapRef(selectedSnapshot.map_ref);
                }
              }}
              className="appearance-none bg-bg-main/80 backdrop-blur-md border border-accent/20 px-3 py-2 pr-8 text-[10px] uppercase tracking-widest outline-none focus:border-accent cursor-pointer text-text-main min-w-[200px] disabled:opacity-50"
            >
              <option value="" disabled>Select Map...</option>
              {snapshots.map(s => (
                <option key={s.id} value={s.id}>
                  {s.map_name || s.creator_username || "Untitled Map"}
                  {s.is_draft ? " (DRAFT)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim" />
          </div>
          <button 
            onClick={handleSetDefault}
            disabled={isSettingDefault || !currentMapRef || isHelpOpen}
            className="px-3 py-2 bg-bg-main/80 border border-accent/20 text-text-accent hover:bg-accent/10 text-[9px] uppercase tracking-widest disabled:opacity-50 transition-all flex items-center gap-2"
            title="Set as Default"
          >
            {isSettingDefault ? <RefreshCw size={12} className="animate-spin" /> : <User size={12} />}
            Set Default
          </button>
        </div>
        <label className="text-[8px] uppercase tracking-[0.2em] text-text-dim mt-0.5 mr-1 font-display font-medium">&gt;_active starmap</label>
      </div>
    </div>
  );
};
