import { useState } from "react";
import { DebugLabel } from "../../context/DebugContext";
import { RouteForm } from "./route/RouteForm";
import { RouteResults } from "./route/RouteResults";

interface RouteStep {
  name: string;
  dist: number;
  ingame_link: string;
  type: "START" | "DRIVE" | "GATE";
}

export const RouteTab = ({ user, initialData }: { user?: any; initialData?: any }) => {
  const [startSystem, setStartSystem] = useState("");
  const [endSystem, setEndSystem] = useState("");
  const [jumpRange, setJumpRange] = useState("50");
  const [routeMode, setRouteMode] = useState<"fastest" | "cheapest">("fastest");
  const [isLoading, setIsLoading] = useState(false);
  const [route, setRoute] = useState<RouteStep[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const formatSystemName = (val: string) => {
    return val.replace(/[^A-Z0-9-]/gi, "").toUpperCase().slice(0, 8);
  };

  const handleJumpRangeChange = (val: string) => {
    if (val === "") {
      setJumpRange("");
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num) && num > 111) {
      setJumpRange("111");
    } else {
      setJumpRange(val);
    }
  };

  const handleCalculate = async () => {
    if (!startSystem || !endSystem) {
      setError("START AND END SYSTEMS REQUIRED");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRoute(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const baseUrl = "/api/navigation";
      const params = new URLSearchParams({
        start: startSystem.toUpperCase(),
        end: endSystem.toUpperCase(),
        max_ly: jumpRange,
        mode: routeMode,
      });

      console.log(`Requesting route from backend: ${baseUrl}/plan?${params.toString()}`);
      const response = await fetch(`${baseUrl}/plan?${params.toString()}`, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Service Error: ${response.statusText}`);
      }

      const data = await response.json();
      setRoute(data.route);
    } catch (err: any) {
      console.error("Route calculation error:", err);
      if (err.name === 'AbortError') {
        setError("REQUEST TIMED OUT (10S)");
      } else {
        setError(err.message || "FAILED TO CALCULATE ROUTE");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleCopyRoute = () => {
    if (!route) return;

    let header = `<font size="10" color="#ff4c4c4c">&gt;_STELLAR_NETWORK_INITIALIZED<br>&gt;_UPLINK_ESTABLISHED_WITH_EXOTECH_NAV_ARRAY<br>&gt;_STELLAR_ROUTE_CALCULATED<br><br></font>`;
    
    if (routeMode === "cheapest") {
      header = `<font size="14" color="#bfffffff"></font><font size="10" color="#ff4c4c4c">&gt;_STELLAR_NETWORK_INITIALIZED<br>&gt;_UPLINK_ESTABLISHED_WITH_EXOTECH_NAV_ARRAY<br>&gt;_STELLAR_ROUTE_CALCULATED<br><br>&gt;_ROUTE OPTIMISED FOR CHEAPEST ROUTE - </font><font size="10" color="#ff7f0000">CAUTION, YOU ARE POTENTIALLY EXPENDING ADDITIONAL FUEL<br><br></font>`;
    }
    
    const start = `<font size="14" color="#bfffffff">:|&gt;Starting at ${startSystem.toUpperCase()}<br>`;
    
    const steps = route.map((step, index) => {
      if (step.type === "START") return null;
      const prefix = step.type === "GATE" ? ":Z Gate-Jump to " : ":| Drive-Jump to ";
      const link = step.type === "GATE" ? step.name : step.ingame_link;
      return `${prefix}</font><font size="14" color="#ffd98d00">${link}</font><font size="14" color="#bfffffff"> - (${step.dist.toFixed(2)} LY)<br>`;
    }).filter(Boolean).join('');

    const footer = `<br></font><font size="10" color="#ff4c4c4c">&gt;_NAVIGATION_DATA_SYNC_COMPLETE<br>&gt;_SAFE_TRAVELS_PILOT<br></font><font size="10" color="#ff7f7f00">&gt;_THANK_YOU_FOR_ROUTE-PLANNING_WITH_EXOTECH_INDUSTRIAL_TODAY</font>`;

    const fullText = `${header}${start}${steps}${footer}`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DebugLabel label="Route Module" className="flex flex-col h-full p-1 gap-1">
      <div className="flex flex-grow gap-2 min-h-0">
        <RouteForm
          user={user}
          startSystem={startSystem}
          setStartSystem={setStartSystem}
          endSystem={endSystem}
          setEndSystem={setEndSystem}
          jumpRange={jumpRange}
          handleJumpRangeChange={handleJumpRangeChange}
          routeMode={routeMode}
          setRouteMode={setRouteMode}
          handleCalculate={handleCalculate}
          isLoading={isLoading}
          route={route}
          handleCopyRoute={handleCopyRoute}
          copied={copied}
          error={error}
          formatSystemName={formatSystemName}
        />
        <RouteResults route={route} isLoading={isLoading} />
      </div>
    </DebugLabel>
  );
};
