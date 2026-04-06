import { Server } from "socket.io";
import { supabaseAdmin } from "./db";

export function setupSockets(io: Server) {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Setup Supabase Realtime listeners
  const channel = supabaseAdmin.channel("db-changes");

  channel
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "manifest_ledger" },
      (payload) => {
        console.log("Supabase Realtime Update (manifest_ledger):", payload);
        io.emit("manifest_update", payload);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "resource_stock" },
      (payload) => {
        console.log("Supabase Realtime Update (resource_stock):", payload);
        io.emit("stock_update", payload);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "operations" },
      (payload) => {
        console.log("Supabase Realtime Update (operations):", payload);
        io.emit("operation_update", payload);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "scouts" },
      (payload) => {
        console.log("Supabase Realtime Update (scouts):", payload);
        io.emit("scout_update", payload);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rifts" },
      (payload) => {
        console.log("Supabase Realtime Update (rifts):", payload);
        io.emit("rift_update", payload);
      }
    )
    .subscribe((status) => {
      console.log("Supabase Realtime Subscription Status:", status);
    });
}
