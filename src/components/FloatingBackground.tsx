import { motion } from "motion/react";
import { useState, useEffect } from "react";

export const FloatingBackground = () => {
  const [chars, setChars] = useState<{id: number, char: string, y: number}[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.5875) {
        setChars(prev => [...prev.slice(-20), {
          id: Date.now(),
          char: String.fromCharCode(33 + Math.floor(Math.random() * 94)),
          y: Math.random() * 100
        }]);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {chars.map(c => (
        <motion.div
          key={c.id}
          initial={{ x: '100vw', opacity: 0 }}
          animate={{ x: '-10vw', opacity: 0.26 }}
          transition={{ duration: 15, ease: "linear" }}
          className="absolute text-gray-400 font-mono text-xs"
          style={{ top: `${c.y}%` }}
        >
          {c.char}
        </motion.div>
      ))}
    </div>
  );
};
