import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
// Import modular routes and setup
import { setupSockets, getLogs } from "./server/sockets";
import { authRouter, rootAuthRouter } from "./server/routes/auth";
import { usersRouter } from "./server/routes/users";
import { manifestRouter } from "./server/routes/manifest";
import { operationsRouter } from "./server/routes/operations";
import { scoutsRouter } from "./server/routes/scouts";
import { riftsRouter } from "./server/routes/rifts";
import { atlasRouter } from "./server/routes/atlas";
import { gatesRouter } from "./server/routes/gates";
import { discordRouter } from "./server/routes/discord";
import { intelRouter } from "./server/routes/intel";
import { tribeRouter } from "./server/routes/tribe";
import { logisticRouter } from "./server/routes/logistic";
import { navigationRouter } from "./server/routes/navigation";
import { systemsRouter } from "./server/routes/systems";
import { supabaseAdmin } from "./server/db";

import { setupDiscordBot } from "./server/discordBot";

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  // Initialize Discord Bot
  setupDiscordBot();

  app.use(express.json());
  app.use(cookieParser(process.env.COOKIE_SECRET || "exotech_industrial_secret_v1"));

  // Debug logs route
  app.get("/api/debug/logs", (req, res) => {
    res.json(getLogs());
  });

  // Register modular routes
  app.use("/auth", rootAuthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/manifest", manifestRouter);
  app.use("/api/operations", operationsRouter);
  app.use("/api/scouts", scoutsRouter);
  app.use("/api/rifts", riftsRouter);
  app.use("/api/atlas", atlasRouter);
  app.use("/api/gates", gatesRouter);
  app.use("/api/discord", discordRouter);
  app.use("/api/intel-tabs", intelRouter);
  app.use("/api/tribe-tabs", tribeRouter);
  app.use("/api/logistic", logisticRouter);
  app.use("/api/navigation", navigationRouter);
  app.use("/api/systems", systemsRouter);

  // Setup WebSockets
  setupSockets(io);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Express Error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
