import { Router } from "express";
import { supabaseAdmin } from "../db";
import { verifySession } from "../middleware";

export const scoutsRouter = Router();

// API Route to get active scouts
scoutsRouter.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("scouts")
      .select(`
        *,
        users!scouts_uid_fkey(username)
      `)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    
    const formattedData = data.map(b => ({
      ...b,
      username: b.users?.username || "Unknown"
    }));
    
    res.json(formattedData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to log a broadcast
scoutsRouter.post("/broadcast", verifySession, async (req: any, res) => {
  const uid = req.uid;
  const { system_id, site_contents, system_strength } = req.body;

  if (!system_id || !site_contents) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("scouts")
      .upsert({
        uid,
        system_id,
        site_contents,
        system_strength
      }, { onConflict: "system_id" })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
