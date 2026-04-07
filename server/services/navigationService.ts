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

  // Clean inputs - matching the web app's formatting logic
  const formattedStart = start.trim().toUpperCase().replace(/[^A-Z0-9-]/gi, "").slice(0, 8);
  const formattedEnd = end.trim().toUpperCase().replace(/[^A-Z0-9-]/gi, "").slice(0, 8);

  // Ensure we hit the /plan endpoint correctly
  const endpoint = baseUrl.endsWith("/plan") ? baseUrl : `${baseUrl}/plan`;

  console.log(`[NAV SERVICE] Requesting: ${endpoint}?start=${formattedStart}&end=${formattedEnd}&max_ly=${maxLy}&mode=${mode}`);

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
        range: maxLy.toString(), // Fallback for older Python tool versions
        mode
      },
      headers,
      timeout: 20000
    });

    const data = response.data;

    if (data.error) {
      throw new Error(data.error);
    }

    let route = data.route;
    const total_distance = data.total_distance || 0;

    // Fallback if the service returns a simple path array
    if (!route && data.path && Array.isArray(data.path)) {
      route = data.path.map((name: string, index: number) => ({
        name,
        dist: index === 0 ? 0 : (total_distance / (data.path.length - 1) || 50),
        ingame_link: `https://exotech.industrial/system/${name}`,
        type: index === 0 ? "START" : "DRIVE"
      }));
    }

    if (!route || !Array.isArray(route)) {
      throw new Error("Navigation service returned a successful response but no route data was found.");
    }

    // Normalize the route data
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
    // Extract the most useful error message
    const message = err.response?.data?.error || err.response?.data?.message || err.message;
    console.error(`[NAV SERVICE ERROR] ${message}`);
    throw new Error(message);
  }
}
