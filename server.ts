import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { REST, Routes, Client, GatewayIntentBits, Events, MessageFlags } from "discord.js";

// Import modular routes and setup
import { setupSockets } from "./server/sockets";
import { authRouter, rootAuthRouter } from "./server/routes/auth";
import { usersRouter } from "./server/routes/users";
import { manifestRouter } from "./server/routes/manifest";
import { operationsRouter } from "./server/routes/operations";
import { scoutsRouter } from "./server/routes/scouts";
import { riftsRouter } from "./server/routes/rifts";
import { atlasRouter } from "./server/routes/atlas";
import { gatesRouter } from "./server/routes/gates";
import { discordRouter } from "./server/routes/discord";
import { supabaseAdmin } from "./server/db";

dotenv.config();

async function registerDiscordCommands() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !clientId) {
    console.log("Discord bot token or client ID missing. Skipping slash command registration.");
    return;
  }

  const commands = [
    {
      name: "rifts",
      description: "Get the current live rifts",
    },
    {
      name: "rifthunter",
      description: "Toggle the @rifthunter role to receive notifications for new rifts",
    },
    {
      name: "route",
      description: "Calculate a navigation route between two systems",
      options: [
        {
          name: "start",
          description: "Starting system (e.g., ERS7R4)",
          type: 3, // STRING
          required: true,
        },
        {
          name: "end",
          description: "Destination system",
          type: 3, // STRING
          required: true,
        },
        {
          name: "range",
          description: "Jump range in LY (e.g., 50)",
          type: 10, // NUMBER
          required: true,
        },
        {
          name: "mode",
          description: "Routing mode",
          type: 3, // STRING
          required: true,
          choices: [
            { name: "Fastest", value: "fastest" },
            { name: "Cheapest", value: "cheapest" },
          ],
        },
      ],
    },
  ];

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    if (guildId) {
      console.log(`Started refreshing application (/) commands for guild: ${guildId}`);
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log("Successfully reloaded guild (/) commands.");

      // Clear global commands to avoid duplicates if they were previously registered
      console.log("Clearing global application (/) commands...");
      await rest.put(Routes.applicationCommands(clientId), { body: [] });
      console.log("Successfully cleared global commands.");
    } else {
      console.log("Started refreshing application (/) commands globally.");
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log("Successfully reloaded global (/) commands.");
    }
  } catch (error) {
    console.error("Error registering Discord commands:", error);
  }
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  // Initialize Discord Bot
  const discordToken = process.env.DISCORD_BOT_TOKEN;
  if (discordToken) {
    const discordClient = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });

    discordClient.once(Events.ClientReady, (c) => {
      console.log(`Discord Bot logged in as ${c.user.tag}`);
    });

    discordClient.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === "rifts") {
        try {
          const { data, error } = await supabaseAdmin
            .from("rifts")
            .select("*")
            .eq("visible", true)
            .order("created_at", { ascending: false });

          if (error) throw error;

          if (!data || data.length === 0) {
            await interaction.reply("No tangible rifts have been reported yet.");
            return;
          }

          const riftList = data
            .map((r) => {
              const reportedAt = new Date(r.created_at);
              const now = new Date();
              const diffMs = now.getTime() - reportedAt.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMins / 60);
              const diffDays = Math.floor(diffHours / 24);

              let timeAgo = "";
              if (diffDays > 0) timeAgo = `${diffDays} days ago`;
              else if (diffHours > 0) timeAgo = `${diffHours} hours ago`;
              else if (diffMins > 0) timeAgo = `${diffMins} minutes ago`;
              else timeAgo = "just now";

              return `• **${r.system_id}** (${r.type}) - Reported by **${r.username}** ${timeAgo}`;
            })
            .join("\n");

          await interaction.reply(`🛰️ **Current Tangible Rifts:**\n${riftList}`);
        } catch (err) {
          console.error("Error handling /rifts command:", err);
          await interaction.reply({
            content: "There was an error fetching the latest rifts.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      if (interaction.commandName === "route") {
        try {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          const start = interaction.options.getString("start", true).toUpperCase();
          const end = interaction.options.getString("end", true).toUpperCase();
          const range = interaction.options.getNumber("range", true);
          const mode = interaction.options.getString("mode", true);

          const rawBaseUrl = process.env.VITE_NAV_SERVICE_URL || "https://nav-service.railway.app";
          const baseUrl = rawBaseUrl.replace(/\/+$/, "");
          const params = new URLSearchParams({
            start,
            end,
            range: range.toString(),
            mode,
          });

          const res = await fetch(`${baseUrl}/api/route?${params.toString()}`);
          if (!res.ok) {
            throw new Error(`Nav service returned ${res.status}`);
          }

          const data = await res.json();

          if (data.error) {
            await interaction.editReply(`❌ **Routing Error:** ${data.error}`);
            return;
          }

          if (!data.path || data.path.length === 0) {
            await interaction.editReply(`❌ No route found from **${start}** to **${end}** within ${range} LY jumps.`);
            return;
          }

          const pathStr = data.path.join(" ➔ ");
          const totalJumps = data.path.length - 1;
          const totalDistance = data.total_distance ? data.total_distance.toFixed(2) : "Unknown";

          let reply = `🗺️ **Navigation Route: ${start} to ${end}**\n`;
          reply += `**Mode:** ${mode === "fastest" ? "Fastest (Fewest Jumps)" : "Cheapest (Least Fuel)"}\n`;
          reply += `**Jumps:** ${totalJumps}\n`;
          reply += `**Total Distance:** ${totalDistance} LY\n\n`;
          reply += `\`${pathStr}\``;

          await interaction.editReply(reply);
        } catch (err) {
          console.error("Error handling /route command:", err);
          await interaction.editReply("There was an error calculating the route. The navigation service might be down.");
        }
      }

      if (interaction.commandName === "rifthunter") {
        try {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          
          const roleId = process.env.DISCORD_RIFTHUNTER_ROLE_ID;
          if (!roleId) {
            await interaction.editReply("The Rifthunter role has not been configured by the server administrator.");
            return;
          }

          const member = interaction.member as any;
          if (!member || !member.roles) {
            await interaction.editReply("Could not determine your roles. Are you in the server?");
            return;
          }

          const hasRole = member.roles.cache.has(roleId);

          if (hasRole) {
            await member.roles.remove(roleId);
            await interaction.editReply("Removed the <@&" + roleId + "> role. You will no longer receive rift notifications.");
          } else {
            await member.roles.add(roleId);
            await interaction.editReply("Added the <@&" + roleId + "> role! You will now receive rift notifications.");
          }
        } catch (err) {
          console.error("Error handling /rifthunter command:", err);
          await interaction.editReply("There was an error toggling your role. Please try again later or contact an admin.");
        }
      }
    });

    discordClient.login(discordToken);
    registerDiscordCommands();
  }

  app.use(express.json());
  app.use(cookieParser(process.env.COOKIE_SECRET || "exotech_industrial_secret_v1"));

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

  // API Route for system search (autocomplete)
  app.get("/api/systems/search", async (req, res) => {
    const query = (req.query.q as string || "").toUpperCase();
    if (query.length < 3) {
      return res.json([]);
    }

    try {
      const systemsPath = path.join(process.cwd(), "systems.json");
      if (!fs.existsSync(systemsPath)) {
        return res.json([]);
      }
      const systemsData = fs.readFileSync(systemsPath, "utf-8");
      const systems: string[] = JSON.parse(systemsData);
      
      const matches = systems
        .filter(s => s.toUpperCase().startsWith(query))
        .slice(0, 10);
      
      res.json(matches);
    } catch (error) {
      console.error("System search error:", error);
      res.json([]);
    }
  });

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
