import React, { useEffect, useState } from 'react';

export interface FloatingTextData {
  id: string;
  x: number; // percentage (0-100) on board
  y: number; // percentage (0-100) on board
  text: string;
  color: string;
}

interface FloatingEffectsProps {
  items: FloatingTextData[];
}

export const FloatingEffects: React.FC<FloatingEffectsProps> = ({ items }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-[100]">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute font-black text-2xl md:text-3xl text-stroke shadow-sm animate-float-up-fade"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            color: item.color,
            textShadow: '0 2px 4px rgba(0,0,0,0.8), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            whiteSpace: 'nowrap'
          }}
        >
          {item.text}
        </div>
      ))}
      <style>{`
        @keyframes floatUpFade {
            0% { transform: translateY(0) scale(0.5); opacity: 0; }
            20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
            80% { transform: translateY(-50px) scale(1); opacity: 1; }
            100% { transform: translateY(-80px) scale(0.8); opacity: 0; }
        }
        .animate-float-up-fade {
            animation: floatUpFade 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};