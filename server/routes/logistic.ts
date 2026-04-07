import { Router } from "express";
import { supabaseAdmin } from "../db";
import { verifySession } from "../middleware";

export const logisticRouter = Router();

// API Route to get gate foam/contributors data
logisticRouter.get("/gates", async (req, res) => {
  try {
    // This aggregates from manifest_ledger for foam contributions
    const { data, error } = await supabaseAdmin
      .from("manifest_ledger")
      .select("resource, amount, donor_uid, donor:users!manifest_ledger_donor_uid_fkey(username)")
      .ilike("resource", "FOAM_%")
      .eq("verified", true);

    if (error) throw error;

    // Aggregate by gate
    const gateData: any[] = [];
    data.forEach((entry: any) => {
      const gateName = entry.resource.replace("FOAM_", "");
      let gate = gateData.find(g => g.name === gateName);
      if (!gate) {
        gate = { name: gateName, foam: 0, contributors: [] };
        gateData.push(gate);
      }
      gate.foam += entry.amount;
      
      let contributor = gate.contributors.find((c: any) => c.uid === entry.donor_uid);
      if (!contributor) {
        contributor = { uid: entry.donor_uid, username: entry.donor?.username || "Unknown", amount: 0 };
        gate.contributors.push(contributor);
      }
      contributor.amount += entry.amount;
    });

    res.json(gateData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to log a foam contribution
logisticRouter.post("/input", verifySession, async (req: any, res) => {
  const { gate_name, amount, donor_uid } = req.body;
  const verifier_uid = req.uid;

  if (!gate_name || !amount || !donor_uid) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1. Insert into manifest_ledger
    const { error: ledgerError } = await supabaseAdmin
      .from("manifest_ledger")
      .insert({
        logger_uid: verifier_uid,
        donor_uid: donor_uid,
        type: "donation",
        resource: `FOAM_${gate_name}`,
        amount: parseInt(amount),
        ledger_impact: parseInt(amount),
        verified: true,
        notes: `Foam contribution for gate ${gate_name}`
      });

    if (ledgerError) throw ledgerError;

    // 2. Update resource_stock
    const { data: stock } = await supabaseAdmin
      .from("resource_stock")
      .select("*")
      .eq("resource", `FOAM_${gate_name}`)
      .single();

    if (stock) {
      await supabaseAdmin
        .from("resource_stock")
        .update({ amount: stock.amount + parseInt(amount) })
        .eq("resource", `FOAM_${gate_name}`);
    } else {
      await supabaseAdmin
        .from("resource_stock")
        .insert({ resource: `FOAM_${gate_name}`, amount: parseInt(amount) });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
