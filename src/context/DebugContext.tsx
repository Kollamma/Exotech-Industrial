import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DebugContextType {
  debugMode: boolean;
  toggleDebugMode: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const DebugProvider = ({ children }: { children: ReactNode }) => {
  const [debugMode, setDebugMode] = useState(false);

  const toggleDebugMode = () => {
    setDebugMode((prev) => !prev);
  };

  return (
    <DebugContext.Provider value={{ debugMode, toggleDebugMode }}>
      {children}
    </DebugContext.Provider>
  );
};

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};

export const DebugLabel = React.forwardRef<HTMLDivElement, { label: string; children: React.ReactNode; className?: string }>(
  ({ label, children, className = "" }, ref) => {
    const { debugMode } = useDebug();

    return (
      <div className={`relative ${className}`} ref={ref}>
        {debugMode && (
          <div className="absolute -top-2 -left-2 z-[9999] bg-blue-600 text-white text-[11px] px-1.5 py-1 rounded-sm font-mono uppercase pointer-events-none whitespace-nowrap border border-white/20 shadow-lg">
            {label}
          </div>
        )}
        {children}
      </div>
    );
  }
);
