import { Cpu, Database, ShieldCheck, Bug, Settings, Eye, Zap, Terminal } from "lucide-react";
import { DebugLabel, useDebug } from "../context/DebugContext";
import { useTheme } from "../context/ThemeContext";
import { DiscordDevLogModal } from "./DiscordDevLogModal";
import { useState } from "react";

export const Footer = ({ user, onOpenUserManagement, onLogout }: { user: any; onOpenUserManagement: () => void; onLogout: () => void }) => {
  const { debugMode, toggleDebugMode } = useDebug();
  const { theme, toggleTheme } = useTheme();
  const [isDiscordLogOpen, setIsDiscordLogOpen] = useState(false);

  const isSuperadmin = user && user.rank >= 2;

  const handleRiftTest = async () => {
    try {
      const res = await fetch("/api/discord/rift-test", { 
        method: "POST",
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send rift test");
      }
      alert("Rifthunter test message sent!");
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message}`);
    }
  };

  return (
    <DebugLabel label="Footer Container" className="fixed bottom-0 left-0 w-full px-6 py-0.5 z-20 border-t border-accent/20 bg-bg-main/80 backdrop-blur-md">
      <footer className="flex items-center justify-between">
        <div className="flex gap-8">
          {[
            { label: "Neural Link", value: "98.4%", icon: Cpu },
            { label: "Data Stream", value: "Active", icon: Database },
            { label: "Security", value: "Level 4", icon: ShieldCheck },
          ].map((stat, i) => (
            <DebugLabel key={i} label={`Stat: ${stat.label}`}>
              <div className="flex items-center gap-2 border border-accent/10 px-3 py-1.5">
                <stat.icon className="w-4 h-4 text-text-accent/60" />
                <div className="flex items-center gap-2">
                  <div className="text-[9px] uppercase tracking-widest text-text-dim">{stat.label}</div>
                  <div className="text-xs font-bold text-text-main">{stat.value}</div>
                </div>
              </div>
            </DebugLabel>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[8px] uppercase tracking-widest text-text-dim">
            Exotech Industrial Protocol v4.2
          </div>
          
          {isSuperadmin && (
            <DebugLabel label="Personnel Management">
              <button
                onClick={onOpenUserManagement}
                className="p-1.5 rounded-full bg-accent/10 text-text-accent hover:bg-accent/20 transition-all duration-300"
                title="Personnel Management"
              >
                <Settings size={14} className="animate-spin-slow" />
              </button>
            </DebugLabel>
          )}

          <DebugLabel label="Theme Toggle">
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-full transition-all duration-300 bg-accent-muted text-text-accent hover:bg-accent hover:text-bg-main`}
              title={`Switch Theme (Current: ${theme})`}
            >
              <Eye size={14} />
            </button>
          </DebugLabel>

          <DebugLabel label="Discord Log">
            <button
              onClick={() => setIsDiscordLogOpen(true)}
              className="p-1.5 rounded-full transition-all duration-300 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40"
              title="Discord Interaction Monitor"
            >
              <Terminal size={14} />
            </button>
          </DebugLabel>

          <DebugLabel label="Rift Test">
            <button
              onClick={handleRiftTest}
              className="p-1.5 rounded-full transition-all duration-300 bg-purple-900/20 text-purple-400 hover:bg-purple-900/40"
              title="Rift Hunter Test"
            >
              <Zap size={14} />
            </button>
          </DebugLabel>

          <DebugLabel label="Debug Toggle">
            <button
              onClick={toggleDebugMode}
              className={`p-1.5 rounded-full transition-all duration-300 ${
                debugMode 
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                  : 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40'
              }`}
              title="Toggle Programmer View"
            >
              <Bug size={14} />
            </button>
          </DebugLabel>

          <div className="h-6 w-px bg-accent/20 mx-2"></div>

          <DebugLabel label="Logout Button">
            <button 
              onClick={onLogout}
              className="text-[9px] uppercase tracking-[0.2em] text-text-dim hover:text-red-500 transition-colors font-bold px-2"
            >
              [ Terminate Session ]
            </button>
          </DebugLabel>
        </div>
      </footer>
      <DiscordDevLogModal 
        isOpen={isDiscordLogOpen} 
        onClose={() => setIsDiscordLogOpen(false)} 
      />
    </DebugLabel>
  );
};
