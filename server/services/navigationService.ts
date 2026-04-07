import axios from "axios";

export interface RouteStep {
  name: string;
  dist: number;
  ingame_link: string;
  type: "START" | "DRIVE" | "GATE";
}

export interface NavigationResult {
  route: RouteStep[];
  total_distance: number;
}

export async function calculateRoute(start: string, end: string, maxLy: string | number, mode: string): Promise<NavigationResult> {
  const rawBaseUrl = process.env.NAV_SERVICE_URL || process.env.VITE_NAV_SERVICE_URL || "https://nav-service.railway.app";
  let baseUrl = rawBaseUrl.replace(/\/+$/, "");
  const password = process.env.NAV_SERVICE_PASSWORD;

  // Format system names exactly like the frontend
  const formatSystem = (val: string) => val.trim().replace(/[^A-Z0-9-]/gi, "").toUpperCase().slice(0, 8);
  const formattedStart = formatSystem(start);
  const formattedEnd = formatSystem(end);

  // Handle case where user might have included /plan in the URL
  const endpoint = baseUrl.endsWith("/plan") ? baseUrl : `${baseUrl}/plan`;

  console.log(`Navigation Service: Requesting route from ${endpoint} for ${formattedStart} -> ${formattedEnd}`);

  const headers: Record<string, string> = {};
  if (password) {
    headers["X-Navigation-Password"] = password;
    headers["Authorization"] = `Bearer ${password}`;
  }

  try {
    const response = await axios.get(endpoint, {
      params: {
        start: formattedStart,
        end: formattedEnd,
        max_ly: maxLy.toString(),
        mode
      },
      headers,
      timeout: 20000 // Increased timeout to 20s
    });

    const data = response.data;

    if (data.error) {
      throw new Error(data.error);
    }

    let route = data.route;
    const total_distance = data.total_distance || 0;

    if (!route && data.path && Array.isArray(data.path)) {
      route = data.path.map((name: string, index: number) => ({
        name,
        dist: index === 0 ? 0 : (total_distance / (data.path.length - 1) || 50),
        ingame_link: `https://exotech.industrial/system/${name}`,
        type: index === 0 ? "START" : "DRIVE"
      }));
    }

    if (!route || !Array.isArray(route)) {
      throw new Error("Invalid response from navigation service: No route found");
    }

    // Ensure all steps have ingame_link and proper formatting
    const normalizedRoute = route.map((step: any) => ({
      name: step.name || step.system_id || step.systemName,
      dist: typeof step.dist === 'number' ? step.dist : 0,
      ingame_link: step.ingame_link || `https://exotech.industrial/system/${step.name || step.system_id || step.systemName}`,
      type: step.type || "DRIVE"
    }));

    return {
      route: normalizedRoute,
      total_distance
    };
  } catch (err: any) {
    if (err.response?.data?.error) {
      throw new Error(err.response.data.error);
    }
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error("Navigation service timed out after 20 seconds.");
    }
    throw err;
  }
}
