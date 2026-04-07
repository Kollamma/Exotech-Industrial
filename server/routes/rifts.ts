import { Router } from "express";
import { supabaseAdmin } from "../db";
import { verifySession } from "../middleware";
import { notifyNewRift } from "../discordBot";

export const riftsRouter = Router();

// API Route to get active rifts
riftsRouter.get("/", async (req, res) => {
  try {
    // 1. Fetch rifts
    const { data: rifts, error: riftsError } = await supabaseAdmin
      .from("rifts")
      .select("*")
      .eq("visible", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (riftsError) throw riftsError;
    if (!rifts || rifts.length === 0) return res.json([]);

    // 2. Fetch usernames for these rifts manually to avoid join issues
    const uids = [...new Set(rifts.map(r => r.uid))];
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("uid, username")
      .in("uid", uids);

    const userMap = (users || []).reduce((acc: any, u) => {
      acc[u.uid] = u.username;
      return acc;
    }, {});
    
    const formattedData = rifts.map(r => ({
      ...r,
      username: userMap[r.uid] || "Unknown"
    }));
    
    res.json(formattedData);
  } catch (error: any) {
    console.error("Rifts Fetch Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API Route to log a rift
riftsRouter.post("/log", verifySession, async (req: any, res) => {
  const uid = req.uid;
  const { system_id, type } = req.body;

  if (!system_id || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    console.log(`Logging rift for UID: ${uid}, System: ${system_id}, Type: ${type}`);
    // 1. Fetch user's username
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("username")
      .eq("uid", uid)
      .single();

    if (userError) {
      console.warn("Could not fetch username for rift report:", userError.message);
    }
    const username = userData?.username || "Unknown";

    // 2. Insert rift
    console.log("Inserting rift into Supabase...");
    const { data, error } = await supabaseAdmin
      .from("rifts")
      .insert({
        uid,
        username,
        system_id,
        type,
        visible: true
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase Rift Insert Error:", error);
      throw error;
    }

    console.log("Rift inserted successfully:", data.id);

    // 3. Notify Discord
    try {
      await notifyNewRift(system_id, type, username);
    } catch (discordErr) {
      console.error("Discord Notification Error (non-fatal):", discordErr);
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Rift Logging Exception:", error);
    res.status(500).json({ error: error.message || "Internal server error during rift logging" });
  }
});

// API Route to mark rift as collapsed (DELETE)
riftsRouter.delete("/:id", verifySession, async (req: any, res) => {
  const { id } = req.params;
  console.log(`Attempting to delete rift with ID: ${id}`);

  try {
    const { data, error } = await supabaseAdmin
      .from("rifts")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase Rift Delete Error:", error);
      throw error;
    }
    
    console.log("Rift deleted successfully:", id);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Rift Delete Exception:", error);
    res.status(500).json({ error: error.message });
  }
});
