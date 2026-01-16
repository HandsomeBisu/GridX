import React, { useState, useEffect, useRef } from 'react';
import { Skull, Crown, HandCoins, RotateCw, Bell, Eye } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // NEW: Blocks interactions during async events
  
  // Dice Animation State
  const [diceRolling, setDiceRolling] = useState(false);
  const [shownDiceValues, setShownDiceValues] = useState<[number, number] | null>(null);
  
  // Effects State
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextData[]>([]);
  const [receivedToll, setReceivedToll] = useState<{from: string, amount: number} | null>(null);
  const [salaryNotification, setSalaryNotification] = useState<boolean>(false); // NEW: Salary Popup
  const [showRules, setShowRules] = useState(false); // Rules Modal State
  const [showTurnEffect, setShowTurnEffect] = useState(false);
  
  // New System Message Popup State
  const [systemNotification, setSystemNotification] = useState<{ text: string, colorClass: string, icon?: React.ReactNode } | null>(null);
  
  // Refs
  const prevPlayersRef = useRef<Record<string, Player>>({});
  const processedActionIdRef = useRef<number>(0);
  const prevIsMyTurnRef = useRef<boolean>(false);

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
              if (!isAnimating) {
                   setShownDiceValues(data.lastDiceValues || [1, 1]);
              }
          } else {
              // Graceful disconnect handling
              // If we were in FINISHED state, we allow roomData to persist so winner screen shows
              // otherwise, we quit.
              setRoomData((prev) => {
                  if (prev && prev.status === 'FINISHED') return prev;
                  
                  // Only alert and quit if we were playing or waiting and room vanished
                  playSound('ERROR');
                  alert("호스트가 방을 나갔거나 게임이 종료되었습니다.");
                  onQuit();
                  return null;
              });
          }
      });
      return () => unsubscribe();
  }, [roomId, onQuit, isAnimating]);

  // 3. Auto-Pass Turn Logic (Client Side Check)
  useEffect(() => {
      if (!roomData || !currentUser || !roomId) return;
      
      // FIXED: Do not force end turn if modal is open OR if we are processing an event (like Golden Key fetch)
      if (modalState.isOpen || isProcessing) return;

      const myPlayer = roomData.players[currentUser.uid];
      if (myPlayer?.isTurn && roomData.status === 'PLAYING' && roomData.turnDeadline) {
          const checkTimer = setInterval(() => {
              // Double check processing state inside interval to be safe
              if (modalState.isOpen || isProcessing) return;
              
              if (Date.now() > roomData.turnDeadline! + 2000) { 
                  if (myPlayer.isTurn) {
                      GameService.forceEndTurn(roomId, currentUser.uid).catch(console.error);
                  }
              }
          }, 1000);
          return () => clearInterval(checkTimer);
      }
  }, [roomData, currentUser, roomId, modalState.isOpen, isProcessing]);

  // 4. Last Action Processing (Logs, Sounds, Floating Text, System Popup)
  useEffect(() => {
     if (roomData?.lastAction && currentUser) {
         const action = roomData.lastAction;
         
         if (action.timestamp <= processedActionIdRef.current) return;
         processedActionIdRef.current = action.timestamp;

         const subjectPlayer = roomData.players[action.subjectId];
         const targetPlayer = action.targetId ? roomData.players[action.targetId] : null;

         // --- SYSTEM POPUP LOGIC ---
         let popupColor = "border-gray-500 text-gray-200 shadow-gray-500/50";
         let popupIcon = <Bell size={18} />;

         // Determine color based on action type
         if (['BUY'].includes(action.type)) {
             popupColor = "border-gold-500 text-gold-300 shadow-gold-500/50";
             popupIcon = <Crown size={18} />;
         } else if (['PAY_TOLL', 'BANKRUPT', 'ESCAPE_FAIL', 'TIMEOUT'].includes(action.type)) {
             popupColor = "border-red-500 text-red-300 shadow-red-500/50";
             popupIcon = <Skull size={18} />;
         } else if (['SELL', 'WELFARE', 'ESCAPE_SUCCESS'].includes(action.type)) {
             // Check if paying or receiving welfare
             const isPay = action.type === 'WELFARE' && action.message.includes('납부');
             if (isPay) {
                popupColor = "border-red-500 text-red-300 shadow-red-500/50";
             } else {
                popupColor = "border-green-500 text-green-300 shadow-green-500/50";
                popupIcon = <HandCoins size={18} />;
             }
         } else if (['GOLD_KEY', 'SPACE_TRAVEL', 'TELEPORT'].includes(action.type)) {
             popupColor = "border-purple-500 text-purple-300 shadow-purple-500/50";
         } else if (['MOVE', 'START_TURN'].includes(action.type)) {
             popupColor = "border-blue-500 text-blue-300 shadow-blue-500/50";
         } else if (['WIN'].includes(action.type)) {
             popupColor = "border-gold-500 text-gold-100 bg-gold-900 shadow-gold-500";
             popupIcon = <Crown size={24} />;
         }

         // Construct Message (Reuse action.message or chat log logic)
         // Chat logic generates a detailed sentence. Action message is short.
         let fullText = "";
         if (roomData.chat && roomData.chat.length > 0) {
             const lastChat = roomData.chat[roomData.chat.length - 1];
             // If chat is fresh (within 100ms) and system type, use it
             if (lastChat.type === 'SYSTEM' && Math.abs(lastChat.timestamp - action.timestamp) < 500) {
                 fullText = lastChat.text;
             }
         }
         
         if (!fullText) {
             fullText = `${subjectPlayer?.name || 'Unknown'}: ${action.message}`;
         }

         setSystemNotification({ text: fullText, colorClass: popupColor, icon: popupIcon });
         
         // Sound for Notification: Play NOTICE only if it's not my action (to alert me) OR if it's a critical event
         if (action.subjectId !== currentUser.uid && ['BUY', 'PAY_TOLL', 'GOLD_KEY', 'WELFARE', 'TELEPORT', 'WIN', 'BANKRUPT'].includes(action.type)) {
             playSound('NOTICE');
         }

         // Auto hide popup
         setTimeout(() => {
             setSystemNotification(null);
         }, 4000);


         // --- FLOATING TEXT LOGIC ---
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
         
         if (action.type === 'GOLD_KEY' && action.amount) {
             const color = action.amount > 0 ? '#10B981' : '#EF4444';
             const sign = action.amount > 0 ? '+' : ''; 
             if (subjectPlayer) spawnFloatingText(subjectPlayer.position, `${sign} ${formatPrice(action.amount)}`, color);
         }

         // -- SPECIFIC SOUNDS --
         // Money Received (Toll, Welfare, Salary)
         if (action.type === 'PAY_TOLL' && action.targetId === currentUser.uid) {
             playSound('GET_MONEY');
             const payerName = roomData.players[action.subjectId]?.name || '알 수 없음';
             setReceivedToll({ from: payerName, amount: action.amount || 0 });
             const timer = setTimeout(() => { setReceivedToll(null); }, 4000);
         }

         // Bankrupt
         if (action.type === 'BANKRUPT') {
             playSound('BANKRUPT');
         }
         
         // Salary
         if (action.type === 'MOVE' && action.subjectId === currentUser.uid && action.message.includes('월급')) {
            playSound('GET_MONEY');
            setSalaryNotification(true);
            setTimeout(() => { setSalaryNotification(false); }, 3000);
         }
         
         if (action.type === 'ESCAPE_FAIL' && action.subjectId === currentUser.uid) {
             setIsProcessing(true);
             playSound('ERROR');
             
             spawnFloatingText(roomData.players[currentUser.uid].position, action.message, '#EF4444');

             setDiceRolling(true);
             playSound('DICE_ROLL');

             setTimeout(() => {
                 setDiceRolling(false);
                 if (roomData.lastDiceValues) {
                     setShownDiceValues(roomData.lastDiceValues);
                 }
                 
                 setTimeout(() => {
                     handleEndTurn();
                     setIsProcessing(false);
                 }, 1500);
             }, 1000);
         }

         if (action.type === 'ESCAPE_SUCCESS' && action.subjectId === currentUser.uid) playSound('TURN_START');
         if (action.type === 'TIMEOUT') playSound('ERROR');
     }
  }, [roomData?.lastAction, currentUser]);

  const spawnFloatingText = (posIdx: number, text: string, color: string) => {
      const { row, col } = getGridPosition(posIdx);
      const x = ((col - 1) * 9) + 4.5; 
      const y = ((row - 1) * 9) + 4.5;

      const newText: FloatingTextData = {
          id: Math.random().toString(),
          x, y, text, color
      };
      
      setFloatingTexts(prev => [...prev, newText]);
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

      if (playersToAnimate.length > 0 && !isAnimating) {
          animateMultiplePlayers(playersToAnimate);
      } 
      
  }, [roomData, currentUser]); 

  const animateMultiplePlayers = async (moves: { uid: string, start: number, end: number }[]) => {
      setIsAnimating(true);
      setIsProcessing(false); 
      
      const isTeleport = roomData?.lastAction?.type === 'TELEPORT';
      const isStartTurn = roomData?.lastAction?.type === 'START_TURN';

      if (!isTeleport && !isStartTurn && roomData?.lastDiceValues) {
           setDiceRolling(true);
           playSound('DICE_ROLL');
           
           await new Promise(resolve => setTimeout(resolve, 800));
           
           setDiceRolling(false);
           setShownDiceValues(roomData.lastDiceValues);
           
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

  useEffect(() => {
    if (isMyTurn && !prevIsMyTurnRef.current) {
      playSound('TURN_START');
      setShowTurnEffect(true);
      setTimeout(() => setShowTurnEffect(false), 2000);
      setIsProcessing(false);
    }
    prevIsMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);
  
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
      // Immediate bankruptcy execution
      try {
          await GameService.declareBankruptcy(roomId, currentUser.uid);
          setModalState(prev => ({ ...prev, isOpen: false }));
          // Note: Spectator mode is handled by UI state, no need to Quit app
      } catch (e) {
          console.error(e);
      }
  };

  const handleRollDice = async () => {
    if (isAnimating || isProcessing || modalState.isOpen || !isMyTurn || !roomId || !currentUser) return;
    if (isSpaceTravelMode) return;
    
    setIsProcessing(true);

    try {
        await GameService.rollDice(roomId, currentUser.uid);
    } catch (e) {
        console.error(e);
        setIsProcessing(false);
    }
  };

  const handleEscapeIsland = async () => {
      if (!roomId || !currentUser) return;
      setIsProcessing(true);
      try {
          await GameService.escapeIsland(roomId, currentUser.uid);
          setIsProcessing(false);
      } catch (e: any) {
          alert(e);
          setIsProcessing(false);
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

    if ((myPlayer?.islandTurns || 0) > 0) return;

    if (cell.type === 'GOLD_KEY' && roomId && currentUser) {
        setIsProcessing(true); 
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Ensure buffer time
            const data = await GameService.applyGoldenKey(roomId, currentUser.uid);
            
            // Wait a tick to ensure data is synced before opening modal
            await new Promise(resolve => setTimeout(resolve, 200));
            
            setIsProcessing(false); 
            setModalState({ isOpen: true, type: 'GOLD_KEY', cellData: cell, goldenKeyData: data });
        } catch (e) { 
            console.error(e); 
            setIsProcessing(false);
            handleEndTurn(); 
        }
        return;
    }

    if (cell.id === 30 && roomId && currentUser) {
        setModalState({ isOpen: true, type: 'WELFARE_PAY', cellData: cell });
        return;
    }

    if (cell.id === 38 && roomId && currentUser) {
        setIsProcessing(true);
        try {
            const receivedAmount = await GameService.receiveWelfareFund(roomId, currentUser.uid);
            setIsProcessing(false);
            setModalState({ isOpen: true, type: 'WELFARE_RECEIVE', cellData: cell, tollAmount: receivedAmount });
        } catch (e) { 
            console.error(e); 
            setIsProcessing(false);
            handleEndTurn(); 
        }
        return;
    }

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

    if (modalState.type === 'WELFARE_RECEIVE') { playSound('GET_MONEY'); }
    
    setModalState(prev => ({ ...prev, isOpen: false }));
    handleEndTurn();
  };

  const handleSellAssets = async (cellIds: number[]) => {
      if (!roomId || !currentUser) return;
      try {
          await Promise.all(cellIds.map(id => GameService.sellLand(roomId, currentUser.uid, id)));
          playSound('BUILD'); 
          
          // Check if user has enough balance now to pay toll
          if (modalState.type === 'SELL_LAND' && modalState.tollAmount && modalState.cellData?.owner) {
             // We need fresh data ideally, but logic dictates we just sold X amount.
             // Let's assume the component will unmount/remount or we just chain the logic blindly if we know it's enough
             // However, to be safe, we close modal and let the user click pay? 
             // Request was: "Automatically pay if sufficient".
             
             // We can calculate approximate balance
             const soldValue = myOwnedCells.filter(c => cellIds.includes(c.id)).reduce((acc, c) => acc + (c.price || 0), 0); // Approx
             // A better way is to wait for update, but we want speed.
             // Actually, GameEventModal handles the "Sufficient" check. If we are here, it means we selected enough.
             
             try {
                // Execute Pay Toll Immediately
                await GameService.payToll(roomId, currentUser.uid, modalState.cellData.owner, modalState.tollAmount);
                playSound('PAY_TOLL');
                setModalState(prev => ({ ...prev, isOpen: false }));
                handleEndTurn();
                return;
             } catch (e) {
                 console.error("Auto Pay Failed", e);
             }
          }

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
  // Only show full screen if game is completely finished
  if (roomData.status === 'FINISHED' && roomData.winnerId) {
      const winner = roomData.players[roomData.winnerId];
      const isMe = currentUser?.uid === roomData.winnerId;
      return (
          <div className="flex flex-col items-center justify-center h-full bg-black relative overflow-hidden z-[200]">
               <div className="absolute inset-0 bg-gold-500/10 animate-pulse-slow"></div>
               <div className="z-10 text-center p-8 bg-luxury-panel border-2 border-gold-500 rounded-lg shadow-2xl animate-fade-in-up">
                   <Crown size={80} className="text-gold-500 mx-auto mb-6 animate-bounce" />
                   <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter">
                       {isMe ? "VICTORY!" : "GAME OVER"}
                   </h1>
                   <p className="text-gold-400 text-xl font-serif mb-8 uppercase tracking-widest">
                       {isMe ? "최후의 승자가 되었습니다!" : `${winner?.name || 'Unknown'} 님의 승리입니다.`}
                   </p>
                   {/* Explicitly call handleLeaveGame to ensure room deletion if needed */}
                   <Button variant="primary" size="lg" onClick={handleLeaveGame}>로비로 돌아가기</Button>
               </div>
          </div>
      );
  }

  // --- SPECTATOR MODE (Removed Full Screen Bankrupt Overlay) ---
  const isSpectating = myPlayer?.isBankrupt;

  return (
    <div className="flex flex-col h-full w-full bg-[#050505] overflow-hidden relative">
      
      {/* Spectator Indicator */}
      {isSpectating && (
          <div className="absolute top-0 left-0 right-0 z-[190] bg-red-900/80 text-white text-center py-1 text-xs font-bold tracking-widest border-b border-red-500 animate-pulse">
              <Eye size={12} className="inline mr-2"/> YOU ARE IN SPECTATOR MODE
          </div>
      )}

      {/* Turn Start Flash Effect */}
      {showTurnEffect && (
        <div className="fixed inset-0 z-[200] pointer-events-none shadow-[inset_0_0_100px_rgba(245,132,26,0.5)] animate-flash-twice" />
      )}

      {/* Rules Modal */}
      <GameRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      {/* SYSTEM MESSAGE POPUP */}
      {systemNotification && (
          <div className={`fixed top-[15%] left-1/2 -translate-x-1/2 z-[150] w-[80%] max-w-2xl bg-black/80 backdrop-blur-md border px-6 py-4 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-4 animate-fade-in-up ${systemNotification.colorClass}`}>
              <div className="p-2 bg-white/5 rounded-full border border-white/10 shrink-0">
                  {systemNotification.icon}
              </div>
              <div className="flex-1 font-bold text-sm md:text-base leading-snug">
                  {systemNotification.text}
              </div>
          </div>
      )}

      <GameEventModal 
        isOpen={modalState.isOpen}
        type={modalState.type}
        cellData={modalState.cellData}
        currentBuildings={getCurrentBuildingsForModal()}
        playerBalance={myPlayer?.balance || 0}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
        onSell={handleSellAssets}
        onDeclareBankruptcy={handleDeclareBankruptcy} // Pass Bankruptcy Handler
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

      {/* Salary Notification Popup (Reuse logic) */}
      {salaryNotification && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-[110] bg-gradient-to-r from-blue-600 to-cyan-500 p-[1px] rounded-lg shadow-[0_0_50px_rgba(59,130,246,0.5)] animate-fade-in-up">
              <div className="bg-black/95 px-8 py-4 rounded-lg flex items-center gap-5 backdrop-blur-xl">
                  <div className="bg-blue-500 p-3 rounded-full animate-bounce shadow-lg">
                      <RotateCw size={28} className="text-white"/>
                  </div>
                  <div>
                      <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">완주 보너스 (월급)</p>
                      <p className="text-white text-xl">
                          <span className="text-gray-300">Start Point Passed</span>
                          <span className="text-gray-400 text-sm mx-2">▶</span>
                          <span className="font-mono font-black text-green-400 text-2xl">+20만</span>
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
                isProcessing={isProcessing} 
                isModalOpen={modalState.isOpen} // Pass modal state to control timer
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