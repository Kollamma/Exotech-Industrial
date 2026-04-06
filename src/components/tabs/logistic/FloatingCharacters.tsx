import { useState, useEffect } from "react";
import { motion } from "motion/react";

export const FloatingCharacters = () => {
  const [chars, setChars] = useState<{ id: number; char: string; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    const symbols = "01X/?!@#$%&*<>[]{}|\\".split("");
    const initialChars = [...Array(10)].map((_, i) => ({
      id: i,
      char: symbols[Math.floor(Math.random() * symbols.length)],
      x: Math.random() * 60 + 20,
      y: Math.random() * 60 + 20,
      delay: Math.random() * 5
    }));
    setChars(initialChars);

    const interval = setInterval(() => {
      setChars(prev => prev.map(c => Math.random() > 0.8 ? {
        ...c,
        char: symbols[Math.floor(Math.random() * symbols.length)],
        x: Math.random() * 60 + 20,
        y: Math.random() * 60 + 20
      } : c));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {chars.map((c) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, delay: c.delay }}
          className="absolute text-[8px] font-mono text-accent/50"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
        >
          {c.char}
        </motion.div>
      ))}
    </div>
  );
};
