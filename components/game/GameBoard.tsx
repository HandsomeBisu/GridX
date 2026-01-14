import React from 'react';
import { Plane, Lock } from 'lucide-react';
import { BoardCell, Player, GameRoom } from '../../types';
import { BOARD_DATA } from '../../data/boardData';

interface GameBoardProps {
  roomData: GameRoom;
  visualPositions: Record<string, number>;
  currentUser: any;
  ownershipMap: any;
  isSpaceTravelMode: boolean;
  onCellClick: (cellId: number) => void;
  children?: React.ReactNode; // For the CenterPanel
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  roomData, 
  visualPositions, 
  currentUser, 
  ownershipMap, 
  isSpaceTravelMode, 
  onCellClick,
  children 
}) => {

  const getGridPosition = (index: number) => {
    if (index >= 0 && index <= 10) return { row: 11, col: 11 - index };
    if (index >= 11 && index <= 20) return { row: 11 - (index - 10), col: 1 };
    if (index >= 21 && index <= 30) return { row: 1, col: 1 + (index - 20) };
    if (index >= 31 && index <= 39) return { row: 1 + (index - 30), col: 11 };
    return { row: 1, col: 1 };
  };

  const formatPrice = (price?: number) => {
    if (!price) return '0';
    if (price >= 100000000) return `${(price / 100000000).toFixed(1)}억`;
    if (price >= 10000) return `${price / 10000}만`;
    return price.toLocaleString();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-1 md:p-2 overflow-visible">
          <div className="relative aspect-square w-full max-w-[90vh] h-full max-h-[90vh] shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-lg ring-1 ring-gold-500/20 bg-[#0e0e0e]">
             
             {/* Center Content (Passed as children) */}
             {children}

             {/* Grid Cells */}
             <div className="absolute inset-0 grid grid-cols-11 grid-rows-11 gap-[1px] md:gap-0.5 z-10 pointer-events-none">
               {BOARD_DATA.map((cell) => {
                 const { row, col } = getGridPosition(cell.id);
                 const isCorner = cell.type === 'START' || cell.type === 'SPACE' || cell.type === 'ISLAND' || cell.type === 'FUND';
                 const ownership = ownershipMap[cell.id];
                 const isOwnedByMe = ownership?.ownerId === currentUser?.uid;
                 
                 let bgClass = 'bg-[#151515]';
                 if (isCorner) bgClass = 'bg-[#1a1a1a]';
                 if (isOwnedByMe) bgClass = 'bg-blue-900/30'; 
                 else if (ownership) bgClass = 'bg-red-900/20'; 

                 const playersHere = (Object.values(roomData.players) as Player[]).filter((p) => {
                     // Use VISUAL position for animation smoothness
                     const pos = visualPositions[p.id] !== undefined ? visualPositions[p.id] : p.position;
                     return pos === cell.id;
                 });

                 return (
                   <div 
                     key={cell.id}
                     onClick={() => onCellClick(cell.id)}
                     className={`relative flex flex-col items-center justify-between p-0.5 md:p-1 transition-all duration-300 border border-gold-900/40 ${bgClass} pointer-events-auto cursor-pointer group
                        ${isSpaceTravelMode ? 'hover:bg-purple-900/40 hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] z-50' : ''}`}
                     style={{ gridRow: row, gridColumn: col }}
                   >
                      {/* Ownership Dots */}
                      {ownership && !isCorner && (
                        <div className="absolute top-1 left-1 flex flex-col gap-0.5 z-20">
                            {ownership.buildings.hasVilla && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 border border-black" />}
                            {ownership.buildings.hasBuilding && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 border border-black" />}
                            {ownership.buildings.hasHotel && <div className="w-1.5 h-1.5 rounded-full bg-red-500 border border-black" />}
                        </div>
                      )}

                      {/* Players (Halo Effect) */}
                      {playersHere.map((p, idx) => {
                        const isCurrentTurn = roomData.playerOrder[roomData.currentTurnIndex] === p.id;
                        return (
                            <div key={p.id} className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
                                <div 
                                    className={`absolute w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[8px] font-black transition-transform duration-300
                                        ${isCurrentTurn ? 'ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.8)] scale-110 z-50 animate-glow' : ''}
                                    `}
                                    style={{
                                        backgroundColor: p.color, 
                                        transform: `translate(${idx * 4}px, ${idx * -4}px)`,
                                        zIndex: 50 + idx
                                    }}
                                >
                                    {p.islandTurns > 0 && <Lock size={10} className="absolute -top-3 text-red-500 animate-pulse"/>}
                                    {p.name.substring(0, 1)}
                                </div>
                            </div>
                        );
                      })}

                     {/* BG Image */}
                     {(cell.image || cell.countryCode) && (
                        <div className={`absolute inset-0 transition-opacity overflow-hidden ${cell.image ? 'opacity-60' : 'opacity-50'}`}>
                            <img src={cell.image || `https://flagcdn.com/w160/${cell.countryCode}.png`} alt={cell.name} className="w-full h-full object-cover grayscale-[30%]" />
                            <div className="absolute inset-0 bg-black/40" />
                        </div>
                     )}

                     <div className={`relative z-20 w-full h-full flex flex-col ${isCorner ? 'justify-center items-center' : 'justify-between'} pointer-events-none`}>
                       {cell.price !== undefined && cell.price > 0 && !isCorner && (
                         <div className="w-full text-center pt-0.5">
                            <span className={`text-[9px] md:text-[11px] lg:text-xs font-mono font-bold px-1 rounded-sm backdrop-blur-sm border shadow-sm inline-block
                              ${isOwnedByMe ? 'bg-blue-600/80 border-blue-400 text-white' : ownership ? 'bg-red-600/80 border-red-400 text-white' : 'text-gold-300/90 bg-black/70 border-gold-900/30'}`}>
                                {formatPrice(cell.price)}
                            </span>
                         </div>
                       )}
                       {!cell.image && cell.type === 'VEHICLE' && <Plane className="text-blue-400 w-6 h-6 opacity-90 my-auto" />}
                       <div className={`w-full text-center ${isCorner ? 'mt-0' : 'mb-0.5'} ${cell.image ? 'flex-1 flex items-center justify-center' : ''}`}>
                           <span className={`block font-bold leading-none text-shadow-md text-white/95 text-[10px] md:text-xs whitespace-pre-wrap`}>{cell.name}</span>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
  );
};