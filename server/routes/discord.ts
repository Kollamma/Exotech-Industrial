import { Router } from "express";
import axios from "axios";
import { verifySession } from "../middleware";
import { getDiscordLogs, isDiscordBotDisabled, setDiscordDisabled } from "../discordBot";

export const discordRouter = Router();

// API Route to get Discord bot logs (for development monitoring)
discordRouter.get("/dev/logs", verifySession, (req, res) => {
  res.json({
    logs: getDiscordLogs(),
    disabled: isDiscordBotDisabled()
  });
});

// API Route to toggle Discord bot state (for development monitoring)
discordRouter.post("/dev/toggle", verifySession, (req, res) => {
  const { disabled } = req.body;
  setDiscordDisabled(disabled);
  res.json({ success: true, disabled: isDiscordBotDisabled() });
});

// API Route to get Discord roles (for rifthunter toggle)
discordRouter.get("/roles", verifySession, async (req: any, res) => {
  const uid = req.uid;
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!guildId || !botToken) {
    return res.status(500).json({ error: "Discord integration not configured" });
  }

  try {
    // 1. Get user's discord_id from DB
    const { data: user, error: userError } = await (await import("../db")).supabaseAdmin
      .from("users")
      .select("discord_id")
      .eq("uid", uid)
      .single();

    if (userError || !user?.discord_id) {
      return res.status(404).json({ error: "Discord ID not found for user" });
    }

    // 2. Fetch member from Discord API
    const memberResponse = await axios.get(
      `https://discord.com/api/guilds/${guildId}/members/${user.discord_id}`,
      { headers: { Authorization: `Bot ${botToken}` } }
    );

    res.json({ roles: memberResponse.data.roles });
  } catch (error: any) {
    console.error("Error fetching Discord roles:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

// API Route to toggle a Discord role
discordRouter.post("/roles/toggle", verifySession, async (req: any, res) => {
  const uid = req.uid;
  const { roleId, action } = req.body; // action: 'add' or 'remove'
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!guildId || !botToken || !roleId || !action) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const { data: user, error: userError } = await (await import("../db")).supabaseAdmin
      .from("users")
      .select("discord_id")
      .eq("uid", uid)
      .single();

    if (userError || !user?.discord_id) {
      return res.status(404).json({ error: "Discord ID not found for user" });
    }

    const url = `https://discord.com/api/guilds/${guildId}/members/${user.discord_id}/roles/${roleId}`;
    
    if (action === 'add') {
      await axios.put(url, {}, { headers: { Authorization: `Bot ${botToken}` } });
    } else {
      await axios.delete(url, { headers: { Authorization: `Bot ${botToken}` } });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error toggling Discord role:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to toggle role" });
  }
});
