import { useState } from "react";
import { ScoutTab } from "./tabs/ScoutTab";
import { OperationTab } from "./tabs/OperationTab";
import { RouteTab } from "./tabs/RouteTab";
import { AtlasTab } from "./tabs/AtlasTab";
import { ManifestTab } from "./tabs/ManifestTab";
import { LogisticTab } from "./tabs/LogisticTab";
import { IntelTab } from "./tabs/IntelTab";
import { TribeTab } from "./tabs/TribeTab";
import { LoadingState } from "./LoadingState";
import { DebugLabel } from "../context/DebugContext";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { MobileHome } from "./MobileHome";

const tabs = [
  { name: "Scouting", component: ScoutTab },
  { name: "Operations", component: OperationTab },
  { name: "Route-Planner", component: RouteTab },
  { name: "Map", component: AtlasTab },
  { name: "Wallet", component: ManifestTab },
  { name: "Logistic", component: LogisticTab },
  { name: "Intel", component: IntelTab },
  { name: "Tribe", component: TribeTab },
];

export const DashboardTabs = ({ user, onUpdate }: { user: any; onUpdate?: (data: any) => void }) => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['Scouting', 'Operations', 'Route-Planner', 'Map', 'Wallet', 'Logistic']));
  const [isLoading, setIsLoading] = useState(false);
  const [tabData, setTabData] = useState<any>(null);
  const [mobileView, setMobileView] = useState<"home" | "scouting" | "wallet">("home");

  const ActiveComponent = activeTab.component;

  const handleTabClick = async (tab: typeof tabs[0]) => {
    if ((tab.name === 'Intel' || tab.name === 'Tribe') && !loadedTabs.has(tab.name)) {
      setIsLoading(true);
      setActiveTab(tab);
      setTabData(null);
      
      const apiPath = tab.name === 'Intel' ? '/api/intel-tabs' : '/api/tribe-tabs';
      
      // Start fetching data
      const dataPromise = fetch(apiPath, { credentials: 'include' }).then(res => res.json());
      
      // Wait for at least 2 seconds
      const delayPromise = new Promise(resolve => setTimeout(resolve, 2000));
      
      const data = await Promise.all([dataPromise, delayPromise]).then(res => res[0]);
      
      setTabData(data);
      setLoadedTabs(prev => new Set(prev).add(tab.name));
      setIsLoading(false);
    } else {
      setActiveTab(tab);
      setTabData(null);
    }
  };

  return (
    <DebugLabel label="Dashboard Container" className="w-full h-full">
      {/* Mobile View */}
      <div className="md:hidden w-full h-full flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {mobileView === "home" && (
            <motion.div
              key="mobile-home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <MobileHome user={user} onUpdate={onUpdate} setMobileView={setMobileView} />
            </motion.div>
          )}
          {mobileView === "scouting" && (
            <motion.div
              key="mobile-scouting"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-accent/20">
                <button onClick={() => setMobileView("home")} className="text-text-dim">
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-text-main italic">Scouting</h2>
                <button onClick={() => setMobileView("wallet")} className="text-text-dim">
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto">
                <ScoutTab isMobile />
              </div>
            </motion.div>
          )}
          {mobileView === "wallet" && (
            <motion.div
              key="mobile-wallet"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-accent/20">
                <button onClick={() => setMobileView("scouting")} className="text-text-dim">
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-text-main italic">Wallet</h2>
                <div className="w-5" />
              </div>
              <div className="flex-grow overflow-y-auto">
                <ManifestTab user={user} isMobile />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex w-full h-full border border-accent/20 bg-bg-main/50 backdrop-blur-md p-0.5 mx-2 max-w-[calc(100vw-1rem)] flex-col">
        <div className="flex justify-between border-b border-accent/20 mb-0.5 shrink-0">
          {tabs.map((tab) => (
            <DebugLabel key={tab.name} label={`Tab: ${tab.name}`}>
              <button
                onClick={() => handleTabClick(tab)}
                className={`px-6 py-2 text-xs uppercase tracking-widest transition-colors ${
                  activeTab.name === tab.name ? "text-text-accent border-b-2 border-accent" : "text-text-dim hover:text-text-main"
                }`}
              >
                {tab.name}
              </button>
            </DebugLabel>
          ))}
        </div>
        <div className="flex-grow min-h-0">
          {isLoading ? <LoadingState /> : <ActiveComponent user={user} initialData={tabData || undefined} />}
        </div>
      </div>
    </DebugLabel>
  );
};
