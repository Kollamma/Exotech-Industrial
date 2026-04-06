import { useState, useEffect } from "react";

export const CornerAccents = ({ color = "#050505" }: { color?: string }) => (
  <>
    <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l" style={{ borderColor: color }} />
    <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r" style={{ borderColor: color }} />
    <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l" style={{ borderColor: color }} />
    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r" style={{ borderColor: color }} />
  </>
);

export const VectorGrid = () => {
  const [chars, setChars] = useState<string[]>([]);
  const gridWidth = 40;
  const gridHeight = 12;

  useEffect(() => {
    const generateChars = () => {
      const newChars = [];
      for (let i = 0; i < gridWidth * gridHeight; i++) {
        if (Math.random() > 0.95) {
          newChars.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
        } else {
          newChars.push("-");
        }
      }
      return newChars;
    };

    setChars(generateChars());

    const interval = setInterval(() => {
      setChars(prev => prev.map(c => {
        if (Math.random() > 0.98) {
          return String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
        if (c !== "-" && Math.random() > 0.7) {
          return "-";
        }
        return c;
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-[repeat(40,minmax(0,1fr))] gap-0.5 font-mono text-[8px] leading-none select-none">
      {chars.map((char, i) => {
        const isGrey = Math.random() > 0.9;
        return (
          <span 
            key={i} 
            className={isGrey ? "text-zinc-700" : "text-text-accent/40"}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};
