import { Router } from "express";
import { supabaseAdmin } from "../db";
import { verifySession } from "../middleware";

export const tribeRouter = Router();

// API Routes for Tribe Tabs
tribeRouter.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("tribe_tabs")
      .select("*")
      .order("position", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

tribeRouter.post("/", verifySession, async (req: any, res) => {
  const { title, content, position } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from("tribe_tabs")
      .insert({ title, content, position, visible: true })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

tribeRouter.put("/:id", verifySession, async (req: any, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from("tribe_tabs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

tribeRouter.delete("/:id", verifySession, async (req: any, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin
      .from("tribe_tabs")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
