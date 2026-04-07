import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { ManifestForm } from "./manifest/ManifestForm";
import { TransactionHistory } from "./manifest/TransactionHistory";
import { StockLedger } from "./manifest/StockLedger";

export const ManifestTab = ({ user, initialData, isMobile }: { user: any; initialData?: any; isMobile?: boolean }) => {
  const [manifestLogs, setManifestLogs] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [gates, setGates] = useState<any[]>([]);

  const isAdmin = user && user.rank >= 1;

  const fetchManifest = async () => {
    try {
      const res = await fetch("/api/manifest", { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setManifestLogs(data);
      } else {
        console.error("Manifest data is not an array:", data);
        setManifestLogs([]);
      }
    } catch (e) {
      console.error("Fetch manifest error:", e);
      setManifestLogs([]);
    }
  };

  const fetchStock = async () => {
    try {
      const res = await fetch("/api/manifest/stock", { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setStockData(data);
      } else {
        console.error("Stock data is not an array:", data);
        setStockData([]);
      }
    } catch (e) {
      console.error("Fetch stock error:", e);
      setStockData([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllUsers(data);
      } else {
        console.error("Users data is not an array:", data);
        setAllUsers([]);
      }
    } catch (e) {
      console.error("Fetch users error:", e);
      setAllUsers([]);
    }
  };

  const fetchGates = async () => {
    try {
      const res = await fetch("/api/gates", { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setGates(data);
      } else {
        setGates([]);
      }
    } catch (e) {
      console.error("Fetch gates error:", e);
      setGates([]);
    }
  };

  useEffect(() => {
    fetchManifest();
    fetchStock();
    fetchUsers();
    fetchGates();

    const socket = io();
    socket.on("manifest_update", () => {
      fetchManifest();
    });
    socket.on("stock_update", () => {
      fetchStock();
    });

    return () => {
      socket.disconnect();
    };
  }, [isAdmin]);

  const handleVerify = async (id: string) => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`/api/manifest/verify/${id}`, { 
        method: "POST",
        credentials: 'include'
      });
      if (!res.ok) throw new Error("Verification failed");
    } catch (e) {
      console.error(e);
      alert("VERIFICATION FAILED");
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-full p-4 space-y-6 pb-20">
        <ManifestForm 
          user={user} 
          isAdmin={isAdmin} 
          allUsers={allUsers} 
          gates={gates} 
          isMobile={true} 
        />
        <TransactionHistory 
          manifestLogs={manifestLogs} 
          isAdmin={isAdmin} 
          handleVerify={handleVerify} 
          isMobile={true} 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-1 p-0.5">
      {/* Top Grid */}
      <div className="flex flex-grow gap-1 min-h-0">
        {/* Left Column (30% width) */}
        <div className="w-[30%] flex flex-col gap-1 min-w-0">
          <ManifestForm 
            user={user} 
            isAdmin={isAdmin} 
            allUsers={allUsers} 
            gates={gates} 
          />
        </div>

        {/* Right Column (70% width) */}
        <div className="w-[70%] flex flex-col gap-1 min-w-0">
          <TransactionHistory 
            manifestLogs={manifestLogs} 
            isAdmin={isAdmin} 
            handleVerify={handleVerify} 
          />
        </div>
      </div>

      {/* Bottom Section */}
      <StockLedger stockData={stockData} />
    </div>
  );
};
