import { Router } from "express";
import { supabaseAdmin } from "../db";
import { verifySession } from "../middleware";

export const usersRouter = Router();

// API Route to get all users (for admin dropdown)
usersRouter.get("/", verifySession, async (req: any, res) => {
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

// API Route to update user rank (admin only)
usersRouter.post("/rank", verifySession, async (req: any, res) => {
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
    
    // We can't easily emit from here without passing io, but we can rely on the frontend to refresh or we can pass io to the router later.
    // For now, just return success.
    
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("User Rank Update Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API Route to update user profile
usersRouter.post("/update", verifySession, async (req: any, res) => {
  const uid = req.uid;
  const { ship_type, industry_class, home_system, availability_mask, timezone } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        ship_type,
        industry_class,
        home_system,
        availability_mask,
        timezone
      })
      .eq("uid", uid)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to get user profile
usersRouter.get("/profile", verifySession, async (req: any, res) => {
  const uid = req.uid;
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("uid, username, avatar_url, rank")
      .eq("uid", uid)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
