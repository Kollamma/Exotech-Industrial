import { useState, useEffect } from "react";
import { motion } from "motion/react";

const CONNECTION_LINE_THICKNESS = 4;

export const ConnectionLine = ({ start, end }: { start: { x: number, y: number }, end: { x: number, y: number } }) => {
  const [groups, setGroups] = useState<{ id: number; text: string; offset: number; speed: number }[]>([]);
  const [time, setTime] = useState(0);
  
  useEffect(() => {
    const symbols = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/?!@#$%&*<>[]{}|\\".split("");
    const alphanum = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    
    const baseSpeed = 0.05 + Math.random() * 0.02;
    
    const initialGroups = [...Array(10)].map((_, i) => {
      const rand = Math.random();
      let text = "";
      let speedMultiplier = 1;
      
      if (rand < 0.3) {
        text = symbols[Math.floor(Math.random() * symbols.length)];
        speedMultiplier = 1;
      } else if (rand < 0.5) {
        text = symbols[Math.floor(Math.random() * symbols.length)] + symbols[Math.floor(Math.random() * symbols.length)];
        speedMultiplier = 2;
      } else if (rand < 0.7) {
        text = [...Array(3)].map(() => symbols[Math.floor(Math.random() * symbols.length)]).join("");
        speedMultiplier = 3;
      } else {
        const suffix = [...Array(5)].map(() => alphanum[Math.floor(Math.random() * alphanum.length)]).join("");
        text = `>_${suffix}`;
        speedMultiplier = 9;
      }

      return {
        id: i,
        text,
        offset: Math.random() * Math.PI * 2,
        speed: baseSpeed * speedMultiplier
      };
    });
    setGroups(initialGroups);

    let frame: number;
    const animate = (t: number) => {
      setTime(t / 1000);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / length;
  const ny = dx / length;
  const offsetDistance = (CONNECTION_LINE_THICKNESS / 2) + 5;

  return (
    <g>
      <motion.line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="currentColor"
        strokeWidth={CONNECTION_LINE_THICKNESS * 3}
        strokeLinecap="round"
        className="text-accent/10"
        animate={{ 
          opacity: [0.05, 0.2, 0.05],
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="currentColor"
        strokeWidth={CONNECTION_LINE_THICKNESS}
        strokeLinecap="round"
        className="text-accent/20"
      />
      
      {groups.map(g => {
        const sinVal = Math.sin(time * g.speed + g.offset);
        const cosVal = Math.cos(time * g.speed + g.offset);
        const progress = (sinVal + 1) / 2;
        
        const directionOffset = cosVal > 0 ? 1 : -1;
        
        const x = start.x + dx * progress + nx * directionOffset * offsetDistance;
        const y = start.y + dy * progress + ny * directionOffset * offsetDistance;
        
        return (
          <text
            key={g.id}
            x={x}
            y={y}
            className="fill-slate-300 text-[6px] font-mono opacity-60"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {g.text}
          </text>
        );
      })}
    </g>
  );
};
