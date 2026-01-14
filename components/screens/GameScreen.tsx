import React, { useState, useEffect, useRef } from 'react';
import { LogOut, MoreHorizontal, Wallet, Dice5, Plane, ChevronDown, Building2, Coins, Crown, Zap, Users, Play, AlertTriangle, MessageSquare, History, Rocket } from 'lucide-react';
import { Button } from '../ui/Button';
import { GameEventModal, ModalType } from '../game/GameEventModal';
import { BOARD_DATA } from '../../data/boardData';
import { BoardCell, BuildingState, LandOwnership, Player, GameRoom, GameAction, GoldenKey } from '../../types';
import { GameService } from '../../services/gameService';
import { auth } from '../../firebaseConfig';
import { playSound } from '../../utils/sound';

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
  
  // Game State
  const [roomData, setRoomData] = useState<GameRoom | null>(null);
  
  // Animation State: Map of UID -> Visual Position
  const [visualPositions, setVisualPositions] = useState<Record<string, number>>({});
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showAssetDropdown, setShowAssetDropdown] = useState<boolean>(false);
  
  // Refs for change detection
  const prevPlayersRef = useRef<Record<string, Player>>({});

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: ModalType;
    cellData: BoardCell | null;
    tollAmount?: number;
    goldenKeyData?: GoldenKey | null;
  }>({
    isOpen: false,
    type: 'INFO',
    cellData: null,
    tollAmount: 0
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Navigation Guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; 
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // 2. Subscribe to Room Data
  useEffect(() => {
      if (!roomId) return;
      const unsubscribe = GameService.subscribeToRoom(roomId, (data) => {
          if (data) {
              setRoomData(data);
          } else {
              playSound('ERROR');
              alert("호스트가 방을 나갔거나 게임이 종료되었습니다.");
              onQuit();
          }
      });
      return () => unsubscribe();
  }, [roomId, onQuit]);

  // 3. Last Action Toast / Notification Logic
  useEffect(() => {
     if (roomData?.lastAction && currentUser) {
         const action = roomData.lastAction;
         if (action.type === 'PAY_TOLL' && action.targetId === currentUser.uid && action.timestamp > (Date.now() - 5000)) {
             playSound('BUILD'); 
         }
     }
  }, [roomData?.lastAction, currentUser]);

  // 4. Synchronized Animation Logic
  useEffect(() => {
      if (!roomData) return;

      const playersToAnimate: { uid: string, start: number, end: number }[] = [];
      const newVisualPositions = { ...visualPositions };
      let hasChanges = false;

      Object.values(roomData.players).forEach((p: any) => { 
          const uid = p.id;
          const realPos = p.position;
          
          if (newVisualPositions[uid] === undefined) {
              newVisualPositions[uid] = realPos;
              hasChanges = true;
          } 

          const prevPos = prevPlayersRef.current[uid]?.position;
          if (prevPos !== undefined && prevPos !== realPos) {
             const currentVisual = newVisualPositions[uid] ?? prevPos;
             if (currentVisual !== realPos) {
                 playersToAnimate.push({ uid, start: currentVisual, end: realPos });
             }
          }
          prevPlayersRef.current[uid] = p;
      });

      if (hasChanges) {
          setVisualPositions(newVisualPositions);
      }

      if (playersToAnimate.length > 0 && !isAnimating) {
          animateMultiplePlayers(playersToAnimate);
      } else if (playersToAnimate.length === 0 && !isAnimating && roomData.players[currentUser!.uid]?.isTurn) {
         // Check for arrival logic AFTER animation (or if no animation needed)
         const myRealPos = roomData.players[currentUser!.uid].position;
         const myVisualPos = visualPositions[currentUser!.uid];
         
         // Only trigger if synced and no modal open
         if (myVisualPos === myRealPos && !modalState.isOpen && myRealPos !== 10) { 
             // Exception: Index 10 is Space Travel. If we are starting turn at 10, do NOT trigger arrival.
             // We handle Space Travel selection mode instead.
         }
      }

  }, [roomData, currentUser]); 

  const animateMultiplePlayers = async (moves: { uid: string, start: number, end: number }[]) => {
      setIsAnimating(true);
      
      // Determine if teleport (large jump without intermediate steps logic or instant)
      // For now, standard animation for all moves except specific check?
      // But if move is Space Travel (Teleport), maybe we want faster or different anim?
      // Let's keep it standard step-by-step for now to keep code simple, 
      // or check if steps > 12 (likely teleport/space travel across board) and speed up?
      
      playSound('DICE_ROLL');
      await new Promise(resolve => setTimeout(resolve, 500));

      let maxSteps = 0;
      moves.forEach(m => {
          const steps = (m.end - m.start + 40) % 40;
          if (steps > maxSteps) maxSteps = steps;
      });

      // Speed up if many steps (like Space Travel)
      const stepDelay = maxSteps > 15 ? 50 : 200;

      for (let i = 1; i <= maxSteps; i++) {
           await new Promise(resolve => setTimeout(resolve, stepDelay));
           playSound('MOVE');
           
           setVisualPositions(prev => {
               const next = { ...prev };
               moves.forEach(m => {
                   const stepsToMove = (m.end - m.start + 40) % 40;
                   if (i <= stepsToMove) {
                       next[m.uid] = (m.start + i) % 40;
                   }
               });
               return next;
           });
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      setIsAnimating(false);

      const myMove = moves.find(m => m.uid === currentUser?.uid);
      if (myMove) {
          handleArrival(myMove.end);
      }
  };

  // Derived Data
  const myPlayer = roomData && currentUser ? roomData.players[currentUser.uid] : null;
  const isMyTurn = myPlayer?.isTurn || false;
  const ownershipMap = roomData?.ownership || {};
  const currentTurnPlayer = roomData ? roomData.players[roomData.playerOrder[roomData.currentTurnIndex]] : null;
  
  // Space Travel Mode: If it's my turn AND I am at Space Travel (Index 10) AND not animating
  const isSpaceTravelMode = isMyTurn && myPlayer?.position === 10 && !isAnimating && !modalState.isOpen;

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
  
  // --- HANDLERS ---

  const handleStartGame = async () => {
     if (roomId) {
         try {
             playSound('CLICK');
             await GameService.startGame(roomId);
         } catch (e: any) {
             playSound('ERROR');
             alert(e.message);
         }
     }
  };

  const handleLeaveGame = async () => {
      if (!roomId || !currentUser) return;
      if (window.confirm("정말 나가시겠습니까? 게임 진행 상황은 저장되지 않을 수 있습니다.")) {
          try {
              await GameService.leaveRoom(roomId, currentUser.uid);
              onQuit();
          } catch (e) {
              console.error(e);
          }
      }
  };

  const handleRollDice = async () => {
    if (isAnimating || modalState.isOpen || !isMyTurn || !roomId || !currentUser) return;
    
    // Block regular dice roll if in space travel mode
    if (isSpaceTravelMode) return;

    try {
        await GameService.rollDice(roomId, currentUser.uid);
    } catch (e) {
        console.error(e);
    }
  };

  const handleCellClick = async (cellId: number) => {
      if (!isSpaceTravelMode || !roomId || !currentUser) return;

      if (window.confirm("해당 지역으로 이동하시겠습니까?")) {
          try {
              await GameService.teleportPlayer(roomId, currentUser.uid, cellId);
          } catch (e) {
              console.error(e);
          }
      }
  };

  const handleArrival = async (pos: number) => {
    const cell = BOARD_DATA.find(c => c.id === pos);
    if (!cell) {
        handleEndTurn(); 
        return;
    }

    // Special Case: Golden Key
    if (cell.type === 'GOLD_KEY' && roomId && currentUser) {
        try {
            const key = await GameService.applyGoldenKey(roomId, currentUser.uid);
            setModalState({ isOpen: true, type: 'GOLD_KEY', cellData: cell, goldenKeyData: key });
        } catch (e) {
            console.error(e);
            handleEndTurn();
        }
        return;
    }

    // Special Case: Welfare Fund (Pay) - Index 30
    if (cell.id === 30 && roomId && currentUser) {
        setModalState({ isOpen: true, type: 'WELFARE_PAY', cellData: cell });
        return;
    }

    // Special Case: Welfare Fund (Receive) - Index 38
    if (cell.id === 38 && roomId && currentUser) {
        try {
            const receivedAmount = await GameService.receiveWelfareFund(roomId, currentUser.uid);
            setModalState({ isOpen: true, type: 'WELFARE_RECEIVE', cellData: cell, tollAmount: receivedAmount });
        } catch (e) {
            console.error(e);
            handleEndTurn();
        }
        return;
    }

    // Special Case: Space Travel (Arrive) - Index 10
    if (cell.id === 10 && roomId && currentUser) {
        setModalState({ isOpen: true, type: 'SPACE_TRAVEL', cellData: cell });
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
            const toll = ownership.currentToll || 0;
            if (toll > 0) {
               if ((myPlayer?.balance || 0) < toll) {
                   setModalState({ 
                       isOpen: true, 
                       type: 'SELL_LAND', 
                       cellData: { ...cell, owner: ownership.ownerId },
                       tollAmount: toll 
                   });
               } else {
                   setModalState({ 
                       isOpen: true, 
                       type: 'PAY_TOLL', 
                       cellData: { ...cell, owner: ownership.ownerId },
                       tollAmount: toll 
                   });
               }
            } else {
               setModalState({ isOpen: true, type: 'INFO', cellData: cell });
            }
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
    
    // 1. Purchase / Upgrade Land
    if (modalState.type === 'BUY_LAND' && totalCost > 0) {
        try {
            await GameService.purchaseLand(roomId, currentUser.uid, modalState.cellData.id, totalCost, selectedBuildings);
            playSound('BUILD');
        } catch (e) {
            console.error(e);
            playSound('ERROR');
        }
    }
    
    // 2. Pay Toll
    if (modalState.type === 'PAY_TOLL') {
        const ownerId = modalState.cellData.owner;
        const toll = modalState.tollAmount || 0;
        if (ownerId && toll > 0) {
            try {
                await GameService.payToll(roomId, currentUser.uid, ownerId, toll);
                playSound('PAY_TOLL');
            } catch (e) {
                console.error(e);
                playSound('ERROR');
            }
        }
    }

    // 3. Welfare Pay (Confirmed)
    if (modalState.type === 'WELFARE_PAY') {
        try {
            await GameService.payWelfareFund(roomId, currentUser.uid, 150000);
            playSound('BUILD');
        } catch (e) {
            console.error(e);
        }
    }
    
    setModalState(prev => ({ ...prev, isOpen: false }));
    handleEndTurn();
  };

  const handleSellAsset = async (cellId: number) => {
      if (!roomId || !currentUser) return;
      try {
          await GameService.sellLand(roomId, currentUser.uid, cellId);
          playSound('BUILD'); 
          setModalState(prev => ({ ...prev, isOpen: false }));
          setTimeout(() => {
              const currentPos = roomData?.players[currentUser.uid].position;
              if (currentPos !== undefined) handleArrival(currentPos);
          }, 500);
      } catch (e) {
          console.error(e);
          alert("매각 실패");
      }
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
        onSell={handleSellAsset}
        tollAmount={modalState.tollAmount}
        ownedLands={myOwnedCells}
        goldenKeyData={modalState.goldenKeyData}
      />

      {/* Top HUD */}
      <div className="h-14 md:h-16 bg-luxury-panel border-b border-gold-800/60 flex items-center justify-between px-3 md:px-4 z-20 shadow-lg shrink-0 relative">
        <div className="flex items-center gap-2 md:gap-4 relative">
            {/* Asset Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => { setShowAssetDropdown(!showAssetDropdown); playSound('CLICK'); }}
                    className={`flex items-center gap-2 md:gap-3 bg-black/50 px-2 md:px-3 py-1.5 rounded-sm border transition-all duration-200 group min-w-max ${showAssetDropdown ? 'border-gold-500 bg-gold-900/20' : 'border-gold-900 hover:border-gold-600'}`}
                >
                    <div className="bg-gold-500/20 p-1.5 rounded-full"><Wallet className="text-gold-400 w-3 h-3 md:w-4 md:h-4" /></div>
                    <div className="text-left">
                        <div className="text-[8px] md:text-[9px] text-gold-600 uppercase tracking-widest font-bold flex items-center gap-1">총 자산 <ChevronDown size={10} /></div>
                        <div className="text-xs md:text-base font-sans font-bold text-white tracking-tight">₩ {formatPrice(totalAssets)}</div>
                    </div>
                </button>
                 {showAssetDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-luxury-panel/95 backdrop-blur-md border border-gold-600/50 rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[100] animate-fade-in-up flex flex-col overflow-hidden">
                       <div className="p-3 border-b border-gold-800/30 bg-black/40 flex justify-between items-center">
                           <span className="text-xs font-bold text-gold-400 uppercase tracking-wider">보유 부동산</span>
                           <span className="text-[10px] text-gray-500 font-mono">{myOwnedCells.length} / 25</span>
                       </div>
                       <div className="max-h-64 overflow-y-auto custom-scrollbar bg-black/20">
                           {myOwnedCells.map((cell) => (
                               <div key={cell.id} className="p-3 flex items-center justify-between hover:bg-gold-900/10 border-b border-white/5">
                                   <div className="flex items-center gap-2">
                                       <div className="w-1 h-6" style={{backgroundColor: cell.color || '#555'}}/>
                                       <span className="text-sm text-gray-200">{cell.name}</span>
                                   </div>
                                   <div className="text-xs text-gold-500">₩ {formatPrice(cell.price)}</div>
                               </div>
                           ))}
                       </div>
                    </div>
                )}
            </div>

            <div className="w-px h-6 bg-gold-900/50 hidden md:block shrink-0"></div>

            {/* Cash */}
            <div className="flex items-center gap-2 md:gap-3 bg-black/30 px-2 md:px-3 py-1.5 rounded-sm border border-white/5 min-w-max">
                <div className="bg-green-500/10 p-1.5 rounded-full hidden md:block"><Coins className="text-green-400 w-3 h-3 md:w-4 md:h-4" /></div>
                <div className="text-left">
                    <div className="text-[8px] md:text-[9px] text-green-600 uppercase tracking-widest font-bold">현금 자금</div>
                    <div className="text-xs md:text-sm font-sans font-bold text-gray-200 tracking-tight">₩ {formatPrice(myPlayer?.balance)}</div>
                </div>
            </div>

            {/* Welfare Fund Status */}
            <div className="hidden lg:flex items-center gap-2 md:gap-3 bg-red-900/20 px-2 md:px-3 py-1.5 rounded-sm border border-red-500/20 min-w-max">
                <div className="text-left">
                    <div className="text-[8px] md:text-[9px] text-red-400 uppercase tracking-widest font-bold">사회복지기금</div>
                    <div className="text-xs md:text-sm font-sans font-bold text-white tracking-tight">₩ {formatPrice(roomData.welfareFund || 0)}</div>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0 ml-2">
           <Button variant="secondary" size="sm" onClick={handleLeaveGame} icon={<LogOut size={14} />}>나가기</Button>
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
                   
                   {/* Game Status */}
                   <div className="mb-4 h-8 flex items-center justify-center">
                      {roomData.status === 'WAITING' ? (
                          <div className="flex flex-col items-center gap-2">
                               <span className={`text-xs font-bold tracking-widest ${roomData.currentPlayers >= 3 ? 'text-green-500' : 'text-red-500'}`}>
                                   {roomData.currentPlayers >= 3 ? 'READY TO START' : 'WAITING FOR PLAYERS (MIN 3)'}
                               </span>
                               {myPlayer?.isHost && (
                                   <Button variant="primary" size="sm" onClick={handleStartGame} icon={<Play size={12}/>} disabled={roomData.currentPlayers < 3}>START GAME</Button>
                               )}
                          </div>
                      ) : (
                          <div className="flex items-center gap-2">
                              {isSpaceTravelMode ? (
                                  <span className="text-purple-400 font-bold text-sm animate-pulse">우주여행: 원하는 지역을 선택하세요</span>
                              ) : (
                                  <>
                                      <span className="text-xs text-gray-500">CURRENT TURN:</span>
                                      <span className="text-gold-400 font-bold text-lg" style={{color: currentTurnPlayer?.color}}>{currentTurnPlayer?.name}</span>
                                  </>
                              )}
                          </div>
                      )}
                   </div>

                   {/* Dice / Action */}
                   <div className="h-24 flex items-center justify-center gap-6 mb-4">
                    {roomData.lastDiceValues ? (
                      <>
                        <div className="w-16 h-16 bg-gold-500 rounded-xl flex items-center justify-center text-4xl font-black text-black shadow-lg">{roomData.lastDiceValues[0]}</div>
                        <div className="w-16 h-16 bg-gold-500 rounded-xl flex items-center justify-center text-4xl font-black text-black shadow-lg">{roomData.lastDiceValues[1]}</div>
                      </>
                    ) : (
                        <div className="text-gray-700 text-xs font-mono">
                            {isSpaceTravelMode ? "SELECT DESTINATION" : "READY TO ROLL"}
                        </div>
                    )}
                   </div>
                  
                  {/* Roll Button */}
                  <div className="flex justify-center">
                    {isSpaceTravelMode ? (
                        <div className="px-8 py-3 bg-purple-900/30 border border-purple-500 rounded-lg text-purple-300 animate-pulse">
                            지도에서 목적지를 클릭하세요
                        </div>
                    ) : (
                        <button 
                        onClick={handleRollDice}
                        disabled={isAnimating || modalState.isOpen || !isMyTurn || roomData.status === 'WAITING'}
                        className={`group relative px-8 py-3 md:px-10 md:py-4 bg-gradient-to-b from-gold-500 to-gold-700 text-black font-black uppercase tracking-wider rounded-lg shadow-[0_0_30px_rgba(245,132,26,0.4)] transition-all 
                            ${(isAnimating || modalState.isOpen || !isMyTurn || roomData.status === 'WAITING') 
                                ? 'opacity-30 cursor-not-allowed scale-95 grayscale' 
                                : 'hover:scale-105 hover:shadow-[0_0_50px_rgba(245,132,26,0.6)] active:scale-95'}`}
                        >
                        <span className="flex items-center gap-2 md:gap-3 text-lg md:text-2xl">
                            {isAnimating ? <>MOVING...</> : <><Dice5 size={24} className="md:w-8 md:h-8" /> ROLL DICE</>}
                        </span>
                        </button>
                    )}
                  </div>
                </div>
             </div>

             {/* Grid (Board Rendering) */}
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
                     onClick={() => handleCellClick(cell.id)}
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

                      {/* Players */}
                      {playersHere.map((p, idx) => (
                        <div key={p.id} className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
                             <div 
                                className={`absolute w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[8px] font-black transition-transform duration-300`}
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

        {/* Right Sidebar - Players & Logs */}
        <div className="w-80 bg-luxury-dark border-l border-gold-900 flex flex-col hidden xl:flex shadow-[-10px_0_20px_rgba(0,0,0,0.5)] z-30">
          <div className="p-4 border-b border-gold-800/30 bg-black/40 flex items-center justify-between">
            <h3 className="text-gold-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2"><Users size={14} /> PLAYERS</h3>
            <div className="text-[10px] text-gray-500 font-mono">ROOM: {roomData.name}</div>
          </div>
          
          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-black/20 custom-scrollbar">
             {roomData.playerOrder.map(uid => {
               const player = roomData.players[uid] as Player;
               const lastAction = roomData.lastAction;
               // Check if this player was involved in the last action
               const isSubject = lastAction?.subjectId === uid;
               const isTarget = lastAction?.targetId === uid;
               const hasRecentEvent = (isSubject || isTarget) && (Date.now() - lastAction.timestamp < 10000); // Show for 10s

               return (
               <div key={player.id} className={`p-4 rounded-sm border relative overflow-visible transition-all 
                    ${player.isBankrupt ? 'bg-red-900/10 border-red-900/30 grayscale' : 'bg-[#151515] border-gray-800'}
                    ${player.id === currentUser?.uid ? 'border-gold-500/50' : ''}
               `}>
                  {/* Event Log Bubble */}
                  {hasRecentEvent && (
                      <div className="absolute top-0 right-full mr-2 w-48 bg-black/80 border border-gold-500/50 p-2 rounded text-[10px] text-gray-200 shadow-xl animate-fade-in-up z-50">
                          <div className="flex items-center gap-1 text-gold-400 font-bold mb-1">
                              {isSubject ? "ACTION" : "RECEIVED"} <History size={10}/>
                          </div>
                          <p>{lastAction.message}</p>
                          {lastAction.amount && (
                              <p className={`font-mono font-bold ${isSubject ? 'text-red-400' : 'text-green-400'}`}>
                                  {isSubject ? '-' : '+'} ₩ {formatPrice(lastAction.amount)}
                              </p>
                          )}
                      </div>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-black border border-gray-600 flex items-center justify-center">
                        <span className="text-xs font-bold" style={{color: player.color}}>{player.name.substring(0,1)}</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-200 flex items-center gap-2">
                            {player.name}
                            {player.id === currentUser?.uid && <span className="text-[10px] text-gold-500 bg-gold-900/30 px-1 rounded">YOU</span>}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">Player</div>
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