import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import axios from "axios";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const COOKIE_SECRET = process.env.COOKIE_SECRET || "exotech_industrial_secret_v1";

if (!process.env.COOKIE_SECRET) {
  console.log("WARNING: COOKIE_SECRET is missing from environment variables! Using a default fallback for development.");
}

// Initialize Supabase Admin Client
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables!");
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

if (!process.env.APP_URL) {
  console.warn("WARNING: APP_URL is missing from environment variables! OAuth redirect URIs may be incorrect.");
}

console.log("Supabase Admin Client initialized. URL:", process.env.SUPABASE_URL ? "SET" : "MISSING");
console.log("COOKIE_SECRET status:", process.env.COOKIE_SECRET ? "SET" : "MISSING (using default)");

function parseDiscordUsername(rawUsername: string): string {
  // Example: "MyName {EXTI} (UTC +5)" -> "MyName"
  return rawUsername
    .replace(/\{EXTI\}/g, "")
    .replace(/\(UTC\s*[+-]?\d+\)/g, "")
    .trim();
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser(COOKIE_SECRET));

  // Middleware to verify session
  const verifySession = (req: any, res: any, next: any) => {
    const uid = req.signedCookies.user_uid;
    if (!uid) {
      console.log("--- Session Verification Failed ---");
      console.log("Raw Cookie Header:", req.headers.cookie);
      console.log("Signed Cookies:", req.signedCookies);
      console.log("Unsigned Cookies:", req.cookies);
      
      if (req.cookies.user_uid) {
        console.log("Found unsigned user_uid cookie. This suggests a signature mismatch or that the cookie was set without a signature.");
      } else {
        console.log("No user_uid cookie found in req.cookies either.");
      }
      return res.status(401).json({ error: "Not logged in" });
    }
    req.uid = uid;
    next();
  };

  // Supabase Realtime listener
  supabaseAdmin
    .channel("any")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "users" },
      (payload) => {
        console.log("Supabase Realtime Update (users):", payload);
        io.emit("user_update", payload);
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
    .subscribe();

  // API Route to update user profile
  app.post("/api/user/update", verifySession, async (req: any, res) => {
    const uid = req.uid;
    console.log(`Update request for UID: ${uid}`, req.body);
    
    // Filter allowed fields to prevent rank escalation
    const allowedFields = ["ship_type", "industry_class", "home_system", "availability_mask", "timezone"];
    const updateData: any = {};
    let hasFields = false;
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
        hasFields = true;
      }
    }

    if (!hasFields) {
      console.log("No allowed fields provided for update");
      return res.json({ success: true, message: "No changes applied" });
    }

    console.log("Filtered update data:", updateData);

    try {
      const { data, error } = await supabaseAdmin
        .from("users")
        .update(updateData)
        .eq("uid", uid);

      if (error) {
        console.error("Supabase Update Error:", error);
        throw error;
      }
      console.log("Update successful");
      res.json({ success: true });
    } catch (error: any) {
      console.error("Supabase Update Exception:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes for intel_tabs
  app.get("/api/intel-tabs", async (req, res) => {
    const uid = req.signedCookies.user_uid;
    try {
      // Check rank for visibility filtering
      let rank = 0;
      if (uid) {
        const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
        if (user) rank = user.rank;
      }

      let query = supabaseAdmin.from("intel_tabs").select("*").order("position");
      
      // If not superadmin (rank 2), only show visible tabs
      if (rank < 2) {
        query = query.eq("visible", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/intel-tabs", verifySession, async (req: any, res) => {
    const uid = req.uid;

    try {
      // Check admin
      const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
      if (!user || user.rank < 1) return res.status(403).json({ error: "Unauthorized" });

      const { data, error } = await supabaseAdmin
        .from("intel_tabs")
        .insert({ ...req.body, created_by: uid, updated_by: uid });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/intel-tabs/:id", verifySession, async (req: any, res) => {
    const uid = req.uid;

    try {
      // Check admin
      const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
      if (!user || user.rank < 1) return res.status(403).json({ error: "Unauthorized" });

      const { data, error } = await supabaseAdmin
        .from("intel_tabs")
        .update({ ...req.body, updated_by: uid, updated_at: new Date() })
        .eq("id", req.params.id);
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/intel-tabs/:id", verifySession, async (req: any, res) => {
    const uid = req.uid;

    try {
      // Only superadmin (rank 2) can delete
      const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
      if (!user || user.rank < 2) return res.status(403).json({ error: "Unauthorized" });

      const { error } = await supabaseAdmin
        .from("intel_tabs")
        .delete()
        .eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes for tribe_tabs
  app.get("/api/tribe-tabs", async (req, res) => {
    const uid = req.signedCookies.user_uid;
    try {
      // Check rank for visibility filtering
      let rank = 0;
      if (uid) {
        const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
        if (user) rank = user.rank;
      }

      let query = supabaseAdmin.from("tribe_tabs").select("*").order("position");
      
      // If not superadmin (rank 2), only show visible tabs
      if (rank < 2) {
        query = query.eq("visible", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tribe-tabs", verifySession, async (req: any, res) => {
    const uid = req.uid;

    try {
      // Check admin
      const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
      if (!user || user.rank < 1) return res.status(403).json({ error: "Unauthorized" });

      const { data, error } = await supabaseAdmin
        .from("tribe_tabs")
        .insert({ ...req.body, created_by: uid, updated_by: uid });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/tribe-tabs/:id", verifySession, async (req: any, res) => {
    const uid = req.uid;

    try {
      // Check admin
      const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
      if (!user || user.rank < 1) return res.status(403).json({ error: "Unauthorized" });

      const { data, error } = await supabaseAdmin
        .from("tribe_tabs")
        .update({ ...req.body, updated_by: uid, updated_at: new Date() })
        .eq("id", req.params.id);
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/tribe-tabs/:id", verifySession, async (req: any, res) => {
    const uid = req.uid;

    try {
      // Only superadmin (rank 2) can delete
      const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
      if (!user || user.rank < 2) return res.status(403).json({ error: "Unauthorized" });

      const { error } = await supabaseAdmin
        .from("tribe_tabs")
        .delete()
        .eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes for scouts
  app.get("/api/scouts", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("scouts")
        .select(`
          *,
          last_scouted_by_user:users!scouts_last_scouted_by_fkey(username)
        `)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/scouts/:systemId", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("scouts")
        .select("*")
        .eq("system_id", req.params.systemId.toUpperCase())
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      res.json(data || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/scouts/broadcast", verifySession, async (req: any, res) => {
    const uid = req.uid;

    const { system_id, site_contents, system_strength } = req.body;
    if (!system_id) return res.status(400).json({ error: "System ID required" });

    try {
      // Fetch username for the log
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("username")
        .eq("uid", uid)
        .single();

      // Check if it exists to set created_by
      const { data: existing } = await supabaseAdmin
        .from("scouts")
        .select("created_by")
        .eq("system_id", system_id.toUpperCase())
        .single();

      const upsertData: any = {
        system_id: system_id.toUpperCase(),
        site_contents,
        system_strength: system_strength?.toString() || "0",
        last_scouted_by: uid,
        username: userData?.username || "Unknown",
        updated_at: new Date()
      };

      if (!existing) {
        upsertData.created_by = uid;
      }

      const { data, error } = await supabaseAdmin
        .from("scouts")
        .upsert(upsertData, { onConflict: "system_id" });

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Scout Broadcast Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/rifts/log", verifySession, async (req: any, res) => {
    const uid = req.uid;

    const { system_id, type } = req.body;
    if (!system_id || !type) return res.status(400).json({ error: "System ID and Type required" });

    try {
      // Fetch username for the log
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("username")
        .eq("uid", uid)
        .single();

      const { data, error } = await supabaseAdmin
        .from("rifts")
        .insert({
          uid,
          username: userData?.username || "Unknown",
          system_id: system_id.toUpperCase(),
          type,
          visible: true,
          created_at: new Date()
        });

      if (error) throw error;
      
      io.emit("rift_update", { type: "INSERT", data });
      
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Rift Log Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rifts", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("rifts")
        .select(`
          *,
          user:users!rifts_uid_fkey(username)
        `)
        .eq("visible", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/rifts/:id", verifySession, async (req: any, res) => {
    const uid = req.uid;

    const { id } = req.params;

    try {
      const { error } = await supabaseAdmin
        .from("rifts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      io.emit("rift_update", { type: "DELETE", id });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Rift Delete Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes for manifest
  app.get("/api/manifest", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("manifest_ledger")
        .select(`
          *,
          donor:users!manifest_ledger_donor_uid_fkey(username)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Flatten the username for the frontend
      const flattenedData = data.map(log => ({
        ...log,
        username: (log.donor as any)?.username || "Unknown"
      }));
      
      res.json(flattenedData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/manifest/stock", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("resource_stock")
        .select("*")
        .order("resource");
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/manifest/contribute", verifySession, async (req: any, res) => {
    const uid = req.uid;

    const { donor_uid, item, amount, target_id, notes } = req.body;
    if (!item || !amount) return res.status(400).json({ error: "Missing fields" });

    try {
      // Check if requestor is admin if they are submitting for someone else
      if (donor_uid && donor_uid !== uid) {
        const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
        if (!user || user.rank < 1) return res.status(403).json({ error: "Unauthorized" });
      }

      const { data, error } = await supabaseAdmin
        .from("manifest_ledger")
        .insert({
          logger_uid: uid,
          donor_uid: donor_uid || uid,
          type: target_id ? "gate" : "manifest",
          resource: item,
          target_id: target_id || null,
          amount: parseInt(amount),
          ledger_impact: parseInt(amount),
          verified: false,
          notes: notes || ""
        })
        .select()
        .single();

      if (error) throw error;
      
      io.emit("manifest_update", { type: "INSERT", data });
      
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Manifest Contribution Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/manifest/verify/:id", verifySession, async (req: any, res) => {
    const uid = req.uid;

    try {
      // Check admin
      const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
      if (!user || user.rank < 1) return res.status(403).json({ error: "Unauthorized" });

      const { data, error } = await supabaseAdmin
        .from("manifest_ledger")
        .update({ verified: true })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw error;

      io.emit("manifest_update", { type: "VERIFY", id: req.params.id });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Manifest Verification Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes for gates
  app.get("/api/gates", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("gates")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gates", verifySession, async (req: any, res) => {
    const uid = req.uid;
    const { name, code, owner_username, owner_uid, fuel_status, fuel_value, connected_to, built } = req.body;
    
    try {
      // Check admin
      const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
      if (!user || user.rank < 1) return res.status(403).json({ error: "Unauthorized" });

      const { data, error } = await supabaseAdmin
        .from("gates")
        .insert({
          name,
          code,
          owner_username,
          owner_uid: owner_uid || uid,
          fuel_status: fuel_status || "OFFLINE",
          fuel_value: fuel_value || 0,
          connected_to: connected_to || "",
          built: built || false
        })
        .select()
        .single();

      if (error) throw error;
      
      io.emit("gate_update", { type: "INSERT", data });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/gates/:id", verifySession, async (req: any, res) => {
    const uid = req.uid;
    const { id } = req.params;

    try {
      // Check admin or owner
      const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
      const { data: gate } = await supabaseAdmin.from("gates").select("owner_uid").eq("id", id).single();
      
      const isAdmin = user && user.rank >= 1;
      const isOwner = gate && gate.owner_uid === uid;

      if (!isAdmin && !isOwner) return res.status(403).json({ error: "Unauthorized" });

      const { data, error } = await supabaseAdmin
        .from("gates")
        .update({ ...req.body, updated_at: new Date() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      io.emit("gate_update", { type: "UPDATE", data });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/gates/:id", verifySession, async (req: any, res) => {
    const uid = req.uid;
    const { id } = req.params;

    try {
      // Only admin can delete
      const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
      if (!user || user.rank < 1) return res.status(403).json({ error: "Unauthorized" });

      const { error } = await supabaseAdmin
        .from("gates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      io.emit("gate_update", { type: "DELETE", id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes for logistic (gates)
  app.get("/api/logistic/gates", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("manifest_ledger")
        .select(`
          target_id,
          ledger_impact,
          donor:users!manifest_ledger_donor_uid_fkey(username)
        `)
        .eq("type", "gate")
        .eq("resource", "Building Foam");
      
      if (error) throw error;
      
      // Group by target_id (gate name)
      const gatesMap: { [key: string]: any } = {};
      data.forEach(log => {
        const gateName = log.target_id || "UNKNOWN_GATE";
        if (!gatesMap[gateName]) {
          gatesMap[gateName] = { name: gateName, foam: 0, contributors: {} };
        }
        gatesMap[gateName].foam += Number(log.ledger_impact);
        
        const username = (log.donor as any)?.username || "Unknown";
        if (!gatesMap[gateName].contributors[username]) {
          gatesMap[gateName].contributors[username] = 0;
        }
        gatesMap[gateName].contributors[username] += Number(log.ledger_impact);
      });
      
      const gates = Object.values(gatesMap).map((g: any) => ({
        ...g,
        contributors: Object.entries(g.contributors).map(([name, amount]) => ({ name, amount: Number(amount) }))
      }));
      
      res.json(gates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/logistic/input", verifySession, async (req: any, res) => {
    const uid = req.uid;
    const { gate_name, amount, donor_uid } = req.body;
    
    if (!gate_name || !amount) return res.status(400).json({ error: "Missing fields" });

    try {
      const { data, error } = await supabaseAdmin
        .from("manifest_ledger")
        .insert({
          logger_uid: uid,
          donor_uid: donor_uid || uid,
          type: "gate",
          resource: "Building Foam",
          target_id: gate_name,
          amount: parseInt(amount),
          ledger_impact: parseInt(amount),
          verified: true, // Foam input is auto-verified for now
          notes: `Foam input for ${gate_name}`
        })
        .select()
        .single();

      if (error) throw error;
      
      io.emit("manifest_update", { type: "INSERT", data });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes for operations
  app.get("/api/operations", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("manifest_ledger")
        .select(`
          *,
          donor:users!manifest_ledger_donor_uid_fkey(username)
        `)
        .eq("type", "operation")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const flattenedData = data.map(log => ({
        ...log,
        username: (log.donor as any)?.username || "Unknown"
      }));
      
      res.json(flattenedData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/operations/log", verifySession, async (req: any, res) => {
    const uid = req.uid;
    const { operation_name, notes } = req.body;
    
    if (!operation_name) return res.status(400).json({ error: "Missing fields" });

    try {
      const { data, error } = await supabaseAdmin
        .from("manifest_ledger")
        .insert({
          logger_uid: uid,
          donor_uid: uid,
          type: "operation",
          resource: operation_name,
          amount: 1,
          ledger_impact: 0, // Operations don't impact resource stock
          verified: true,
          notes: notes || ""
        })
        .select()
        .single();

      if (error) throw error;
      
      io.emit("manifest_update", { type: "INSERT", data });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route to get all users (for admin dropdown)
  app.get("/api/users", verifySession, async (req: any, res) => {
    const uid = req.uid;

    try {
      const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
      if (!user || user.rank < 1) return res.status(403).json({ error: "Unauthorized" });

      const { data, error } = await supabaseAdmin
        .from("users")
        .select("uid, username, rank")
        .order("username");
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/rank", verifySession, async (req: any, res) => {
    const uid = req.uid;

    const { target_uid, rank } = req.body;
    if (!target_uid || rank === undefined) return res.status(400).json({ error: "Missing fields" });

    try {
      // Check if requestor is Superadmin (Rank 2+)
      const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
      if (!user || user.rank < 2) return res.status(403).json({ error: "Unauthorized. Superadmin clearance required." });

      const { data, error } = await supabaseAdmin
        .from("users")
        .update({ rank: parseInt(rank) })
        .eq("uid", target_uid)
        .select()
        .single();

      if (error) throw error;
      
      io.emit("user_update", { type: "UPDATE", new: data });
      
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("User Rank Update Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for system search (autocomplete)
  app.get("/api/systems/search", async (req, res) => {
    const query = (req.query.q as string || "").toUpperCase();
    if (query.length < 3) {
      return res.json([]);
    }

    try {
      const systemsPath = path.join(process.cwd(), "systems.json");
      if (!fs.existsSync(systemsPath)) {
        return res.json([]);
      }
      const systemsData = fs.readFileSync(systemsPath, "utf-8");
      const systems: string[] = JSON.parse(systemsData);
      
      const matches = systems
        .filter(s => s.toUpperCase().startsWith(query))
        .slice(0, 10);
      
      res.json(matches);
    } catch (error) {
      console.error("System search error:", error);
      res.json([]);
    }
  });

  // API Route for Auth URL
  app.get("/api/auth/url", (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const baseUrl = process.env.APP_URL?.replace(/\/$/, "");
    
    if (!clientId) {
      console.error("DISCORD_CLIENT_ID is not set in environment variables");
      return res.status(500).json({ error: "Discord Client ID is not configured" });
    }

    if (!baseUrl) {
      console.error("APP_URL is not set in environment variables");
      return res.status(500).json({ error: "Application URL is not configured" });
    }

    const redirectUri = `${baseUrl}/auth/callback`;
    console.log("Generating Discord Auth URL with redirect_uri:", redirectUri);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "identify email guilds guilds.members.read",
    });

    const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // Auth Callback
  app.get("/auth/callback", async (req, res) => {
    const { code } = req.query;
    console.log("Auth callback received with code:", code ? "PRESENT" : "MISSING");
    if (!code) return res.status(400).send("No code provided");

    const guildId = process.env.DISCORD_GUILD_ID;
    const roleId = process.env.DISCORD_ROLE_ID;

    if (!guildId || !roleId) {
      return res.status(500).send("DISCORD_GUILD_ID or DISCORD_ROLE_ID not configured");
    }

    try {
      const baseUrl = process.env.APP_URL?.replace(/\/$/, "");
      const redirectUri = `${baseUrl}/auth/callback`;
      console.log("Exchanging code for token with redirect_uri:", redirectUri);

      const tokenResponse = await axios.post(
        "https://discord.com/api/oauth2/token",
        new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID!,
          client_secret: process.env.DISCORD_CLIENT_SECRET!,
          grant_type: "authorization_code",
          code: code.toString(),
          redirect_uri: redirectUri,
        }).toString(),
        { 
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 10000
        }
      );

      const { access_token } = tokenResponse.data;
      console.log("Access token received successfully");

      // Get user info
      console.log("Fetching user info from Discord...");
      const userResponse = await axios.get("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${access_token}` },
        timeout: 10000
      });
      console.log("User info received for:", userResponse.data.username);

      // Parse username
      const rawUsername = userResponse.data.global_name || userResponse.data.username;
      userResponse.data.parsed_username = parseDiscordUsername(rawUsername);

      // Get guild member info
      console.log(`Checking guild membership for guild: ${guildId}...`);
      let memberData;
      try {
        const memberResponse = await axios.get(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
          headers: { Authorization: `Bearer ${access_token}` },
          timeout: 10000
        });
        memberData = memberResponse.data;
        console.log("Guild member info received");
      } catch (e: any) {
        console.log("User is not in the guild or error fetching member info:", e.message);
        // User is not in the guild
        return res.send(`
          <html>
            <body style="background: #000; color: #fff; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'ACCESS_DENIED: GUILD_MEMBERSHIP_REQUIRED' }, '*');
                  setTimeout(() => window.close(), 3000);
                }
              </script>
              <p style="color: #ff4444; font-weight: bold; letter-spacing: 0.2em;">ACCESS DENIED</p>
              <p style="font-size: 10px; opacity: 0.6;">GUILD MEMBERSHIP REQUIRED</p>
            </body>
          </html>
        `);
      }

      // Check for role
      const hasRole = memberData.roles.includes(roleId);
      console.log(`User has required role (${roleId}):`, hasRole);
      if (!hasRole) {
        return res.send(`
          <html>
            <body style="background: #000; color: #fff; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'ACCESS_DENIED: INSUFFICIENT_CLEARANCE_LEVEL' }, '*');
                  setTimeout(() => window.close(), 3000);
                }
              </script>
              <p style="color: #ff4444; font-weight: bold; letter-spacing: 0.2em;">ACCESS DENIED</p>
              <p style="font-size: 10px; opacity: 0.6;">INSUFFICIENT CLEARANCE LEVEL</p>
            </body>
          </html>
        `);
      }

      // Success
      console.log("Authentication successful, updating database...");
      let supabaseToken = "";
      try {
        // Check if user already exists to preserve rank
        const { data: existingUser } = await supabaseAdmin
          .from("users")
          .select("rank")
          .eq("uid", userResponse.data.id)
          .single();

        let rank = 0;
        if (existingUser) {
          rank = existingUser.rank;
        }

        // Always ensure the primary user is superadmin if they log in (Peter.Young.000@gmail.com)
        if (userResponse.data.email === "Peter.Young.000@gmail.com" && userResponse.data.verified) {
          rank = 2;
        }

        const { data: fullUser, error: upsertError } = await supabaseAdmin.from("users").upsert(
          {
            uid: userResponse.data.id,
            username: userResponse.data.parsed_username,
            discord_auth_token: access_token,
            rank: rank,
          },
          { onConflict: "uid" }
        ).select().single();

        if (upsertError) {
          console.error("Supabase upsert error:", upsertError);
          throw upsertError;
        }

        // Map Supabase user to the format expected by the frontend
        const frontendUser = {
          id: fullUser.uid,
          username: fullUser.username,
          rank: fullUser.rank,
          ship_type: fullUser.ship_type,
          industry_class: fullUser.industry_class,
          home_system: fullUser.home_system,
          availability_mask: fullUser.availability_mask,
          timezone: fullUser.timezone,
        };
        
        // Set session cookie
        const cookieOptions = {
          httpOnly: true,
          secure: true,
          sameSite: "none" as const,
          signed: true,
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        };
        console.log(`Setting signed user_uid cookie for UID: ${userResponse.data.id} with options:`, { ...cookieOptions, signed: "HIDDEN" });
        res.cookie("user_uid", userResponse.data.id, cookieOptions);

        // Generate JWT for Supabase
        const payload = {
          sub: userResponse.data.id,
          role: "authenticated",
          iss: "supabase",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
        };
        supabaseToken = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET!);

        console.log("Sending success message to popup...");
        res.send(`
          <html>
            <body style="background: #000; color: #fff; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
              <script>
                try {
                  if (window.opener) {
                    window.opener.postMessage({ 
                      type: 'OAUTH_AUTH_SUCCESS', 
                      user: ${JSON.stringify(frontendUser)}, 
                      member: ${JSON.stringify(memberData)},
                      token: '${supabaseToken}'
                    }, '*');
                    window.close();
                  } else {
                    // Fallback if opener is lost
                    window.location.href = '/';
                  }
                } catch (e) {
                  console.error("Popup communication error:", e);
                  window.location.href = '/';
                }
              </script>
              <p style="color: #00ff00; font-weight: bold; letter-spacing: 0.2em;">AUTHENTICATION SUCCESSFUL</p>
              <p style="font-size: 10px; opacity: 0.6;">SYNCHRONIZING NEURAL LINK...</p>
            </body>
          </html>
        `);
        return;
      } catch (upsertError) {
        console.error("Supabase Upsert Error:", upsertError);
        throw upsertError;
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error_description || error.response?.data?.error || error.message;
      console.error("OAuth Error:", errorMsg);
      res.status(500).send(`
        <html>
          <body style="background: #000; color: #fff; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
                setTimeout(() => window.close(), 5000);
              }
            </script>
            <p style="color: #ff4444; font-weight: bold; letter-spacing: 0.2em;">AUTHENTICATION FAILED</p>
            <p style="font-size: 10px; opacity: 0.6;">${errorMsg}</p>
          </body>
        </html>
      `);
    }
  });

  // API Route to check session
  app.get("/api/auth/me", async (req, res) => {
    console.log("--- Auth Check Start ---");
    console.log("Raw Cookie Header:", req.headers.cookie);
    console.log("Signed Cookies:", req.signedCookies);
    console.log("Unsigned Cookies:", req.cookies);

    const uid = req.signedCookies.user_uid;
    console.log("Extracted user_uid from signed cookies:", uid);

    if (!uid) {
      console.log("Auth Check: No signed user_uid cookie found");
      if (req.cookies.user_uid) {
        console.log("Auth Check: Found unsigned user_uid cookie. This suggests a signature mismatch or that the cookie was set without a signature.");
      }
      return res.status(401).json({ error: "Not logged in" });
    }

    try {
      console.log(`Auth Check: Fetching user data from Supabase for UID: ${uid}`);
      const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("uid", uid)
        .single();

      if (error || !user) {
        console.log(`Auth Check: User not found in database or error fetching user for UID: ${uid}`, error?.message);
        return res.status(401).json({ error: "User not found" });
      }

      console.log("Auth Check: Session verified successfully for user:", user.username);
      res.json({
        id: user.uid,
        username: user.username,
        rank: user.rank,
        ship_type: user.ship_type,
        industry_class: user.industry_class,
        home_system: user.home_system,
        availability_mask: user.availability_mask,
        timezone: user.timezone,
      });
    } catch (error: any) {
      console.error("Auth Check Exception:", error.message);
      res.status(500).json({ error: "Internal server error" });
    } finally {
      console.log("--- Auth Check End ---");
    }
  });

  // API Route to logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("user_uid", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
