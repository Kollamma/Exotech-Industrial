import { Router } from "express";
import { supabaseAdmin } from "../db";
import { verifySession } from "../middleware";

export const atlasRouter = Router();

// API Route to get all systems
atlasRouter.get("/systems", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("systems")
      .select("*");

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to get all connections
atlasRouter.get("/connections", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("connections")
      .select("*");

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to add a system
atlasRouter.post("/systems", verifySession, async (req: any, res) => {
  const { system_id, type, security, notes } = req.body;

  if (!system_id || !type || !security) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("systems")
      .insert({
        system_id,
        type,
        security,
        notes: notes || ""
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to add a connection
atlasRouter.post("/connections", verifySession, async (req: any, res) => {
  const { source_id, target_id, type } = req.body;

  if (!source_id || !target_id || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("connections")
      .insert({
        source_id,
        target_id,
        type
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
