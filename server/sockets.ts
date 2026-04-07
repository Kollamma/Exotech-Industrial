import { Server } from "socket.io";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const realtimeClient = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    realtime: {
      timeout: 30000,
    },
  }
);

const logBuffer: string[] = [];
function logToBuffer(msg: string, isError = false) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${isError ? "ERROR: " : "INFO: "} ${msg}`;
  logBuffer.push(entry);
  if (logBuffer.length > 100) logBuffer.shift();
  if (isError) console.error(entry);
  else console.log(entry);
}

export function setupSockets(io: Server) {
  io.on("connection", (socket) => {
    logToBuffer(`Client connected: ${socket.id}`);
    socket.on("disconnect", () => {
      logToBuffer(`Client disconnected: ${socket.id}`);
    });
  });

  // Setup Supabase Realtime listeners with retry logic
  function subscribeWithRetry(attempt = 1) {
    logToBuffer(`Attempting Supabase Realtime subscription (Attempt ${attempt})...`);
    
    const channel = realtimeClient.channel("db-changes-v3");

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "manifest_ledger" },
        (payload) => {
          logToBuffer(`Supabase Realtime Update (manifest_ledger): ${JSON.stringify(payload)}`);
          io.emit("manifest_update", payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resource_stock" },
        (payload) => {
          logToBuffer(`Supabase Realtime Update (resource_stock): ${JSON.stringify(payload)}`);
          io.emit("stock_update", payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operations" },
        (payload) => {
          logToBuffer(`Supabase Realtime Update (operations): ${JSON.stringify(payload)}`);
          io.emit("operation_update", payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scouts" },
        (payload) => {
          logToBuffer(`Supabase Realtime Update (scouts): ${JSON.stringify(payload)}`);
          io.emit("scout_update", payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rifts" },
        (payload) => {
          logToBuffer(`Supabase Realtime Update (rifts): ${JSON.stringify(payload)}`);
          io.emit("rift_update", payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        (payload) => {
          logToBuffer(`Supabase Realtime Update (users): ${JSON.stringify(payload)}`);
          io.emit("user_update", payload);
        }
      )
      .subscribe((status, err) => {
        logToBuffer(`Supabase Realtime Subscription Status (Attempt ${attempt}): ${status}`);
        if (err) {
          const error = err as any;
          logToBuffer(`Supabase Realtime Subscription Error (Attempt ${attempt}): ${error.message || error}`, true);
          if (error.hint) logToBuffer(`Hint: ${error.hint}`, true);
          if (error.details) logToBuffer(`Details: ${error.details}`, true);
        }

        if (status === "CHANNEL_ERROR") {
          logToBuffer(`CHANNEL_ERROR on attempt ${attempt}. Retrying in 5 seconds...`, true);
          setTimeout(() => subscribeWithRetry(attempt + 1), 5000);
        } else if (status === "SUBSCRIBED") {
          logToBuffer("Successfully subscribed to Supabase Realtime!");
        }
      });
  }

  subscribeWithRetry();
}

export function getLogs() {
  return logBuffer;
}
