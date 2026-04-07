import { Router } from "express";
import fs from "fs";
import path from "path";

export const systemsRouter = Router();

let systemsCache: string[] | null = null;

function getSystems() {
  if (systemsCache) return systemsCache;
  
  try {
    const systemsPath = path.join(process.cwd(), "systems.json");
    if (fs.existsSync(systemsPath)) {
      const data = fs.readFileSync(systemsPath, "utf-8");
      systemsCache = JSON.parse(data);
      return systemsCache;
    }
  } catch (error) {
    console.error("Error loading systems.json:", error);
  }
  return [];
}

systemsRouter.get("/search", (req, res) => {
  const query = (req.query.q as string || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  
  if (query.length < 3) {
    return res.json([]);
  }

  const systems = getSystems();
  if (!systems) return res.json([]);

  // Hyphen-insensitive search
  const matches = systems
    .filter(s => {
      const normalized = s.toUpperCase().replace(/[^A-Z0-9]/g, "");
      return normalized.startsWith(query);
    })
    .slice(0, 10);

  res.json(matches);
});
