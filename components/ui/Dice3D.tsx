import React, { useEffect, useState } from 'react';

interface Dice3DProps {
  value: number; // 1-6
  rolling: boolean;
}

export const Dice3D: React.FC<Dice3DProps> = ({ value, rolling }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!rolling) {
      // Set rotation based on value
      switch (value) {
        case 1: setRotation({ x: 0, y: 0 }); break;
        case 2: setRotation({ x: 0, y: -90 }); break;
        case 3: setRotation({ x: 0, y: -180 }); break;
        case 4: setRotation({ x: 0, y: 90 }); break;
        case 5: setRotation({ x: -90, y: 0 }); break;
        case 6: setRotation({ x: 90, y: 0 }); break;
        default: setRotation({ x: 0, y: 0 }); break;
      }
    }
  }, [value, rolling]);

  const renderFace = (num: number) => {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <span className="text-4xl font-black text-gold-500 drop-shadow-md select-none">{num}</span>
        </div>
    );
  };

  return (
    <div className="scene w-16 h-16">
      <div 
        className={`cube ${rolling ? 'rolling' : ''}`}
        style={{ 
           transform: rolling 
             ? undefined 
             : `translateZ(-32px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` 
        }}
      >
        <div className="cube__face cube__face--1">{renderFace(1)}</div>
        <div className="cube__face cube__face--2">{renderFace(2)}</div>
        <div className="cube__face cube__face--3">{renderFace(3)}</div>
        <div className="cube__face cube__face--4">{renderFace(4)}</div>
        <div className="cube__face cube__face--5">{renderFace(5)}</div>
        <div className="cube__face cube__face--6">{renderFace(6)}</div>
      </div>
    </div>
  );
};