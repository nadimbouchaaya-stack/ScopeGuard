"use client";

import { useState, useEffect } from "react";

interface CashDrop {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

export default function CashRain({ onComplete, emoji = "\u{1F4B5}" }: { onComplete: () => void; emoji?: string }) {
  const [drops] = useState<CashDrop[]>(() =>
    Array.from({ length: 200 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 1.5,
      size: 20 + Math.random() * 24,
      rotation: Math.random() * 360,
    }))
  );

  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {drops.map((drop) => (
        <div
          key={drop.id}
          className="absolute animate-cash-fall"
          style={{
            left: `${drop.left}%`,
            top: -50,
            fontSize: drop.size,
            animationDelay: `${drop.delay}s`,
            animationDuration: `${drop.duration}s`,
            ["--rotation" as string]: `${drop.rotation}deg`,
          }}
        >
          {emoji}
        </div>
      ))}
      <style jsx>{`
        @keyframes cash-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateY(105vh) rotate(var(--rotation)); opacity: 0; }
        }
        .animate-cash-fall { animation: cash-fall linear forwards; }
      `}</style>
    </div>
  );
}
