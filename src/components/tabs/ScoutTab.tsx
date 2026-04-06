import { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import { Trash2, XCircle } from "lucide-react";
import { CornerAccents } from "./scout/ScoutUI";
import { BroadcastModule } from "./scout/BroadcastModule";
import { IsolateModule } from "./scout/IsolateModule";
import { VectorRepository } from "./scout/VectorRepository";
import { ReportedRifts } from "./scout/ReportedRifts";

export const ScoutTab = ({ isMobile = false, user, initialData }: { isMobile?: boolean; user?: any; initialData?: any }) => {
  // Vector Repository State
  const [scouts, setScouts] = useState<any[]>([]);
  const [rifts, setRifts] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [riftToDelete, setRiftToDelete] = useState<string | null>(null);

  const fetchScouts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/scouts');
      if (!res.ok) throw new Error("Failed to fetch scouts");
      const data = await res.json();
      setScouts(data);
      setIsLoaded(true);
    } catch (e) {
      console.error("Fetch scouts error:", e);
      setScouts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRifts = async () => {
    try {
      const res = await fetch('/api/rifts');
      if (!res.ok) throw new Error("Failed to fetch rifts");
      const data = await res.json();
      setRifts(data);
    } catch (e) {
      console.error("Fetch rifts error:", e);
      setRifts([]);
    }
  };

  const handleDeleteRift = async (id: string) => {
    try {
      const res = await fetch(`/api/rifts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Delete failed");
      setRiftToDelete(null);
      fetchRifts();
    } catch (e) {
      console.error(e);
      alert("DELETE FAILED");
    }
  };

  const handleRetrieveData = async () => {
    await Promise.all([fetchScouts(), fetchRifts()]);
  };

  useEffect(() => {
    const socket = io();
    socket.on("scout_update", () => {
      if (isLoaded) fetchScouts();
    });
    socket.on("rift_update", () => {
      fetchRifts();
    });
    return () => {
      socket.disconnect();
    };
  }, [isLoaded]);

  useEffect(() => {
    fetchRifts();
  }, []);

  if (isMobile) {
    return (
      <div className="flex flex-col p-4 space-y-8 pb-20">
        <BroadcastModule 
          isMobile={true} 
          onBroadcastSuccess={() => {
            if (isLoaded) fetchScouts();
          }} 
        />
        <IsolateModule 
          isMobile={true} 
          onIsolateSuccess={() => fetchRifts()} 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-0.5 space-y-1 h-full">
      <div className="flex w-full gap-2 shrink-0">
        <BroadcastModule 
          onBroadcastSuccess={() => {
            if (isLoaded) fetchScouts();
          }} 
        />
        <IsolateModule 
          onIsolateSuccess={() => fetchRifts()} 
        />
      </div>

      <div className="flex w-full gap-2 flex-grow min-h-0">
        <VectorRepository 
          scouts={scouts} 
          isLoaded={isLoaded} 
          isLoading={isLoading} 
          handleRetrieveData={handleRetrieveData} 
        />
        <ReportedRifts 
          rifts={rifts} 
          setRiftToDelete={setRiftToDelete} 
        />
      </div>

      {/* Confirmation Modal */}
      {riftToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-bg-main border border-accent/40 p-6 space-y-6 max-w-xs w-full relative">
            <CornerAccents color="var(--color-accent)" />
            <div className="text-center space-y-2">
              <h3 className="text-[12px] uppercase tracking-[0.2em] text-text-main font-bold">Confirm Deletion</h3>
              <p className="text-[10px] uppercase tracking-widest text-text-dim">Are you sure you want to close this aperture?</p>
            </div>
            <div className="flex justify-center gap-8">
              <button 
                onClick={() => handleDeleteRift(riftToDelete)}
                className="p-3 bg-red-600/20 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all rounded-full"
              >
                <Trash2 size={20} />
              </button>
              <button 
                onClick={() => setRiftToDelete(null)}
                className="p-3 bg-zinc-800/20 border border-zinc-700 text-zinc-500 hover:bg-zinc-700 hover:text-white transition-all rounded-full"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
