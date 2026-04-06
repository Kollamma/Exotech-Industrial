import { motion } from "motion/react";

interface System {
  name: string;
  grid_x: number;
  grid_y: number;
}

interface SystemNodeProps {
  sys: System;
  cellSize: number;
  padding: number;
  isSearchResult: boolean;
  isSelected: boolean;
  zoom: number;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: () => void;
}

export const SystemNode = ({ sys, cellSize, padding, isSearchResult, isSelected, zoom, onClick, onContextMenu }: SystemNodeProps) => {
  // Scale font size as we zoom out to keep labels legible
  // At zoom 1.0, font is 11px. At zoom 0.2, font is ~24px.
  const dynamicFontSize = Math.min(24, Math.max(11, 11 / Math.sqrt(zoom)));

  return (
    <motion.div
      key={sys.name}
      layoutId={sys.name}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu();
      }}
      className="absolute group system-node cursor-pointer z-10"
      style={{
        left: sys.grid_x * cellSize + padding,
        top: sys.grid_y * cellSize + padding,
        width: cellSize,
        height: cellSize
      }}
    >
      {/* Dot */}
      <div className={`
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-4 h-4 rounded-full transition-all duration-300
        ${isSelected ? 'bg-white scale-150 shadow-[0_0_20px_white]' : isSearchResult ? 'bg-white scale-125 shadow-[0_0_15px_white]' : 'bg-accent group-hover:scale-125 shadow-[0_0_10px_rgba(255,99,33,0.3)]'}
      `} />

      {/* Name */}
      <div 
        className={`
          absolute top-[calc(50%+14px)] left-1/2 -translate-x-1/2
          font-display uppercase tracking-widest text-center transition-colors whitespace-nowrap
          ${isSelected || isSearchResult ? 'text-white font-bold' : 'text-text-dim group-hover:text-text-main'}
        `}
        style={{ fontSize: `${dynamicFontSize}px` }}
      >
        {sys.name}
      </div>
    </motion.div>
  );
};
