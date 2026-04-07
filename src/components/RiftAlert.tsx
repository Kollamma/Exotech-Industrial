import { useState, useEffect } from "react";
import { io } from "socket.io-client";

interface Rift {
  id: string;
  system_id: string;
  type: string;
  created_at: string;
  username?: string;
  user?: {
    username: string;
  };
}

export const RiftAlert = () => {
  const [latestRift, setLatestRift] = useState<Rift | null>(null);

  const getTier = (type: string) => {
    if (type.includes("F9BF") || type.includes("0769")) return 3;
    if (type.includes("0633") || type.includes("F8DA")) return 2;
    if (type.includes("05D8") || type.includes("F935")) return 1;
    return 0;
  };

  const fetchLatestRift = async () => {
    try {
      const res = await fetch('/api/rifts', { credentials: 'include' });
      const data = await res.json();
      if (data && data.length > 0) {
        const now = new Date().getTime();
        
        const recentRifts = data.filter((rift: any) => {
          const created = new Date(rift.created_at).getTime();
          const diffInHours = (now - created) / (1000 * 60 * 60);
          return diffInHours < 5;
        });

        if (recentRifts.length > 0) {
          const sortedRifts = recentRifts.sort((a: any, b: any) => {
            const tierA = getTier(a.type);
            const tierB = getTier(b.type);
            if (tierA !== tierB) return tierB - tierA;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          setLatestRift(sortedRifts[0]);
        } else {
          setLatestRift(null);
        }
      } else {
        setLatestRift(null);
      }
    } catch (e) {
      console.error("Fetch latest rift error:", e);
    }
  };

  useEffect(() => {
    fetchLatestRift();
    const socket = io();
    socket.on("rift_update", () => {
      fetchLatestRift();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getAlertStyles = (type: string) => {
    if (type.includes("05D8") || type.includes("F935")) {
      return {
        container: "border-accent bg-accent/10 text-text-main",
        accent: "border-accent",
        hashes: false
      };
    }
    if (type.includes("0633") || type.includes("F8DA")) {
      return {
        container: "border-blue-600 bg-blue-950/40 text-blue-400",
        accent: "border-blue-500",
        hashes: false
      };
    }
    if (type.includes("F9BF") || type.includes("0769")) {
      return {
        container: "border-purple-600 bg-purple-950/40 text-purple-400",
        accent: "border-purple-500",
        hashes: true
      };
    }
    return {
      container: "border-red-600 bg-red-950/40 text-text-main",
      accent: "border-accent",
      hashes: false
    };
  };

  if (!latestRift) return null;

  const alertStyles = getAlertStyles(latestRift.type);
  const hoursAgo = Math.floor((new Date().getTime() - new Date(latestRift.created_at).getTime()) / (1000 * 60 * 60));

  return (
    <div className="flex items-center justify-center h-full">
      <div className={`relative px-6 py-1 border ${alertStyles.container} flex items-center justify-center animate-pulse overflow-hidden min-w-[280px]`}>
        {alertStyles.hashes && (
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 5px)' }}></div>
        )}
        <div className={`absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 ${alertStyles.accent}`}></div>
        <div className={`absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 ${alertStyles.accent}`}></div>
        <div className={`absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 ${alertStyles.accent}`}></div>
        <div className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 ${alertStyles.accent}`}></div>
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] relative z-10 whitespace-nowrap">
          Rift Type {latestRift.type} found in {latestRift.system_id} by {latestRift.username || latestRift.user?.username || "Unknown"}, {hoursAgo} hours ago!
        </span>
      </div>
    </div>
  );
};
