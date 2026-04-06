import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { GateData } from "./types";

export const useLogisticData = (isAdmin: boolean) => {
  const [gates, setGates] = useState<GateData[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const gateRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const fetchGates = async () => {
    try {
      const metaRes = await fetch("/api/gates");
      const metaData = await metaRes.json();

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

  return {
    gates,
    allUsers,
    isLoading,
    gateRefs,
    fetchGates
  };
};
