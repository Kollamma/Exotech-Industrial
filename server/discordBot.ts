import { REST, Routes, Client, GatewayIntentBits, Events, MessageFlags } from "discord.js";
import axios from "axios";
import { supabaseAdmin } from "./db";
import { calculateRoute } from "./services/navigationService";

// Development monitoring state
let discordDisabled = false;
const discordLogs: { timestamp: string; type: string; message: string; details?: any }[] = [];

function logDiscordInteraction(type: string, message: string, details?: any) {
  const entry = {
    timestamp: new Date().toISOString(),
    type,
    message,
    details
  };
  discordLogs.push(entry);
  if (discordLogs.length > 100) discordLogs.shift();
  console.log(`[DISCORD LOG] ${type}: ${message}`);
}

export function getDiscordLogs() {
  return discordLogs;
}

export function setDiscordDisabled(disabled: boolean) {
  discordDisabled = disabled;
  logDiscordInteraction("SYSTEM", `Discord functionality ${disabled ? "DISABLED" : "ENABLED"} in development environment.`);
}

export function isDiscordBotDisabled() {
  return discordDisabled;
}

export async function registerDiscordCommands() {
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

export function setupDiscordBot() {
  const discordToken = process.env.DISCORD_BOT_TOKEN;
  if (!discordToken) return null;

  const discordClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  discordClient.once(Events.ClientReady, (c) => {
    console.log(`Discord Bot logged in as ${c.user.tag}`);
  });

  discordClient.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (discordDisabled) {
      logDiscordInteraction("COMMAND_BLOCKED", `Received /${interaction.commandName} but bot is disabled.`, { user: interaction.user.tag });
      return;
    }

    if (interaction.commandName === "rifts") {
      logDiscordInteraction("COMMAND_RECEIVED", "Received /rifts command", { user: interaction.user.tag });
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
      } catch (err: any) {
        if (err.code === 10062) {
          console.log("Interaction already handled or expired (rifts). Skipping reply.");
          return;
        }
        console.error("Error handling /rifts command:", err);
        try {
          await interaction.reply({
            content: "There was an error fetching the latest rifts.",
            flags: MessageFlags.Ephemeral,
          });
        } catch (replyErr) {
          console.error("Failed to send rifts error reply:", replyErr);
        }
      }
    }

    if (interaction.commandName === "route") {
      const start = interaction.options.getString("start", true);
      const end = interaction.options.getString("end", true);
      const range = interaction.options.getNumber("range", true);
      const mode = interaction.options.getString("mode", true);
      
      logDiscordInteraction("COMMAND_RECEIVED", `Received /route command: ${start} -> ${end}`, { user: interaction.user.tag, range, mode });
      
      try {
        // Acknowledge the interaction immediately to prevent timeout
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        // Show a holding message
        await interaction.editReply(`🛰️ **Calculating route from ${start.toUpperCase()} to ${end.toUpperCase()}...**\nConnecting to Exotech Navigation Array...`);

        const result = await calculateRoute(start, end, range, mode);
        const { route, total_distance } = result;

        // Format for Discord
        const pathStr = route.map((s: any) => s.name).join(" ➔ ");
        const totalJumps = route.length - 1;
        const totalDistanceStr = total_distance.toFixed(2);

        // Generate Notepad Format (Matching RouteTab.tsx handleCopyRoute)
        let notepadHeader = `<font size="10" color="#ff4c4c4c">&gt;_STELLAR_NETWORK_INITIALIZED<br>&gt;_UPLINK_ESTABLISHED_WITH_EXOTECH_NAV_ARRAY<br>&gt;_STELLAR_ROUTE_CALCULATED<br><br></font>`;
        if (mode === "cheapest") {
          notepadHeader = `<font size="10" color="#ff4c4c4c">&gt;_STELLAR_NETWORK_INITIALIZED<br>&gt;_UPLINK_ESTABLISHED_WITH_EXOTECH_NAV_ARRAY<br>&gt;_STELLAR_ROUTE_CALCULATED<br><br>&gt;_ROUTE OPTIMISED FOR CHEAPEST ROUTE - </font><font size="10" color="#ff7f0000">CAUTION, YOU ARE POTENTIALLY EXPENDING ADDITIONAL FUEL<br><br></font>`;
        }
        const notepadStart = `<font size="14" color="#bfffffff">:|&gt;Starting at ${start.toUpperCase()}<br>`;
        
        const notepadSteps = route.map((step: any, index: number) => {
          if (index === 0 || step.type === "START") return null;
          const prefix = step.type === "GATE" ? ":Z Gate-Jump to " : ":| Drive-Jump to ";
          const link = step.type === "GATE" ? step.name : (step.ingame_link || `https://exotech.industrial/system/${step.name}`);
          const dist = typeof step.dist === 'number' ? step.dist.toFixed(2) : "??";
          return `${prefix}</font><font size="14" color="#ffd98d00">${link}</font><font size="14" color="#bfffffff"> - (${dist} LY)<br>`;
        }).filter(Boolean).join('');

        const notepadFooter = `<br></font><font size="10" color="#ff4c4c4c">&gt;_NAVIGATION_DATA_SYNC_COMPLETE<br>&gt;_SAFE_TRAVELS_PILOT<br></font><font size="10" color="#ff7f7f00">&gt;_THANK_YOU_FOR_ROUTE-PLANNING_WITH_EXOTECH_INDUSTRIAL_TODAY</font>`;

        const fullNotepadText = `${notepadHeader}${notepadStart}${notepadSteps}${notepadFooter}`;

        logDiscordInteraction("ROUTE_SUCCESS", `Found route: ${totalJumps} jumps, ${totalDistanceStr} LY`, { path: route.map((s: any) => s.name) });

        let reply = `🛰️ **ROUTE CALCULATED: ${start.toUpperCase()} ➔ ${end.toUpperCase()}**\n`;
        reply += `**Total Distance:** ${totalDistanceStr} LY | **Jumps:** ${totalJumps} | **Mode:** ${mode.toUpperCase()}\n\n`;
        reply += `**Visual Path:**\n\`${pathStr}\`\n\n`;
        reply += `**Notepad Copy-Paste (EVE Frontier):**\n\`\`\`html\n${fullNotepadText}\n\`\`\``;

        // Check for Discord's 2000 character limit
        if (reply.length > 2000) {
          await interaction.editReply(`🛰️ **Route Found (${totalJumps} jumps)**\n⚠️ *The notepad format is too long for a single Discord message (Length: ${reply.length}). Please use the web app for full details.*`);
          return;
        }

        await interaction.editReply(reply);
      } catch (err: any) {
        if (err.code === 10062) return;

        console.error("Error handling /route command:", err);
        logDiscordInteraction("ROUTE_ERROR", `Exception in /route handler: ${err.message}`, { stack: err.stack });
        
        try {
          const errorDetail = `**Error:** ${err.message}`;
          const targetUrl = process.env.NAV_SERVICE_URL || process.env.VITE_NAV_SERVICE_URL || "https://nav-service.railway.app";
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply(`❌ **Routing Error**\n${errorDetail}\n*Target: ${targetUrl}*`);
          } else {
            await interaction.reply({ 
              content: `❌ **Routing Error**\n${errorDetail}\n*Target: ${targetUrl}*`, 
              flags: MessageFlags.Ephemeral 
            });
          }
        } catch (replyErr) {
          console.error("Failed to send error reply:", replyErr);
        }
      }
    }

    if (interaction.commandName === "rifthunter") {
      logDiscordInteraction("COMMAND_RECEIVED", "Received /rifthunter command", { user: interaction.user.tag });
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
      } catch (err: any) {
        if (err.code === 10062) {
          console.log("Interaction already handled or expired (rifthunter). Skipping reply.");
          return;
        }
        console.error("Error handling /rifthunter command:", err);
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply("There was an error updating your Rifthunter status.");
          } else {
            await interaction.reply({ 
              content: "There was an error updating your Rifthunter status.", 
              flags: MessageFlags.Ephemeral 
            });
          }
        } catch (replyErr) {
          console.error("Failed to send rifthunter error reply:", replyErr);
        }
      }
    }
  });

  discordClient.login(discordToken);
  registerDiscordCommands();
  
  return discordClient;
}

export async function notifyNewRift(systemId: string, type: string, username: string) {
  if (discordDisabled) {
    logDiscordInteraction("NOTIFY_BLOCKED", `Attempted to notify new rift in ${systemId} but bot is disabled.`);
    return;
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;
  const roleId = process.env.DISCORD_RIFTHUNTER_ROLE_ID;

  if (!token || !channelId) {
    logDiscordInteraction("NOTIFY_ERROR", "Discord token or channel ID missing. Skipping rift notification.");
    console.log("Discord token or channel ID missing. Skipping rift notification.");
    return;
  }

  try {
    logDiscordInteraction("NOTIFY_SENDING", `Sending rift notification for ${systemId} to Discord...`);
    const roleMention = roleId ? `<@&${roleId}>` : "@rifthunter";
    const message = `🛰️ **NEW TANGIBLE RIFT DETECTED**\n\n` +
                    `**System:** ${systemId}\n` +
                    `**Type:** ${type}\n` +
                    `**Reported by:** ${username}\n\n` +
                    `${roleMention} - Prepare for extraction!`;

    const res = await axios.post(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      { content: message },
      {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    logDiscordInteraction("NOTIFY_SUCCESS", `Successfully posted rift notification for ${systemId}`);
  } catch (err: any) {
    logDiscordInteraction("NOTIFY_ERROR", `Failed to send Discord notification: ${err.message}`, { error: err.response?.data || err.message });
    console.error("Error sending Discord notification:", err.response?.data || err.message);
  }
}
