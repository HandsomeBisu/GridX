import React, { useEffect, useState } from 'react';
import { Play, Lock, Dice5, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dice3D } from '../ui/Dice3D';
import { GameRoom, Player } from '../../types';

interface GameCenterPanelProps {
  roomData: GameRoom;
  currentUser: any;
  isMyTurn: boolean;
  isSpaceTravelMode: boolean;
  isStuckOnIsland: boolean;
  isAnimating: boolean;
  isProcessing?: boolean;
  isModalOpen?: boolean; // New prop to pause timer
  diceRolling: boolean;
  shownDiceValues: [number, number] | null;
  onRollDice: () => void;
  onEscapeIsland: () => void;
  onStartGame: () => void;
  isWaiting: boolean;
}

export const GameCenterPanel: React.FC<GameCenterPanelProps> = ({
  roomData,
  currentUser,
  isMyTurn,
  isSpaceTravelMode,
  isStuckOnIsland,
  isAnimating,
  isProcessing = false,
  isModalOpen = false,
  diceRolling,
  shownDiceValues,
  onRollDice,
  onEscapeIsland,
  onStartGame,
  isWaiting
}) => {
  const currentTurnPlayer = roomData.players[roomData.playerOrder[roomData.currentTurnIndex]];
  const myPlayer = currentUser ? roomData.players[currentUser.uid] : null;
  
  // Bug Fix: Check if I already acted this turn (to prevent re-roll on refresh/resize)
  const lastAction = roomData.lastAction;
  const hasAlreadyActed = isMyTurn && 
      lastAction?.subjectId === currentUser?.uid && 
      lastAction?.type !== 'START_TURN';

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [percent, setPercent] = useState(100);

  useEffect(() => {
    if (isWaiting || roomData.status === 'FINISHED') return;
    
    const interval = setInterval(() => {
        // Pausing timer visually if modal is open to indicate "Thinking Time"
        if (isModalOpen) return;

        if (!roomData.turnDeadline) {
            setPercent(100);
            setTimeLeft(30);
            return;
        }
        
        const now = Date.now();
        const remaining = Math.max(0, roomData.turnDeadline - now);
        
        const p = Math.min(100, (remaining / 30000) * 100);
        
        setTimeLeft(Math.ceil(remaining / 1000));
        setPercent(p);
    }, 100);

    return () => clearInterval(interval);
  }, [roomData.turnDeadline, isWaiting, roomData.status, isModalOpen]);

  const canInteract = isMyTurn && !isAnimating && !diceRolling && !isProcessing && !hasAlreadyActed;

  return (
    <div className="absolute inset-[9.09%] bg-[#111] z-20 flex flex-col items-center justify-center overflow-hidden border border-gold-900/30">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #F5841A 0%, transparent 80%)' }} />
        
        <div className="relative z-10 text-center w-full flex flex-col items-center">
            
            {/* GameStatus Text */}
            <div className="mb-2 h-10 flex items-center justify-center w-full px-4">
                {isWaiting ? (
                    <div className="flex flex-col items-center gap-2">
                        <span className={`text-xs font-bold tracking-widest ${roomData.currentPlayers >= 2 ? 'text-green-500' : 'text-red-500'}`}>
                            {roomData.currentPlayers >= 2 ? 'READY TO START' : 'WAITING FOR PLAYERS (MIN 2)'}
                        </span>
                        {myPlayer?.isHost && (
                            <Button variant="primary" size="sm" onClick={onStartGame} icon={<Play size={12}/>} disabled={roomData.currentPlayers < 2}>START GAME</Button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center w-full gap-1">
                         <div className="flex items-center gap-2">
                            {isProcessing ? (
                                <span className="text-gold-500 font-bold text-sm animate-pulse">EVENT PROCESSING...</span>
                            ) : isSpaceTravelMode ? (
                                <span className="text-purple-400 font-bold text-sm animate-pulse">우주여행: 원하는 지역을 선택하세요</span>
                            ) : isStuckOnIsland ? (
                                <span className="text-red-400 font-bold text-sm animate-pulse flex items-center gap-2"><Lock size={14}/> 무인도에 갇혔습니다 ({myPlayer?.islandTurns}턴 남음)</span>
                            ) : (
                                <>
                                    <span className="text-xs text-gray-500">TURN:</span>
                                    <span className="text-gold-400 font-bold text-lg" style={{color: currentTurnPlayer?.color}}>{currentTurnPlayer?.name}</span>
                                </>
                            )}
                        </div>
                        {/* Timer Bar */}
                        {canInteract && roomData.status === 'PLAYING' && (
                             <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden relative mt-1">
                                 <div 
                                    className={`absolute left-0 top-0 bottom-0 transition-all duration-200 ${timeLeft < 10 ? 'bg-red-500' : 'bg-gold-500'}`} 
                                    style={{ width: `${percent}%` }}
                                 />
                                 {timeLeft < 10 && <div className="absolute inset-0 bg-red-500/30 animate-pulse"/>}
                             </div>
                        )}
                        {canInteract && roomData.status === 'PLAYING' && timeLeft <= 10 && (
                            <span className="text-[10px] text-red-500 font-mono animate-pulse">{timeLeft}s</span>
                        )}
                    </div>
                )}
            </div>

            {/* Dice Area (3D) */}
            <div className="h-20 md:h-24 flex items-center justify-center gap-6 mb-2 perspective-[600px]">
            {roomData.lastDiceValues && shownDiceValues ? (
                <>
                <Dice3D value={shownDiceValues[0]} rolling={diceRolling} />
                <Dice3D value={shownDiceValues[1]} rolling={diceRolling} />
                </>
            ) : (
                <div className="text-gray-700 text-xs font-mono">
                    {isSpaceTravelMode ? "SELECT DESTINATION" : "READY TO ROLL"}
                </div>
            )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center flex-col gap-2 w-full max-w-xs px-4">
            {isSpaceTravelMode ? (
                <div className="px-8 py-3 bg-purple-900/30 border border-purple-500 rounded-lg text-purple-300 animate-pulse">
                    지도에서 목적지를 클릭하세요
                </div>
            ) : isStuckOnIsland ? (
                <>
                    <button 
                        onClick={onRollDice}
                        disabled={!canInteract}
                        className="w-full py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-bold rounded shadow border border-gray-500 hover:brightness-110 disabled:opacity-50"
                    >
                        주사위 굴리기 (턴 차감)
                    </button>
                    <button 
                        onClick={onEscapeIsland}
                        disabled={!canInteract || (myPlayer?.balance || 0) < 200000}
                        className="w-full py-2 bg-transparent text-gold-500 text-xs font-bold border border-gold-500 rounded hover:bg-gold-500/10 disabled:opacity-30"
                    >
                        탈출 비용 지불 (20만원)
                    </button>
                </>
            ) : (
                <button 
                onClick={onRollDice}
                disabled={!canInteract || isWaiting}
                className={`group relative px-8 py-3 md:px-10 md:py-4 bg-gradient-to-b from-gold-500 to-gold-700 text-black font-black uppercase tracking-wider rounded-lg shadow-[0_0_30px_rgba(245,132,26,0.4)] transition-all 
                    ${(!canInteract || isWaiting) 
                        ? 'opacity-30 cursor-not-allowed scale-95 grayscale' 
                        : 'hover:scale-105 hover:shadow-[0_0_50px_rgba(245,132,26,0.6)] active:scale-95'}`}
                >
                <span className="flex items-center gap-2 md:gap-3 text-lg md:text-2xl justify-center">
                    {isAnimating || diceRolling || isProcessing ? <>WAITING...</> : <><Dice5 size={24} className="md:w-8 md:h-8" /> ROLL DICE</>}
                </span>
                </button>
            )}
            </div>
        </div>
    </div>
  );
};