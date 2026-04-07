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

// --- Map Endpoints ---

// Get current map data
atlasRouter.get("/map", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("map_snapshots")
      .select("*")
      .eq("is_default", true)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    
    if (!data) {
      // Fallback to latest live if no default
      const { data: latest, error: latestError } = await supabaseAdmin
        .from("map_snapshots")
        .select("*")
        .eq("is_draft", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (latestError && latestError.code !== "PGRST116") throw latestError;
      return res.json(latest || { nodes: [], connections: [] });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all snapshots
atlasRouter.get("/snapshots", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("map_snapshots")
      .select("id, created_at, is_draft, is_default, created_by")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ingest map data
atlasRouter.post("/ingest", verifySession, async (req: any, res) => {
  const { nodes, connections, isDraft } = req.body;
  const uid = req.uid;

  try {
    // If not draft, unset other defaults or just save
    const { data, error } = await supabaseAdmin
      .from("map_snapshots")
      .insert({
        nodes,
        connections,
        is_draft: isDraft,
        created_by: uid,
        is_default: !isDraft // Auto-set as default if live? Or maybe not.
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Check if live exists
atlasRouter.get("/check-existing", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("map_snapshots")
      .select("id")
      .eq("is_draft", false)
      .limit(1);

    if (error) throw error;
    res.json({ exists: data.length > 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Set default map
atlasRouter.post("/set-default", verifySession, async (req: any, res) => {
  const { id } = req.body;
  try {
    // 1. Unset all defaults
    await supabaseAdmin.from("map_snapshots").update({ is_default: false }).neq("id", id);
    
    // 2. Set new default
    const { data, error } = await supabaseAdmin
      .from("map_snapshots")
      .update({ is_default: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Extrapolate sector
atlasRouter.post("/extrapolate", async (req, res) => {
  const { sector } = req.body;
  // This usually involves some logic to find systems in a sector.
  // For now, just return systems that match the sector prefix if applicable,
  // or a mock extrapolation.
  try {
    const { data, error } = await supabaseAdmin
      .from("systems")
      .select("*")
      .ilike("system_id", `${sector}%`);

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
