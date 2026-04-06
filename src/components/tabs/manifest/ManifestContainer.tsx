import React from "react";
import { DebugLabel } from "../../../context/DebugContext";

export const CornerAccents = ({ color = "var(--color-accent)" }: { color?: string }) => (
  <>
    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l" style={{ borderColor: color }} />
    <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r" style={{ borderColor: color }} />
    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l" style={{ borderColor: color }} />
    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r" style={{ borderColor: color }} />
  </>
);

export const ManifestContainer = ({ title, children, className = "" }: { title: string; children?: React.ReactNode; className?: string }) => (
  <DebugLabel label={title} className={`relative border border-accent/20 bg-bg-main/40 p-2 flex flex-col min-h-0 overflow-hidden ${className}`}>
    <CornerAccents color="var(--color-accent-dim)" />
    <div className="border-b border-accent/10 pb-1 mb-2 flex justify-between items-center shrink-0">
      <span className="text-[10px] uppercase tracking-[0.2em] text-text-main font-bold">{title}</span>
    </div>
    <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar">
      {children}
    </div>
  </DebugLabel>
);
