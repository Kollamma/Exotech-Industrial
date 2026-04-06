import { Router } from "express";
import { supabaseAdmin } from "../db";
import { verifySession } from "../middleware";

export const gatesRouter = Router();

// API Route to get all gates
gatesRouter.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("gates")
      .select("*")
      .order("name");

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to add a gate
gatesRouter.post("/", verifySession, async (req: any, res) => {
  const { name, system_id, type, status } = req.body;

  if (!name || !system_id || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("gates")
      .insert({
        name,
        system_id,
        type,
        status: status || "active"
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
