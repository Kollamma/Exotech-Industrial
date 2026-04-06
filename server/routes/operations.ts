import { Router } from "express";
import { supabaseAdmin } from "../db";
import { verifySession } from "../middleware";

export const operationsRouter = Router();

// API Routes for operations
operationsRouter.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("operations")
      .select(`
        *,
        lead:users!operations_lead_uid_fkey(username)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    
    const formattedData = data.map(op => ({
      ...op,
      username: op.lead?.username || "Unknown"
    }));
    
    res.json(formattedData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

operationsRouter.post("/log", verifySession, async (req: any, res) => {
  const uid = req.uid;
  const { lead_uid, operation_type, system_id, description } = req.body;
  
  if (!operation_type || !system_id) return res.status(400).json({ error: "Missing fields" });

  const actualLeadUid = lead_uid || uid;

  try {
    const { data, error } = await supabaseAdmin
      .from("operations")
      .insert({
        lead_uid: actualLeadUid,
        operation_type: operation_type,
        system_id: system_id,
        description: description || "",
        members: actualLeadUid, // Initialize members with the lead
        status: "active"
      })
      .select()
      .single();

    if (error) throw error;
    
    // We will emit the socket event from the main server or via a global io instance
    // For now, we rely on the postgres_changes listener to emit the event
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to join an operation
operationsRouter.post("/:id/join", verifySession, async (req: any, res) => {
  const uid = req.uid;
  const { id } = req.params;

  try {
    const { data: op, error: fetchError } = await supabaseAdmin
      .from("operations")
      .select("members")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const membersList = op.members ? op.members.split(",") : [];
    if (!membersList.includes(uid)) {
      membersList.push(uid);
      const { data, error } = await supabaseAdmin
        .from("operations")
        .update({ members: membersList.join(",") })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } else {
      res.json({ success: true, message: "Already joined" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to submit a contribution
operationsRouter.post("/:id/contribute", verifySession, async (req: any, res) => {
  const uid = req.uid;
  const { id } = req.params;
  const { item_type, amount, username } = req.body;

  if (!item_type || !amount) return res.status(400).json({ error: "Missing fields" });

  try {
    const { data: op, error: fetchError } = await supabaseAdmin
      .from("operations")
      .select("contributions")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const contributions = op.contributions ? JSON.parse(op.contributions) : [];
    contributions.push({
      id: Math.random().toString(36).substr(2, 9),
      uid,
      username,
      item_type,
      amount: Number(amount),
      status: "pending"
    });

    const { data, error } = await supabaseAdmin
      .from("operations")
      .update({ contributions: JSON.stringify(contributions) })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to confirm a contribution
operationsRouter.post("/:id/contributions/:contributionId/confirm", verifySession, async (req: any, res) => {
  const uid = req.uid;
  const { id, contributionId } = req.params;

  try {
    // Check if user is admin or operation lead
    const { data: user } = await supabaseAdmin.from("users").select("rank").eq("uid", uid).single();
    const { data: op, error: fetchError } = await supabaseAdmin
      .from("operations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    if (op.lead_uid !== uid && (!user || user.rank < 1)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const contributions = op.contributions ? JSON.parse(op.contributions) : [];
    const contributionIndex = contributions.findIndex((c: any) => c.id === contributionId);

    if (contributionIndex === -1) return res.status(404).json({ error: "Contribution not found" });
    if (contributions[contributionIndex].status === "confirmed") return res.status(400).json({ error: "Already confirmed" });

    const contribution = contributions[contributionIndex];
    contribution.status = "confirmed";

    // 1. Update the operation contributions
    const { data: updatedOp, error: updateError } = await supabaseAdmin
      .from("operations")
      .update({ contributions: JSON.stringify(contributions) })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 2. Add to manifest_ledger
    const { error: manifestError } = await supabaseAdmin
      .from("manifest_ledger")
      .insert({
        logger_uid: uid,
        donor_uid: contribution.uid,
        type: "donation",
        resource: contribution.item_type,
        amount: contribution.amount,
        ledger_impact: contribution.amount,
        verified: true,
        notes: `Contributed during operation ${op.operation_number}`
      });

    if (manifestError) throw manifestError;

    // 3. Update resource_stock
    const { data: stockData } = await supabaseAdmin
      .from("resource_stock")
      .select("amount")
      .eq("resource", contribution.item_type)
      .single();

    const currentAmount = stockData ? stockData.amount : 0;
    const newAmount = currentAmount + contribution.amount;

    const { error: stockError } = await supabaseAdmin
      .from("resource_stock")
      .upsert({ resource: contribution.item_type, amount: newAmount }, { onConflict: "resource" });

    if (stockError) throw stockError;

    res.json({ success: true, data: updatedOp });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
