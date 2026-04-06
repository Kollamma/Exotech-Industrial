import { Router } from "express";
import { supabaseAdmin } from "../db";
import { verifySession } from "../middleware";

export const riftsRouter = Router();

// API Route to get active rifts
riftsRouter.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("rifts")
      .select("*")
      .eq("visible", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    
    // We don't have a foreign key relationship, so we can't join users easily.
    // For now, just return Unknown for username, or we could fetch users separately.
    const formattedData = (data || []).map(r => ({
      ...r,
      username: "Unknown"
    }));
    
    res.json(formattedData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to log a rift
riftsRouter.post("/log", verifySession, async (req: any, res) => {
  const uid = req.uid;
  const { system_id, type, notes } = req.body;

  if (!system_id || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("rifts")
      .insert({
        uid,
        system_id,
        type,
        notes: notes || "",
        visible: true
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to mark rift as collapsed (DELETE)
riftsRouter.delete("/:id", verifySession, async (req: any, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from("rifts")
      .update({ visible: false })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
