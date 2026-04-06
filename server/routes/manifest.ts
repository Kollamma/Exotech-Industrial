import { Router } from "express";
import { supabaseAdmin } from "../db";
import { verifySession } from "../middleware";

export const manifestRouter = Router();

// API Route to get manifest ledger
manifestRouter.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("manifest_ledger")
      .select(`
        *,
        donor:users!manifest_ledger_donor_uid_fkey(username),
        logger:users!manifest_ledger_logger_uid_fkey(username)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to get current stock
manifestRouter.get("/stock", async (req, res) => {
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

// API Route to submit a contribution
manifestRouter.post("/contribute", verifySession, async (req: any, res) => {
  const uid = req.uid;
  const { donor_uid, item, amount, target_id, notes } = req.body;

  if (!donor_uid || !item || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
    const isAdmin = user && user.rank >= 1;

    const isSelfDonation = uid === donor_uid;
    const isVerified = isAdmin;

    const { data, error } = await supabaseAdmin
      .from("manifest_ledger")
      .insert({
        logger_uid: uid,
        donor_uid: donor_uid,
        type: "donation",
        resource: item,
        amount: Number(amount),
        ledger_impact: isVerified ? Number(amount) : 0,
        verified: isVerified,
        target_id: target_id || null,
        notes: notes || ""
      })
      .select()
      .single();

    if (error) throw error;

    if (isVerified) {
      const { data: stockData } = await supabaseAdmin
        .from("resource_stock")
        .select("amount")
        .eq("resource", item)
        .single();

      const currentAmount = stockData ? stockData.amount : 0;
      const newAmount = currentAmount + Number(amount);

      await supabaseAdmin
        .from("resource_stock")
        .upsert({ resource: item, amount: newAmount }, { onConflict: "resource" });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to verify a contribution
manifestRouter.post("/verify/:id", verifySession, async (req: any, res) => {
  const uid = req.uid;
  const { id } = req.params;

  try {
    const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
    if (!user || user.rank < 1) return res.status(403).json({ error: "Unauthorized" });

    const { data: log, error: logError } = await supabaseAdmin
      .from("manifest_ledger")
      .select("*")
      .eq("id", id)
      .single();

    if (logError || !log) throw new Error("Log not found");
    if (log.verified) return res.status(400).json({ error: "Already verified" });

    const { error: updateError } = await supabaseAdmin
      .from("manifest_ledger")
      .update({ verified: true, ledger_impact: log.amount })
      .eq("id", id);

    if (updateError) throw updateError;

    const { data: stockData } = await supabaseAdmin
      .from("resource_stock")
      .select("amount")
      .eq("resource", log.resource)
      .single();

    const currentAmount = stockData ? stockData.amount : 0;
    const newAmount = currentAmount + log.amount;

    await supabaseAdmin
      .from("resource_stock")
      .upsert({ resource: log.resource, amount: newAmount }, { onConflict: "resource" });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
