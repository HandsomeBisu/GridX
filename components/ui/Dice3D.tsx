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

  const renderDots = (num: number) => {
    // Simplified rendering for dots, using flex/grid inside faces would be cleaner but verbose here
    // For now, we use the number text or simple dots arrangement
    const dots = [];
    for(let i=0; i<num; i++) {
        dots.push(<div key={i} className="dot m-1"></div>);
    }
    return <div className="flex flex-wrap justify-center w-8 h-8 content-center">{dots}</div>;
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
        <div className="cube__face cube__face--1">{renderDots(1)}</div>
        <div className="cube__face cube__face--2">{renderDots(2)}</div>
        <div className="cube__face cube__face--3">{renderDots(3)}</div>
        <div className="cube__face cube__face--4">{renderDots(4)}</div>
        <div className="cube__face cube__face--5">{renderDots(5)}</div>
        <div className="cube__face cube__face--6">{renderDots(6)}</div>
      </div>
    </div>
  );
};