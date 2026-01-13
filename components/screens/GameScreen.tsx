import React, { useState, useEffect, useRef } from 'react';
import { LogOut, MoreHorizontal, Wallet, Dice5, Plane, ChevronDown, Building2, Coins, Crown, Zap, Users, Play } from 'lucide-react';
import { Button } from '../ui/Button';
import { GameEventModal, ModalType } from '../game/GameEventModal';
import { BOARD_DATA } from '../../data/boardData';
import { BoardCell, BuildingState, LandOwnership, Player, GameRoom } from '../../types';
import { GameService } from '../../services/gameService';
import { auth } from '../../firebaseConfig';

interface GameScreenProps {
  onQuit: () => void;
  roomId: string | null;
}

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

export const GameScreen: React.FC<GameScreenProps> = ({ onQuit, roomId }) => {
  const currentUser = auth.currentUser;
  
  // Game State (Synced with Firestore)
  const [roomData, setRoomData] = useState<GameRoom | null>(null);
  const [visualPosition, setVisualPosition] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showAssetDropdown, setShowAssetDropdown] = useState<boolean>(false);
  
  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: ModalType;
    cellData: BoardCell | null;
  }>({
    isOpen: false,
    type: 'INFO',
    cellData: null,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Subscribe to Firestore Room Data
  useEffect(() => {
      if (!roomId) return;
      const unsubscribe = GameService.subscribeToRoom(roomId, (data) => {
          setRoomData(data);
      });
      return () => unsubscribe();
  }, [roomId]);

  // 2. Handle Position Animation
  // When roomData updates, if my position changed, animate to it.
  useEffect(() => {
      if (!roomData || !currentUser) return;
      const myRealPosition = roomData.players[currentUser.uid]?.position || 0;
      
      // If visual is different from real, animate
      if (myRealPosition !== visualPosition && !isAnimating) {
          animateMovement(visualPosition, myRealPosition);
      } else if (!isAnimating && myRealPosition === visualPosition && roomData.players[currentUser.uid]?.isTurn) {
         // If we are at the target position, and it's our turn, but we haven't acted yet?
         // Actually, arrival handling happens after animation.
      }
  }, [roomData, currentUser]); // Removing visualPosition to prevent loop, handled in animateMovement

  const animateMovement = async (start: number, end: number) => {
      setIsAnimating(true);
      let current = start;
      const totalSteps = (end - start + 40) % 40;
      
      // Simple step-by-step animation
      for (let i = 0; i < totalSteps; i++) {
          await new Promise(resolve => setTimeout(resolve, 150));
          current = (current + 1) % 40;
          setVisualPosition(current);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsAnimating(false);
      
      // Trigger Arrival Logic only if it's MY turn (or I just moved)
      if (roomData?.players[currentUser!.uid].isTurn) {
          handleArrival(current);
      }
  };

  // Derived Data
  const myPlayer = roomData && currentUser ? roomData.players[currentUser.uid] : null;
  const isMyTurn = myPlayer?.isTurn || false;
  const ownershipMap = roomData?.ownership || {};
  const currentTurnPlayer = roomData ? roomData.players[roomData.playerOrder[roomData.currentTurnIndex]] : null;

  // Assets Calculation
  const myOwnedCells = Object.entries(ownershipMap)
    .filter(([_, data]) => (data as LandOwnership).ownerId === currentUser?.uid)
    .map(([id, _]) => BOARD_DATA.find(c => c.id === Number(id)))
    .filter(Boolean) as BoardCell[];
    
  const realEstateValue = myOwnedCells.reduce((acc, cell) => {
      const data = ownershipMap[cell.id];
      let val = cell.price || 0;
      if (data && data.buildings.hasVilla) val += (cell.price || 0) * 0.5;
      if (data && data.buildings.hasBuilding) val += (cell.price || 0) * 1.0;
      if (data && data.buildings.hasHotel) val += (cell.price || 0) * 1.5;
      return acc + val;
  }, 0);

  const totalAssets = (myPlayer?.balance || 0) + realEstateValue;
  
  const handleStartGame = async () => {
     if (roomId) await GameService.startGame(roomId);
  };

  const handleRollDice = async () => {
    if (isAnimating || modalState.isOpen || !isMyTurn || !roomId || !currentUser) return;
    try {
        await GameService.rollDice(roomId, currentUser.uid);
        // DB update triggers useEffect -> animateMovement -> handleArrival
    } catch (e) {
        console.error(e);
        alert("Action Failed");
    }
  };

  const handleArrival = (pos: number) => {
    const cell = BOARD_DATA.find(c => c.id === pos);
    if (!cell) {
        handleEndTurn(); // Should not happen
        return;
    }

    const ownership = ownershipMap[pos];

    if (cell.type === 'LAND' || cell.type === 'SPECIAL' || cell.type === 'VEHICLE') {
       if (ownership) {
         if (ownership.ownerId === currentUser?.uid) {
            // My Land -> Upgrade
            setModalState({ isOpen: true, type: 'BUY_LAND', cellData: { ...cell, owner: currentUser?.uid } });
         } else {
            // Enemy Land -> Pay Toll
            // TODO: Implement Pay Toll Modal in next phase. For now, just Show Info and End Turn.
            setModalState({ isOpen: true, type: 'INFO', cellData: cell });
         }
       } else {
         // Unowned -> Buy
         setModalState({ isOpen: true, type: 'BUY_LAND', cellData: { ...cell, owner: undefined } });
       }
    } else {
       // Event cell
       setModalState({ isOpen: true, type: 'INFO', cellData: cell });
    }
  };

  const handleModalConfirm = async (selectedBuildings: BuildingState, totalCost: number) => {
    if (!roomId || !currentUser || !modalState.cellData) return;
    
    // Purchase/Upgrade
    if (totalCost > 0 && modalState.type === 'BUY_LAND') {
        try {
            await GameService.purchaseLand(roomId, currentUser.uid, modalState.cellData.id, totalCost, selectedBuildings);
        } catch (e) {
            console.error(e);
            alert("Purchase failed");
        }
    }
    
    setModalState(prev => ({ ...prev, isOpen: false }));
    handleEndTurn();
  };

  const handleModalCancel = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    handleEndTurn();
  };

  const handleEndTurn = async () => {
      if (roomId) await GameService.endTurn(roomId);
  };

  const getCurrentBuildingsForModal = (): BuildingState => {
     if (!modalState.cellData || !currentUser) return { hasVilla: false, hasBuilding: false, hasHotel: false };
     const data = ownershipMap[modalState.cellData.id];
     if (data && data.ownerId === currentUser.uid) {
         return data.buildings;
     }
     return { hasVilla: false, hasBuilding: false, hasHotel: false };
  };

  if (!roomData) return <div className="flex items-center justify-center h-full text-gold-500 font-mono animate-pulse">CONNECTING TO GRID...</div>;

  return (
    <div className="flex flex-col h-full w-full bg-[#050505] overflow-hidden relative">
      
      <GameEventModal 
        isOpen={modalState.isOpen}
        type={modalState.type}
        cellData={modalState.cellData}
        currentBuildings={getCurrentBuildingsForModal()}
        playerBalance={myPlayer?.balance || 0}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />

      {/* Top HUD */}
      <div className="h-14 md:h-16 bg-luxury-panel border-b border-gold-800/60 flex items-center justify-between px-3 md:px-4 z-20 shadow-lg shrink-0 relative">
        <div className="flex items-center gap-2 md:gap-4 relative">
            {/* Total Assets Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => setShowAssetDropdown(!showAssetDropdown)}
                    className={`flex items-center gap-2 md:gap-3 bg-black/50 px-2 md:px-3 py-1.5 rounded-sm border transition-all duration-200 group min-w-max
                    ${showAssetDropdown ? 'border-gold-500 bg-gold-900/20' : 'border-gold-900 hover:border-gold-600'}`}
                >
                    <div className="bg-gold-500/20 p-1.5 rounded-full">
                    <Wallet className="text-gold-400 w-3 h-3 md:w-4 md:h-4" />
                    </div>
                    <div className="text-left">
                        <div className="text-[8px] md:text-[9px] text-gold-600 uppercase tracking-widest font-bold flex items-center gap-1">
                            총 자산 <ChevronDown size={10} className={`transform transition-transform ${showAssetDropdown ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="text-xs md:text-base font-sans font-bold text-white tracking-tight">
                            ₩ {formatPrice(totalAssets)}
                        </div>
                    </div>
                </button>
                 {/* Asset Dropdown Content */}
                 {showAssetDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-luxury-panel/95 backdrop-blur-md border border-gold-600/50 rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[100] animate-fade-in-up flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-gold-800/30 bg-black/40 flex justify-between items-center">
                        <span className="text-xs font-bold text-gold-400 uppercase tracking-wider">보유 부동산 목록</span>
                        <span className="text-[10px] text-gray-500 font-mono">{myOwnedCells.length} / 25</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar bg-black/20">
                        {myOwnedCells.length > 0 ? (
                        <div className="divide-y divide-gold-900/30">
                            {myOwnedCells.map((cell) => {
                                const buildState = ownershipMap[cell.id]?.buildings;
                                return (
                                <div key={cell.id} className="p-3 flex items-center justify-between hover:bg-gold-900/10 transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-8 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: cell.color || '#888' }}/>
                                    <div>
                                        <div className="text-sm font-bold text-gray-200 group-hover:text-gold-200 flex items-center gap-1">
                                        {cell.name}
                                        </div>
                                        <div className="flex gap-1 mt-0.5">
                                            {buildState?.hasVilla && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                                            {buildState?.hasBuilding && <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />}
                                            {buildState?.hasHotel && <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                                        </div>
                                    </div>
                                    </div>
                                    <div className="text-right">
                                    <div className="text-xs font-bold text-gold-500">₩ {formatPrice(cell.price)}</div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                        ) : (
                        <div className="p-8 flex flex-col items-center justify-center text-gray-600 gap-2">
                            <Building2 size={24} className="opacity-20" />
                            <span className="text-xs">보유한 도시가 없습니다.</span>
                        </div>
                        )}
                    </div>
                    </div>
                )}
            </div>

            <div className="w-px h-6 bg-gold-900/50 hidden md:block shrink-0"></div>

            {/* Cash */}
            <div className="flex items-center gap-2 md:gap-3 bg-black/30 px-2 md:px-3 py-1.5 rounded-sm border border-white/5 min-w-max">
                <div className="bg-green-500/10 p-1.5 rounded-full hidden md:block">
                    <Coins className="text-green-400 w-3 h-3 md:w-4 md:h-4" />
                </div>
                <div className="text-left">
                    <div className="text-[8px] md:text-[9px] text-green-600 uppercase tracking-widest font-bold">
                        현금 자금
                    </div>
                    <div className="text-xs md:text-sm font-sans font-bold text-gray-200 tracking-tight">
                        ₩ {formatPrice(myPlayer?.balance)}
                    </div>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0 ml-2">
           <Button variant="ghost" size="sm" icon={<MoreHorizontal size={18} />} className="hidden sm:flex">메뉴</Button>
           <Button variant="secondary" size="sm" onClick={onQuit} icon={<LogOut size={14} />}>나가기</Button>
        </div>
      </div>

      {/* Main Board */}
      <div className="flex-1 flex overflow-hidden relative bg-[#080808]">
        <div className="flex-1 flex items-center justify-center p-1 md:p-2 overflow-visible">
          <div className="relative aspect-square w-full max-w-[90vh] h-full max-h-[90vh] shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-lg ring-1 ring-gold-500/20 bg-[#0e0e0e]">
             
             {/* Center Area */}
             <div className="absolute inset-[9.09%] bg-[#111] z-20 flex flex-col items-center justify-center overflow-hidden border border-gold-900/30">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #F5841A 0%, transparent 80%)' }} />
                
                <div className="relative z-10 text-center w-full flex flex-col items-center">
                   
                   {/* Game Status Message */}
                   <div className="mb-4 h-8 flex items-center justify-center">
                      {roomData.status === 'WAITING' ? (
                          <div className="flex flex-col items-center gap-2 animate-pulse">
                              <span className="text-gold-500 font-bold tracking-widest text-sm">WAITING FOR HOST TO START</span>
                              {myPlayer?.isHost && (
                                  <Button variant="primary" size="sm" onClick={handleStartGame} icon={<Play size={12}/>} className="mt-2">START GAME</Button>
                              )}
                          </div>
                      ) : (
                          <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">CURRENT TURN:</span>
                              <span className="text-gold-400 font-bold text-lg" style={{color: currentTurnPlayer?.color}}>
                                {currentTurnPlayer?.name}
                              </span>
                          </div>
                      )}
                   </div>

                   {/* Dice Display */}
                   <div className="h-24 flex items-center justify-center gap-6 mb-4">
                    {roomData.lastDiceValues ? (
                      <>
                        <div className="w-16 h-16 bg-gold-500 rounded-xl flex items-center justify-center text-4xl font-black text-black shadow-[0_0_20px_rgba(245,132,26,0.6)]">
                          {roomData.lastDiceValues[0]}
                        </div>
                        <div className="w-16 h-16 bg-gold-500 rounded-xl flex items-center justify-center text-4xl font-black text-black shadow-[0_0_20px_rgba(245,132,26,0.6)]">
                          {roomData.lastDiceValues[1]}
                        </div>
                      </>
                    ) : (
                        <div className="text-gray-700 text-xs font-mono">READY TO ROLL</div>
                    )}
                   </div>
                  
                  {/* Roll Button */}
                  <div className="flex justify-center">
                    <button 
                      onClick={handleRollDice}
                      disabled={isAnimating || modalState.isOpen || !isMyTurn || roomData.status === 'WAITING'}
                      className={`group relative px-8 py-3 md:px-10 md:py-4 bg-gradient-to-b from-gold-500 to-gold-700 text-black font-black uppercase tracking-wider rounded-lg shadow-[0_0_30px_rgba(245,132,26,0.4)] transition-all 
                        ${(isAnimating || modalState.isOpen || !isMyTurn || roomData.status === 'WAITING') 
                            ? 'opacity-30 cursor-not-allowed scale-95 grayscale' 
                            : 'hover:scale-105 hover:shadow-[0_0_50px_rgba(245,132,26,0.6)] active:scale-95'}`}
                    >
                      <span className="flex items-center gap-2 md:gap-3 text-lg md:text-2xl">
                        {isAnimating ? (
                          <>MOVING...</>
                        ) : (
                          <><Dice5 size={24} className="md:w-8 md:h-8" /> ROLL DICE</>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
             </div>

             {/* Grid */}
             <div className="absolute inset-0 grid grid-cols-11 grid-rows-11 gap-[1px] md:gap-0.5 z-10 pointer-events-none">
               {BOARD_DATA.map((cell) => {
                 const { row, col } = getGridPosition(cell.id);
                 const isCorner = cell.type === 'START' || cell.type === 'SPACE' || cell.type === 'ISLAND' || cell.type === 'FUND';
                 
                 const ownership = ownershipMap[cell.id];
                 const isOwnedByMe = ownership?.ownerId === currentUser?.uid;
                 
                 let borderClass = 'border-gold-900/40';
                 if (row === 11) borderClass += ' border-t border-r'; 
                 if (row === 1) borderClass += ' border-b border-l'; 
                 if (col === 1) borderClass += ' border-b border-r'; 
                 if (col === 11) borderClass += ' border-l border-b'; 
                 
                 let bgClass = 'bg-[#151515]';
                 if (isCorner) bgClass = 'bg-[#1a1a1a]';
                 if (isOwnedByMe) bgClass = 'bg-blue-900/30'; 
                 else if (ownership) bgClass = 'bg-red-900/20'; // Enemy owned

                 const bgImageUrl = cell.image || (cell.countryCode ? `https://flagcdn.com/w160/${cell.countryCode}.png` : null);
                 
                 // Render Players
                 // If it's ME, use `visualPosition` (for smooth animation). For OTHERS, use real DB position.
                 const playersHere = Object.values(roomData.players).filter((p: Player) => {
                     if (p.id === currentUser?.uid) return visualPosition === cell.id;
                     return p.position === cell.id;
                 });
                 const isPlayerHere = playersHere.length > 0;

                 return (
                   <div 
                     key={cell.id}
                     className={`relative flex flex-col items-center justify-between p-0.5 md:p-1 transition-all duration-300 border ${borderClass} ${bgClass} pointer-events-auto cursor-pointer group
                                ${isPlayerHere ? 'z-30' : 'hover:z-50 hover:scale-110'}`}
                     style={{ gridRow: row, gridColumn: col }}
                   >
                      {/* Ownership Dots */}
                      {ownership && !isCorner && (
                        <div className="absolute top-1 left-1 flex flex-col gap-0.5 z-20">
                            {ownership.buildings.hasVilla && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_4px_rgba(96,165,250,0.8)] border border-black" />}
                            {ownership.buildings.hasBuilding && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_4px_rgba(192,132,252,0.8)] border border-black" />}
                            {ownership.buildings.hasHotel && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_rgba(248,113,113,0.8)] border border-black" />}
                        </div>
                      )}

                      {/* Players */}
                      {playersHere.map((p, idx) => (
                        <div key={p.id} className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
                             <div 
                                className={`absolute w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.8)] flex items-center justify-center text-[8px] font-black transition-all duration-300`}
                                style={{
                                    backgroundColor: p.color, 
                                    transform: `translate(${idx * 4}px, ${idx * -4}px)`,
                                    zIndex: 50 + idx
                                }}
                             >
                                {p.name.substring(0, 1)}
                             </div>
                        </div>
                      ))}

                     {/* Background Image */}
                     {bgImageUrl && (
                        <div className={`absolute inset-0 transition-opacity overflow-hidden ${cell.image ? 'opacity-60 group-hover:opacity-80' : 'opacity-50 group-hover:opacity-70'}`}>
                            <img 
                              src={bgImageUrl} 
                              alt={cell.name} 
                              className={`w-full h-full object-cover transition-all duration-300 ${cell.image ? 'grayscale-[10%] group-hover:grayscale-0' : 'grayscale-[30%] group-hover:grayscale-0'}`} 
                            />
                            <div className={`absolute inset-0 ${cell.image ? 'bg-black/50 group-hover:bg-black/30' : 'bg-gradient-to-t from-[#151515] via-[#151515]/30 to-transparent'}`} />
                        </div>
                     )}

                     <div className={`relative z-20 w-full h-full flex flex-col ${isCorner ? 'justify-center items-center' : 'justify-between'} pointer-events-none`}>
                       {cell.price !== undefined && cell.price > 0 && !isCorner && (
                         <div className="w-full text-center pt-0.5">
                            <span className={`text-[9px] md:text-[11px] lg:text-xs font-mono font-bold px-1 rounded-sm backdrop-blur-sm border shadow-sm inline-block
                              ${isOwnedByMe 
                                ? 'bg-blue-600/80 border-blue-400 text-white' 
                                : ownership 
                                    ? 'bg-red-600/80 border-red-400 text-white'
                                    : 'text-gold-300/90 bg-black/70 border-gold-900/30'
                              }`}>
                                {formatPrice(cell.price)}
                            </span>
                         </div>
                       )}
                       {!cell.image && (
                         <>
                            {cell.type === 'VEHICLE' && <Plane className="text-blue-400 w-6 h-6 md:w-10 md:h-10 opacity-90 my-auto drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" />}
                         </>
                       )}
                       <div className={`w-full text-center ${isCorner ? 'mt-0' : 'mb-0.5 md:mb-1'} ${cell.image ? 'flex-1 flex items-center justify-center' : ''}`}>
                           <span className={`block font-bold leading-none text-shadow-md
                             ${isCorner 
                               ? 'text-[10px] md:text-xs lg:text-sm text-gold-100 drop-shadow-lg' 
                               : cell.type === 'GOLD_KEY' 
                                 ? 'text-[9px] md:text-[11px] lg:text-xs text-gold-200 drop-shadow-lg font-black tracking-widest'
                                 : 'text-[10px] md:text-xs lg:text-sm text-white/95 drop-shadow-md'
                             } whitespace-pre-wrap`}>
                             {cell.name}
                           </span>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>

        {/* Right Sidebar - Players */}
        <div className="w-80 bg-luxury-dark border-l border-gold-900 flex flex-col hidden xl:flex shadow-[-10px_0_20px_rgba(0,0,0,0.5)] z-30">
          <div className="p-4 border-b border-gold-800/30 bg-black/40 flex items-center justify-between">
            <h3 className="text-gold-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
              <Users size={14} /> PLAYERS ({roomData.currentPlayers}/{roomData.maxPlayers})
            </h3>
            <div className="text-[10px] text-gray-500 font-mono">ROOM: {roomData.name}</div>
          </div>
          
          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-black/20">
             {roomData.playerOrder.map(uid => {
               const player = roomData.players[uid];
               return (
               <div key={player.id} className={`p-4 rounded-sm border relative overflow-hidden transition-all 
                    ${player.isBankrupt ? 'bg-red-900/10 border-red-900/30 grayscale' : 'bg-[#151515] border-gray-800'}
                    ${player.id === currentUser?.uid ? 'border-gold-500/50' : ''}
               `}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-black border border-gray-600 flex items-center justify-center">
                        <span className="text-xs font-bold" style={{color: player.color}}>{player.name.substring(0,1)}</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-200 flex items-center gap-2">
                            {player.name}
                            {player.id === currentUser?.uid && <span className="text-[10px] text-gold-500 bg-gold-900/30 px-1 rounded">YOU</span>}
                            {player.isHost && <Crown size={10} className="text-yellow-500" />}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: player.color}} />
                          Player
                        </div>
                      </div>
                    </div>
                    {player.isTurn && <Zap size={14} className="text-yellow-400 animate-pulse" />}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <div className="text-[10px] text-gray-500 mb-0.5 flex items-center gap-1"><Coins size={10}/> BALANCE</div>
                      <div className="font-mono text-gray-300">₩ {formatPrice(player.balance).replace('억', '')}</div>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <div className="text-[10px] text-gray-500 mb-0.5 flex items-center gap-1"><Building2 size={10}/> ASSETS</div>
                      <div className="font-mono text-gray-300">{player.assets} Cities</div>
                    </div>
                  </div>
               </div>
             )})}
          </div>
        </div>
      </div>
    </div>
  );
};