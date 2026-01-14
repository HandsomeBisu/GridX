import React, { useState, useEffect, useRef } from 'react';
import { Skull, Crown, HandCoins } from 'lucide-react';
import { Button } from '../ui/Button';
import { GameEventModal, ModalType } from '../game/GameEventModal';
import { GameRulesModal } from '../ui/GameRulesModal'; // Import Rules Modal
import { GameHUD } from '../game/GameHUD';
import { GameSidebar } from '../game/GameSidebar';
import { GameBoard } from '../game/GameBoard';
import { GameCenterPanel } from '../game/GameCenterPanel';
import { FloatingEffects, FloatingTextData } from '../ui/FloatingEffects';
import { BOARD_DATA } from '../../data/boardData';
import { BoardCell, BuildingState, LandOwnership, Player, GameRoom, GoldenKey } from '../../types';
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
  
  // Animation State
  const [visualPositions, setVisualPositions] = useState<Record<string, number>>({});
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  
  // Dice Animation State
  const [diceRolling, setDiceRolling] = useState(false);
  const [shownDiceValues, setShownDiceValues] = useState<[number, number] | null>(null);
  
  // Effects State
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextData[]>([]);
  const [receivedToll, setReceivedToll] = useState<{from: string, amount: number} | null>(null);
  const [showRules, setShowRules] = useState(false); // Rules Modal State
  
  // Refs
  const prevPlayersRef = useRef<Record<string, Player>>({});
  const processedActionIdRef = useRef<number>(0);

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: ModalType;
    cellData: BoardCell | null;
    tollAmount?: number;
    goldenKeyData?: { key: GoldenKey, result: { newPos?: number, balanceChange?: number, message: string } } | null;
  }>({
    isOpen: false,
    type: 'INFO',
    cellData: null,
    tollAmount: 0
  });

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
              // Sync Dice Values initially or when changed, BUT wait for animation if we triggered it
              // If we are NOT animating, sync immediately (e.g., page refresh)
              if (!isAnimating) {
                   setShownDiceValues(data.lastDiceValues || [1, 1]);
              }
          } else {
              playSound('ERROR');
              alert("호스트가 방을 나갔거나 게임이 종료되었습니다.");
              onQuit();
          }
      });
      return () => unsubscribe();
  }, [roomId, onQuit, isAnimating]);

  // 3. Auto-Pass Turn Logic (Client Side Check)
  useEffect(() => {
      if (!roomData || !currentUser || !roomId) return;
      const myPlayer = roomData.players[currentUser.uid];
      if (myPlayer?.isTurn && roomData.status === 'PLAYING' && roomData.turnDeadline) {
          const checkTimer = setInterval(() => {
              if (Date.now() > roomData.turnDeadline! + 2000) { // Buffer 2s to avoid racing with server
                  // Force pass locally if needed or just wait for another player to trigger it
                  // Ideally, ANY client can trigger forceEndTurn for the current player if expired.
                  // We'll let the current player trigger it themselves first.
                  if (myPlayer.isTurn) {
                      GameService.forceEndTurn(roomId, currentUser.uid).catch(console.error);
                  }
              }
          }, 1000);
          return () => clearInterval(checkTimer);
      }
  }, [roomData, currentUser, roomId]);

  // 4. Last Action Processing (Logs, Sounds, Floating Text)
  useEffect(() => {
     if (roomData?.lastAction && currentUser) {
         const action = roomData.lastAction;
         
         // Prevent double processing same timestamp action
         if (action.timestamp <= processedActionIdRef.current) return;
         processedActionIdRef.current = action.timestamp;

         // -- Floating Text Logic --
         const subjectPlayer = roomData.players[action.subjectId];
         const targetPlayer = action.targetId ? roomData.players[action.targetId] : null;

         if (action.amount && action.amount > 0) {
             
             if (action.type === 'PAY_TOLL') {
                 if (subjectPlayer) spawnFloatingText(subjectPlayer.position, `- ${formatPrice(action.amount)}`, '#EF4444');
                 if (targetPlayer) spawnFloatingText(targetPlayer.position, `+ ${formatPrice(action.amount)}`, '#10B981');
             } else if (action.type === 'BUY' || action.type === 'ESCAPE_SUCCESS') {
                 if (subjectPlayer) spawnFloatingText(subjectPlayer.position, `- ${formatPrice(action.amount)}`, '#EF4444');
             } else if (action.type === 'SELL') {
                 if (subjectPlayer) spawnFloatingText(subjectPlayer.position, `+ ${formatPrice(action.amount)}`, '#10B981');
             } else if (action.type === 'WELFARE') {
                 const isPay = action.message.includes('납부');
                 if (subjectPlayer) spawnFloatingText(subjectPlayer.position, `${isPay ? '-' : '+'} ${formatPrice(action.amount)}`, isPay ? '#EF4444' : '#10B981');
             }
         }
         
         // GOLD KEY SPECIAL
         if (action.type === 'GOLD_KEY' && action.amount) {
             const color = action.amount > 0 ? '#10B981' : '#EF4444';
             const sign = action.amount > 0 ? '+' : ''; // negative has sign
             if (subjectPlayer) spawnFloatingText(subjectPlayer.position, `${sign} ${formatPrice(action.amount)}`, color);
         }

         // -- Toast / Sound Logic --
         if (action.type === 'PAY_TOLL' && action.targetId === currentUser.uid) {
             playSound('BUILD');
             const payerName = roomData.players[action.subjectId]?.name || '알 수 없음';
             setReceivedToll({ from: payerName, amount: action.amount || 0 });
             const timer = setTimeout(() => { setReceivedToll(null); }, 4000);
         }
         
         if (action.type === 'ESCAPE_FAIL' && action.subjectId === currentUser.uid) playSound('ERROR');
         if (action.type === 'ESCAPE_SUCCESS' && action.subjectId === currentUser.uid) playSound('TURN_START');
         if (action.type === 'TIMEOUT') playSound('ERROR');
     }
  }, [roomData?.lastAction, currentUser]);

  const spawnFloatingText = (posIdx: number, text: string, color: string) => {
      // Calculate % position based on grid index
      const { row, col } = getGridPosition(posIdx);
      // Convert grid row/col (1-11) to percentage (0-100)
      // Grid is 11x11. 
      // col 1 -> 0%, col 11 -> 100%
      // But we want center of cell. 
      // cell width is roughly 9%. 
      const x = ((col - 1) * 9) + 4.5; 
      const y = ((row - 1) * 9) + 4.5;

      const newText: FloatingTextData = {
          id: Math.random().toString(),
          x, y, text, color
      };
      
      setFloatingTexts(prev => [...prev, newText]);
      
      // Cleanup
      setTimeout(() => {
          setFloatingTexts(prev => prev.filter(t => t.id !== newText.id));
      }, 2000);
  };


  // 5. Animation Logic
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

      // Check if animation needed
      if (playersToAnimate.length > 0 && !isAnimating) {
          animateMultiplePlayers(playersToAnimate);
      } else if (playersToAnimate.length === 0 && !isAnimating && roomData.players[currentUser!.uid]?.isTurn) {
         const myRealPos = roomData.players[currentUser!.uid].position;
         const myVisualPos = visualPositions[currentUser!.uid];
         const myIslandTurns = roomData.players[currentUser!.uid].islandTurns;
         
         if (myVisualPos === myRealPos && !modalState.isOpen && myRealPos !== 10 && myIslandTurns === 0) { 
             // Logic when turn starts and we are idle
             if (roomData.lastAction?.type === 'START_TURN') {
                handleArrival(myRealPos);
             }
         }
      }

  }, [roomData, currentUser]); 

  const animateMultiplePlayers = async (moves: { uid: string, start: number, end: number }[]) => {
      setIsAnimating(true);
      
      // Dice Animation Logic
      const isTeleport = roomData?.lastAction?.type === 'TELEPORT';
      const isStartTurn = roomData?.lastAction?.type === 'START_TURN';

      if (!isTeleport && !isStartTurn && roomData?.lastDiceValues) {
           setDiceRolling(true);
           playSound('DICE_ROLL');
           
           // Rolling duration
           await new Promise(resolve => setTimeout(resolve, 800));
           
           setDiceRolling(false);
           setShownDiceValues(roomData.lastDiceValues);
           
           // Pause to let user see result
           await new Promise(resolve => setTimeout(resolve, 500)); 
      }

      let maxSteps = 0;
      moves.forEach(m => {
          const steps = (m.end - m.start + 40) % 40;
          if (steps > maxSteps) maxSteps = steps;
      });

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

  const myPlayer = roomData && currentUser ? roomData.players[currentUser.uid] : null;
  const isMyTurn = myPlayer?.isTurn || false;
  const ownershipMap = roomData?.ownership || {};
  const isSpaceTravelMode = isMyTurn && myPlayer?.position === 10 && !isAnimating && !modalState.isOpen;
  const isStuckOnIsland = isMyTurn && (myPlayer?.islandTurns || 0) > 0;
  
  const myOwnedCells = Object.entries(ownershipMap)
    .filter(([_, data]) => (data as LandOwnership).ownerId === currentUser?.uid)
    .map(([id, _]) => BOARD_DATA.find(c => c.id === Number(id)))
    .filter(Boolean) as BoardCell[];
    
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
      if (window.confirm("정말 나가시겠습니까?")) {
          try {
              await GameService.leaveRoom(roomId, currentUser.uid);
              onQuit();
          } catch (e) {
              console.error(e);
          }
      }
  };

  const handleDeclareBankruptcy = async () => {
      if (!roomId || !currentUser) return;
      if (window.confirm("정말 파산 선언을 하시겠습니까? 게임에서 즉시 탈락합니다.")) {
          try {
              await GameService.declareBankruptcy(roomId, currentUser.uid);
              onQuit();
          } catch (e) {
              console.error(e);
          }
      }
  };

  const handleRollDice = async () => {
    if (isAnimating || modalState.isOpen || !isMyTurn || !roomId || !currentUser) return;
    if (isSpaceTravelMode) return;
    try {
        await GameService.rollDice(roomId, currentUser.uid);
    } catch (e) {
        console.error(e);
    }
  };

  const handleEscapeIsland = async () => {
      if (!roomId || !currentUser) return;
      try {
          await GameService.escapeIsland(roomId, currentUser.uid);
      } catch (e: any) {
          alert(e);
      }
  };

  const handleCellClick = async (cellId: number) => {
      if (!isSpaceTravelMode || !roomId || !currentUser) return;
      if (window.confirm("해당 지역으로 이동하시겠습니까?")) {
          try {
              await GameService.teleportPlayer(roomId, currentUser.uid, cellId);
          } catch (e) { console.error(e); }
      }
  };

  const handleArrival = async (pos: number) => {
    const cell = BOARD_DATA.find(c => c.id === pos);
    if (!cell) { handleEndTurn(); return; }

    // If I'm stuck, I shouldn't trigger events (this protects against glitches)
    if ((myPlayer?.islandTurns || 0) > 0) return;

    // Special Case: Golden Key
    if (cell.type === 'GOLD_KEY' && roomId && currentUser) {
        try {
            // Wait slightly for animation to settle
            setTimeout(async () => {
                const data = await GameService.applyGoldenKey(roomId, currentUser.uid);
                setModalState({ isOpen: true, type: 'GOLD_KEY', cellData: cell, goldenKeyData: data });
            }, 500);
        } catch (e) { console.error(e); handleEndTurn(); }
        return;
    }

    // Welfare Pay
    if (cell.id === 30 && roomId && currentUser) {
        setModalState({ isOpen: true, type: 'WELFARE_PAY', cellData: cell });
        return;
    }

    // Welfare Receive
    if (cell.id === 38 && roomId && currentUser) {
        try {
            const receivedAmount = await GameService.receiveWelfareFund(roomId, currentUser.uid);
            setModalState({ isOpen: true, type: 'WELFARE_RECEIVE', cellData: cell, tollAmount: receivedAmount });
        } catch (e) { console.error(e); handleEndTurn(); }
        return;
    }

    // Space Travel
    if (cell.id === 10 && roomId && currentUser) {
        setModalState({ isOpen: true, type: 'SPACE_TRAVEL', cellData: cell });
        return;
    }

    const ownership = ownershipMap[pos];

    if (cell.type === 'LAND' || cell.type === 'SPECIAL' || cell.type === 'VEHICLE') {
       if (ownership) {
         if (ownership.ownerId === currentUser?.uid) {
            setModalState({ isOpen: true, type: 'BUY_LAND', cellData: { ...cell, owner: currentUser?.uid } });
         } else {
            const toll = ownership.currentToll || 0;
            if (toll > 0) {
               if ((myPlayer?.balance || 0) < toll) {
                   setModalState({ isOpen: true, type: 'SELL_LAND', cellData: { ...cell, owner: ownership.ownerId }, tollAmount: toll });
               } else {
                   setModalState({ isOpen: true, type: 'PAY_TOLL', cellData: { ...cell, owner: ownership.ownerId }, tollAmount: toll });
               }
            } else {
               setModalState({ isOpen: true, type: 'INFO', cellData: cell });
            }
         }
       } else {
         setModalState({ isOpen: true, type: 'BUY_LAND', cellData: { ...cell, owner: undefined } });
       }
    } else {
       setModalState({ isOpen: true, type: 'INFO', cellData: cell });
    }
  };

  const handleModalConfirm = async (selectedBuildings: BuildingState, totalCost: number) => {
    if (!roomId || !currentUser || !modalState.cellData) return;
    
    if (modalState.type === 'GOLD_KEY') {
        const result = modalState.goldenKeyData?.result;
        if (result?.newPos !== undefined) {
             try { await GameService.teleportPlayer(roomId, currentUser.uid, result.newPos); } catch(e) {}
             setModalState(prev => ({ ...prev, isOpen: false }));
             return;
        } else {
            setModalState(prev => ({ ...prev, isOpen: false }));
            handleEndTurn();
            return;
        }
    }

    if (modalState.type === 'BUY_LAND' && totalCost > 0) {
        try { await GameService.purchaseLand(roomId, currentUser.uid, modalState.cellData.id, totalCost, selectedBuildings); playSound('BUILD'); } catch (e) {}
    }
    
    if (modalState.type === 'PAY_TOLL') {
        const ownerId = modalState.cellData.owner;
        const toll = modalState.tollAmount || 0;
        if (ownerId && toll > 0) {
            try { await GameService.payToll(roomId, currentUser.uid, ownerId, toll); playSound('PAY_TOLL'); } catch (e) {}
        }
    }

    if (modalState.type === 'WELFARE_PAY') {
        try { await GameService.payWelfareFund(roomId, currentUser.uid, 150000); playSound('BUILD'); } catch (e) {}
    }

    if (modalState.type === 'WELFARE_RECEIVE') { playSound('BUILD'); }
    
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
      } catch (e) { alert("매각 실패"); }
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
     if (data && data.ownerId === currentUser.uid) return data.buildings;
     return { hasVilla: false, hasBuilding: false, hasHotel: false };
  };

  if (!roomData) return <div className="flex items-center justify-center h-full text-gold-500 font-mono animate-pulse">CONNECTING TO GRID...</div>;

  // --- WINNER SCREEN ---
  if (roomData.status === 'FINISHED' && roomData.winnerId) {
      const winner = roomData.players[roomData.winnerId];
      const isMe = currentUser?.uid === roomData.winnerId;
      return (
          <div className="flex flex-col items-center justify-center h-full bg-black relative overflow-hidden">
               <div className="absolute inset-0 bg-gold-500/10 animate-pulse-slow"></div>
               <div className="z-10 text-center p-8 bg-luxury-panel border-2 border-gold-500 rounded-lg shadow-2xl animate-fade-in-up">
                   <Crown size={80} className="text-gold-500 mx-auto mb-6 animate-bounce" />
                   <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter">
                       {isMe ? "VICTORY!" : "GAME OVER"}
                   </h1>
                   <p className="text-gold-400 text-xl font-serif mb-8 uppercase tracking-widest">
                       {isMe ? "최후의 승자가 되었습니다!" : `${winner.name} 님의 승리입니다.`}
                   </p>
                   <Button variant="primary" size="lg" onClick={onQuit}>로비로 돌아가기</Button>
               </div>
          </div>
      );
  }

  // --- SPECTATOR / BANKRUPT SCREEN ---
  if (myPlayer?.isBankrupt) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-black/90 relative z-50">
             <Skull size={64} className="text-gray-500 mb-4" />
             <h2 className="text-3xl font-bold text-red-500 mb-2">YOU ARE BANKRUPT</h2>
             <p className="text-gray-400 mb-6">파산하여 게임에서 탈락했습니다. 관전 모드로 전환됩니다.</p>
             <Button variant="secondary" onClick={onQuit}>나가기</Button>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#050505] overflow-hidden relative">
      
      {/* Rules Modal */}
      <GameRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

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

      {/* Received Toll Notification Popup */}
      {receivedToll && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-[110] bg-gradient-to-r from-gold-600 to-yellow-500 p-[1px] rounded-lg shadow-[0_0_50px_rgba(255,215,0,0.5)] animate-fade-in-up">
              <div className="bg-black/95 px-8 py-4 rounded-lg flex items-center gap-5 backdrop-blur-xl">
                  <div className="bg-gold-500 p-3 rounded-full animate-bounce shadow-lg">
                      <HandCoins size={28} className="text-black"/>
                  </div>
                  <div>
                      <p className="text-gold-500 text-xs font-bold uppercase tracking-widest mb-1">통행료 입금 확인</p>
                      <p className="text-white text-xl">
                          <span className="font-bold text-yellow-200">{receivedToll.from}</span>
                          <span className="text-gray-400 text-sm mx-2">▶</span>
                          <span className="font-mono font-black text-green-400 text-2xl">+{formatPrice(receivedToll.amount)}</span>
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* REFACTORED: Top HUD */}
      <GameHUD 
          currentUser={currentUser} 
          roomData={roomData} 
          onDeclareBankruptcy={handleDeclareBankruptcy} 
          onLeaveGame={handleLeaveGame}
          onOpenRules={() => setShowRules(true)} 
      />

      <div className="flex-1 flex overflow-hidden relative bg-[#080808]">
        
        {/* REFACTORED: Game Board */}
        <GameBoard 
            roomData={roomData}
            visualPositions={visualPositions}
            currentUser={currentUser}
            ownershipMap={ownershipMap}
            isSpaceTravelMode={isSpaceTravelMode}
            onCellClick={handleCellClick}
        >
            {/* NEW: Floating Effects */}
            <FloatingEffects items={floatingTexts} />

            {/* REFACTORED: Center Panel (Children of Board) */}
            <GameCenterPanel 
                roomData={roomData}
                currentUser={currentUser}
                isMyTurn={isMyTurn}
                isSpaceTravelMode={isSpaceTravelMode}
                isStuckOnIsland={isStuckOnIsland}
                isAnimating={isAnimating}
                diceRolling={diceRolling}
                shownDiceValues={shownDiceValues}
                onRollDice={handleRollDice}
                onEscapeIsland={handleEscapeIsland}
                onStartGame={handleStartGame}
                isWaiting={roomData.status === 'WAITING'}
            />
        </GameBoard>

        {/* REFACTORED: Sidebar */}
        <GameSidebar 
            roomData={roomData} 
            currentUser={currentUser} 
        />
      </div>
    </div>
  );
};