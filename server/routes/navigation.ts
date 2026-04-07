import { Router } from "express";
import { calculateRoute } from "../services/navigationService";

export const navigationRouter = Router();

navigationRouter.get("/plan", async (req, res) => {
  const { start, end, max_ly, mode } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "Missing start or end system" });
  }

  try {
    const result = await calculateRoute(
      start as string,
      end as string,
      (max_ly as string) || "50",
      (mode as string) || "fastest"
    );
    
    res.json(result);
  } catch (error: any) {
    console.error("Navigation proxy error:", error.message);
    
    // Specifically handle "System not found" if the service returns it
    if (error.message && error.message.toLowerCase().includes("not found")) {
      return res.status(400).json({ error: `NAVIGATION ERROR: ${error.message}` });
    }
    
    res.status(500).json({ error: "Failed to calculate route via proxy", details: error.message });
  }
});
