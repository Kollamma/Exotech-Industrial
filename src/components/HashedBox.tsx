import { useState, useEffect } from "react";

export const HashedBox = () => {
  const [lines] = useState<string[]>(() => 
    Array.from({ length: 4 }, () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      return Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    })
  );
  const [offsets, setOffsets] = useState<number[]>([0, 2, 5, 1]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffsets(prev => prev.map(o => (o + 1) % 15));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-1 font-mono text-[12px] text-white opacity-80">
      {lines.map((line, i) => {
        const totalWidth = 12;
        const prefix = "-".repeat(offsets[i]);
        const suffix = "-".repeat(Math.max(0, totalWidth - line.length - offsets[i]));
        return (
          <div key={i} className="flex tracking-widest">
            <span className="opacity-40">{prefix}</span>
            <span className="font-bold">{line}</span>
            <span className="opacity-40">{suffix}</span>
          </div>
        );
      })}
    </div>
  );
};
