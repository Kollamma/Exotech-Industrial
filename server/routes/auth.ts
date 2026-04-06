import { Router } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../db";

export const authRouter = Router();

function parseDiscordUsername(rawUsername: string): string {
  // Example: "MyName {EXTI} (UTC +5)" -> "MyName"
  return rawUsername
    .replace(/\{EXTI\}/g, "")
    .replace(/\(UTC\s*[+-]?\d+\)/g, "")
    .trim();
}

// API Route for Auth URL
authRouter.get("/url", (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const baseUrl = process.env.APP_URL?.replace(/\/$/, "");
  
  if (!clientId) {
    console.error("DISCORD_CLIENT_ID is not set in environment variables");
    return res.status(500).json({ error: "Discord Client ID is not configured" });
  }

  if (!baseUrl) {
    console.error("APP_URL is not set in environment variables");
    return res.status(500).json({ error: "Application URL is not configured" });
  }

  const redirectUri = `${baseUrl}/auth/callback`;
  console.log("Generating Discord Auth URL with redirect_uri:", redirectUri);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email guilds guilds.members.read",
  });

  const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  res.json({ url: authUrl });
});

// Auth Callback (mounted at /auth/callback in server.ts, but we can mount it here if we update server.ts, wait, server.ts mounts authRouter at /api/auth. So this would be /api/auth/callback. But Discord might be configured for /auth/callback. Let's handle both or just export a separate router for the root callback.)
// Actually, let's just make it /callback and we will mount it at /auth in server.ts or keep it as /api/auth/callback and update Discord? No, we can't update Discord config easily. Let's export a separate router for root level or just put it in server.ts.
// I will put the callback logic here and we can mount it at /auth in server.ts.
export const rootAuthRouter = Router();

rootAuthRouter.get("/callback", async (req, res) => {
  const { code } = req.query;
  console.log("Auth callback received with code:", code ? "PRESENT" : "MISSING");
  if (!code) return res.status(400).send("No code provided");

  const guildId = process.env.DISCORD_GUILD_ID;
  const roleId = process.env.DISCORD_ROLE_ID;

  if (!guildId || !roleId) {
    return res.status(500).send("DISCORD_GUILD_ID or DISCORD_ROLE_ID not configured");
  }

  try {
    const baseUrl = process.env.APP_URL?.replace(/\/$/, "");
    const redirectUri = `${baseUrl}/auth/callback`;
    console.log("Exchanging code for token with redirect_uri:", redirectUri);

    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code: code.toString(),
        redirect_uri: redirectUri,
      }).toString(),
      { 
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000
      }
    );

    const { access_token } = tokenResponse.data;
    console.log("Access token received successfully");

    // Get user info
    console.log("Fetching user info from Discord...");
    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` },
      timeout: 10000
    });
    console.log("User info received for:", userResponse.data.username);

    // Parse username
    const rawUsername = userResponse.data.global_name || userResponse.data.username;
    userResponse.data.parsed_username = parseDiscordUsername(rawUsername);

    // Get guild member info
    console.log(`Checking guild membership for guild: ${guildId}...`);
    let memberData;
    try {
      const memberResponse = await axios.get(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
        headers: { Authorization: `Bearer ${access_token}` },
        timeout: 10000
      });
      memberData = memberResponse.data;
      console.log("Guild member info received");
    } catch (e: any) {
      console.log("User is not in the guild or error fetching member info:", e.message);
      return res.send(`
        <html>
          <body style="background: #000; color: #fff; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'ACCESS_DENIED: GUILD_MEMBERSHIP_REQUIRED' }, '*');
                setTimeout(() => window.close(), 3000);
              }
            </script>
            <p style="color: #ff4444; font-weight: bold; letter-spacing: 0.2em;">ACCESS DENIED</p>
            <p style="font-size: 10px; opacity: 0.6;">GUILD MEMBERSHIP REQUIRED</p>
          </body>
        </html>
      `);
    }

    // Check for role
    const hasRole = memberData.roles.includes(roleId);
    console.log(`User has required role (${roleId}):`, hasRole);
    if (!hasRole) {
      return res.send(`
        <html>
          <body style="background: #000; color: #fff; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'ACCESS_DENIED: INSUFFICIENT_CLEARANCE_LEVEL' }, '*');
                setTimeout(() => window.close(), 3000);
              }
            </script>
            <p style="color: #ff4444; font-weight: bold; letter-spacing: 0.2em;">ACCESS DENIED</p>
            <p style="font-size: 10px; opacity: 0.6;">INSUFFICIENT CLEARANCE LEVEL</p>
          </body>
        </html>
      `);
    }

    // Success
    console.log("Authentication successful, updating database...");
    let supabaseToken = "";
    try {
      // Check if user already exists to preserve rank
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("rank")
        .eq("uid", userResponse.data.id)
        .single();

      let rank = 0;
      if (existingUser) {
        rank = existingUser.rank;
      }

      // Always ensure the primary user is superadmin if they log in (Peter.Young.000@gmail.com)
      if (userResponse.data.email === "Peter.Young.000@gmail.com" && userResponse.data.verified) {
        rank = 2;
      }

      const { data: fullUser, error: upsertError } = await supabaseAdmin.from("users").upsert(
        {
          uid: userResponse.data.id,
          username: userResponse.data.parsed_username,
          discord_auth_token: access_token,
          rank: rank,
        },
        { onConflict: "uid" }
      ).select().single();

      if (upsertError) {
        console.error("Supabase upsert error:", upsertError);
        throw upsertError;
      }

      // Map Supabase user to the format expected by the frontend
      const frontendUser = {
        id: fullUser.uid,
        username: fullUser.username,
        rank: fullUser.rank,
        ship_type: fullUser.ship_type,
        industry_class: fullUser.industry_class,
        home_system: fullUser.home_system,
        availability_mask: fullUser.availability_mask,
        timezone: fullUser.timezone,
      };
      
      // Set session cookie
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "none" as const,
        signed: true,
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      };
      console.log(`Setting signed user_uid cookie for UID: ${userResponse.data.id} with options:`, { ...cookieOptions, signed: "HIDDEN" });
      res.cookie("user_uid", userResponse.data.id, cookieOptions);

      // Generate JWT for Supabase
      const payload = {
        sub: userResponse.data.id,
        role: "authenticated",
        iss: "supabase",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      };
      supabaseToken = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET!);

      console.log("Sending success message to popup...");
      res.send(`
        <html>
          <body style="background: #000; color: #fff; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'OAUTH_AUTH_SUCCESS', 
                    user: ${JSON.stringify(frontendUser)}, 
                    member: ${JSON.stringify(memberData)},
                    token: '${supabaseToken}'
                  }, '*');
                  window.close();
                } else {
                  // Fallback if opener is lost
                  window.location.href = '/';
                }
              } catch (e) {
                console.error("Popup communication error:", e);
                window.location.href = '/';
              }
            </script>
            <p style="color: #00ff00; font-weight: bold; letter-spacing: 0.2em;">AUTHENTICATION SUCCESSFUL</p>
            <p style="font-size: 10px; opacity: 0.6;">SYNCHRONIZING NEURAL LINK...</p>
          </body>
        </html>
      `);
      return;
    } catch (upsertError) {
      console.error("Supabase Upsert Error:", upsertError);
      throw upsertError;
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.error_description || error.response?.data?.error || error.message;
    console.error("OAuth Error:", errorMsg);
    res.status(500).send(`
      <html>
        <body style="background: #000; color: #fff; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
              setTimeout(() => window.close(), 5000);
            }
          </script>
          <p style="color: #ff4444; font-weight: bold; letter-spacing: 0.2em;">AUTHENTICATION FAILED</p>
          <p style="font-size: 10px; opacity: 0.6;">${errorMsg}</p>
        </body>
      </html>
    `);
  }
});

// API Route to check session
authRouter.get("/me", async (req, res) => {
  console.log("--- Auth Check Start ---");
  console.log("Raw Cookie Header:", req.headers.cookie);
  console.log("Signed Cookies:", req.signedCookies);
  console.log("Unsigned Cookies:", req.cookies);

  const uid = req.signedCookies.user_uid;
  console.log("Extracted user_uid from signed cookies:", uid);

  if (!uid) {
    console.log("Auth Check: No signed user_uid cookie found");
    if (req.cookies.user_uid) {
      console.log("Auth Check: Found unsigned user_uid cookie. This suggests a signature mismatch or that the cookie was set without a signature.");
    }
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    console.log(`Auth Check: Fetching user data from Supabase for UID: ${uid}`);
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("uid", uid)
      .single();

    if (error || !user) {
      console.log(`Auth Check: User not found in database or error fetching user for UID: ${uid}`, error?.message);
      return res.status(401).json({ error: "User not found" });
    }

    console.log("Auth Check: Session verified successfully for user:", user.username);
    res.json({
      id: user.uid,
      username: user.username,
      rank: user.rank,
      ship_type: user.ship_type,
      industry_class: user.industry_class,
      home_system: user.home_system,
      availability_mask: user.availability_mask,
      timezone: user.timezone,
    });
  } catch (error: any) {
    console.error("Auth Check Exception:", error.message);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    console.log("--- Auth Check End ---");
  }
});

// API Route to logout
authRouter.post("/logout", (req, res) => {
  res.clearCookie("user_uid", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ success: true });
});
