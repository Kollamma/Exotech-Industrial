import { TrendingUp, Package, Clock, MapPin } from "lucide-react";
import { DebugLabel } from "../../../context/DebugContext";

interface LogisticStatsProps {
  stats: any;
}

export const LogisticStats = ({ stats }: LogisticStatsProps) => {
  return (
    <DebugLabel label="Logistics Stats" className="grid grid-cols-4 gap-4">
      <div className="bg-bg-main/40 border border-accent/20 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-text-dim">
          <Package size={14} />
          <span className="text-[9px] uppercase tracking-widest">Total Volume</span>
        </div>
        <div className="text-xl font-black text-text-main font-mono">
          {stats.total_volume?.toLocaleString() || 0} <span className="text-[10px] text-text-dim">UNITS</span>
        </div>
      </div>
      <div className="bg-bg-main/40 border border-accent/20 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-text-dim">
          <TrendingUp size={14} />
          <span className="text-[9px] uppercase tracking-widest">Active Hubs</span>
        </div>
        <div className="text-xl font-black text-text-main font-mono">
          {stats.active_hubs || 0}
        </div>
      </div>
      <div className="bg-bg-main/40 border border-accent/20 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-text-dim">
          <Clock size={14} />
          <span className="text-[9px] uppercase tracking-widest">Last 24h</span>
        </div>
        <div className="text-xl font-black text-text-main font-mono">
          {stats.last_24h_volume?.toLocaleString() || 0} <span className="text-[10px] text-text-dim">UNITS</span>
        </div>
      </div>
      <div className="bg-bg-main/40 border border-accent/20 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-text-dim">
          <MapPin size={14} />
          <span className="text-[9px] uppercase tracking-widest">Top System</span>
        </div>
        <div className="text-xl font-black text-text-main font-mono truncate">
          {stats.top_system || "N/A"}
        </div>
      </div>
    </DebugLabel>
  );
};
