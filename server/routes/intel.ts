import { Router } from "express";
import { supabaseAdmin } from "../db";
import { verifySession } from "../middleware";

export const intelRouter = Router();

// API Routes for Intel Tabs
intelRouter.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("intel_tabs")
      .select("*")
      .order("position", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

intelRouter.post("/", verifySession, async (req: any, res) => {
  const { title, content, position } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from("intel_tabs")
      .insert({ title, content, position, visible: true })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

intelRouter.put("/:id", verifySession, async (req: any, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from("intel_tabs")
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

intelRouter.delete("/:id", verifySession, async (req: any, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin
      .from("intel_tabs")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
