import { db } from '../firebaseConfig';
import { collection, doc, setDoc, updateDoc, onSnapshot, getDoc, runTransaction, deleteDoc } from 'firebase/firestore';
import { GameRoom, Player, BuildingState, LandOwnership, GameAction, ChatMessage } from '../types';
import { BOARD_DATA } from '../data/boardData';
import { GOLDEN_KEYS } from '../data/goldenKeyData';

const ROOMS_COLLECTION = 'rooms';

// Balance Constants (Updated per request)
const RATIOS = {
  LAND_TOLL: 0.2,    // 20%
  VILLA_COST: 0.5,   
  VILLA_TOLL: 1.5,   // 150%
  BUILD_COST: 1.0,   
  BUILD_TOLL: 2.5,   // 250%
  HOTEL_COST: 1.5,   
  HOTEL_TOLL: 4.5,   // 450%
};

const SALARY_AMOUNT = 200000;
const ISLAND_ESCAPE_COST = 200000;
const TURN_DURATION_MS = 30000;

const generateRoomId = () => Math.random().toString(36).substring(2, 6).toUpperCase();

const getRandomColor = () => {
  const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const createSystemMessage = (text: string): ChatMessage => ({
  id: Math.random().toString(36).substring(2, 9),
  senderId: 'SYSTEM',
  senderName: 'SYSTEM',
  text,
  type: 'SYSTEM',
  timestamp: Date.now(),
});

export const GameService = {
  createRoom: async (hostUser: { uid: string, displayName: string | null }, roomName: string): Promise<string> => {
    const roomId = generateRoomId();
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    const initialPlayer: Player = {
      id: hostUser.uid,
      name: hostUser.displayName || 'Host',
      balance: 2500000, 
      color: getRandomColor(),
      position: 0,
      isHost: true,
      isBankrupt: false,
      assets: 0,
      isTurn: true,
      islandTurns: 0,
    };

    const newRoom: GameRoom = {
      id: roomId,
      name: roomName,
      hostId: hostUser.uid,
      maxPlayers: 4,
      currentPlayers: 1,
      status: 'WAITING',
      players: { [hostUser.uid]: initialPlayer },
      playerOrder: [hostUser.uid],
      ownership: {},
      currentTurnIndex: 0,
      createdAt: Date.now(),
      welfareFund: 0,
      chat: [createSystemMessage(`방이 생성되었습니다. 환영합니다!`)], // Initialize Chat
    };

    await setDoc(roomRef, newRoom);
    return roomId;
  },

  joinRoom: async (roomId: string, user: { uid: string, displayName: string | null }): Promise<void> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    await runTransaction(db, async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists()) throw new Error("존재하지 않는 방입니다.");

      const roomData = roomDoc.data() as GameRoom;
      
      if (roomData.players[user.uid]) return;
      if (roomData.status !== 'WAITING') throw new Error("이미 게임이 진행 중이거나 종료되었습니다.");
      if (roomData.currentPlayers >= roomData.maxPlayers) throw new Error("방이 꽉 찼습니다.");

      const newPlayer: Player = {
        id: user.uid,
        name: user.displayName || 'Guest',
        balance: 2500000, 
        color: getRandomColor(),
        position: 0,
        isHost: false,
        isBankrupt: false,
        assets: 0,
        isTurn: false,
        islandTurns: 0,
      };

      // Request: <닉네임> 님이 게임에 참가했습니다.
      const joinMsg = createSystemMessage(`${newPlayer.name} 님이 게임에 참가했습니다.`);

      transaction.update(roomRef, {
        [`players.${user.uid}`]: newPlayer,
        playerOrder: [...roomData.playerOrder, user.uid],
        currentPlayers: roomData.currentPlayers + 1,
        chat: [...(roomData.chat || []), joinMsg]
      });
    });
  },

  leaveRoom: async (roomId: string, userId: string): Promise<void> => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);

      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) return; 

          const roomData = roomDoc.data() as GameRoom;
          const player = roomData.players[userId];
          if (!player) return;

          if (player.isHost) {
              transaction.delete(roomRef);
          } else {
              const newPlayers = { ...roomData.players };
              delete newPlayers[userId];
              const newOrder = roomData.playerOrder.filter(id => id !== userId);

              let newTurnIndex = roomData.currentTurnIndex;
              if (newTurnIndex >= newOrder.length) {
                  newTurnIndex = 0;
              }

              const leaveMsg = createSystemMessage(`${player.name} 님이 게임을 떠났습니다.`);

              transaction.update(roomRef, {
                  players: newPlayers,
                  playerOrder: newOrder,
                  currentPlayers: roomData.currentPlayers - 1,
                  currentTurnIndex: newTurnIndex,
                  chat: [...(roomData.chat || []), leaveMsg]
              });
          }
      });
  },

  sendChatMessage: async (roomId: string, user: { uid: string, displayName: string | null }, text: string) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      const newMessage: ChatMessage = {
          id: Math.random().toString(36).substring(2, 9),
          senderId: user.uid,
          senderName: user.displayName || 'Unknown',
          text,
          type: 'USER',
          timestamp: Date.now()
      };

      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw "Room not found";
          const roomData = roomDoc.data() as GameRoom;
          
          transaction.update(roomRef, {
              chat: [...(roomData.chat || []), newMessage]
          });
      });
  },

  startGame: async (roomId: string) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    
    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) throw "Room not found";
        const roomData = roomDoc.data() as GameRoom;

        if (roomData.currentPlayers < 2) { 
            throw new Error("게임을 시작하려면 최소 2명의 플레이어가 필요합니다.");
        }

        const startMsg = createSystemMessage("게임이 시작되었습니다!");

        transaction.update(roomRef, { 
            status: 'PLAYING',
            turnDeadline: Date.now() + TURN_DURATION_MS,
            chat: [...(roomData.chat || []), startMsg]
        });
    });
  },

  forceEndTurn: async (roomId: string, playerId: string) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) return;
          const roomData = roomDoc.data() as GameRoom;
          
          if (roomData.players[playerId].isTurn) {
               let nextIdx = (roomData.currentTurnIndex + 1) % roomData.playerOrder.length;
               let loops = 0;
               while (roomData.players[roomData.playerOrder[nextIdx]].isBankrupt && loops < roomData.playerOrder.length) {
                   nextIdx = (nextIdx + 1) % roomData.playerOrder.length;
                   loops++;
               }
               const nextPlayerId = roomData.playerOrder[nextIdx];
               
               const msg = createSystemMessage(`${roomData.players[playerId].name} 님의 턴이 시간 초과로 넘어갑니다.`);

               transaction.update(roomRef, {
                   currentTurnIndex: nextIdx,
                   [`players.${playerId}.isTurn`]: false,
                   [`players.${nextPlayerId}.isTurn`]: true,
                   turnDeadline: Date.now() + TURN_DURATION_MS,
                   lastAction: {
                       type: 'TIMEOUT',
                       message: '시간 초과! 턴이 강제로 넘어갑니다.',
                       subjectId: playerId,
                       timestamp: Date.now()
                   },
                   chat: [...(roomData.chat || []), msg]
               });
          }
      });
  },

  escapeIsland: async (roomId: string, playerId: string) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw "Room not found";
          const roomData = roomDoc.data() as GameRoom;
          const player = roomData.players[playerId];

          if (player.balance < ISLAND_ESCAPE_COST) throw "잔액이 부족합니다.";

          const msg = createSystemMessage(`${player.name} 님이 비용을 지불하고 무인도를 탈출했습니다.`);

          const action: GameAction = {
              type: 'ESCAPE_SUCCESS',
              message: '탈출 비용 지불 및 석방',
              subjectId: playerId,
              amount: ISLAND_ESCAPE_COST,
              timestamp: Date.now()
          };

          transaction.update(roomRef, {
              [`players.${playerId}.balance`]: player.balance - ISLAND_ESCAPE_COST,
              [`players.${playerId}.islandTurns`]: 0,
              lastAction: action,
              chat: [...(roomData.chat || []), msg]
          });
      });
  },

  rollDice: async (roomId: string, playerId: string) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    await runTransaction(db, async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists()) throw "Room not found";
      
      const roomData = roomDoc.data() as GameRoom;
      const player = roomData.players[playerId];
      
      if (!player.isTurn) throw "Not your turn";

      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const totalSteps = d1 + d2;
      
      const decisionTime = Date.now() + 60000; 

      // Island Logic
      if (player.islandTurns > 0) {
          const nextTurns = player.islandTurns - 1;
          const action: GameAction = {
              type: 'ESCAPE_FAIL',
              message: nextTurns > 0 ? `무인도 체류 중.. 남은 턴: ${nextTurns}` : `무인도 형기 종료. 다음 턴에 이동.`,
              subjectId: playerId,
              timestamp: Date.now()
          };

          transaction.update(roomRef, {
              [`players.${playerId}.islandTurns`]: nextTurns,
              lastDiceValues: [d1, d2],
              lastAction: action,
              turnDeadline: decisionTime
          });
          return;
      }

      // Normal Move
      let newPosition = (player.position + totalSteps) % 40;
      let newBalance = player.balance;
      let salaryMsg = '';
      let chatUpdate = roomData.chat || [];

      if (newPosition < player.position) {
          newBalance += SALARY_AMOUNT; 
          salaryMsg = ' (월급 수령)';
          chatUpdate = [...chatUpdate, createSystemMessage(`${player.name} 님이 월급 ${SALARY_AMOUNT.toLocaleString()}원을 수령했습니다.`)];
      }

      let islandTurns = 0;
      if (newPosition === 20) {
          islandTurns = 3;
          chatUpdate = [...chatUpdate, createSystemMessage(`${player.name} 님이 무인도에 도착하여 3턴간 고립됩니다.`)];
      }

      const action: GameAction = {
          type: 'MOVE',
          message: `주사위 ${d1}+${d2}=${totalSteps} 이동${salaryMsg}`,
          subjectId: playerId,
          timestamp: Date.now()
      };

      transaction.update(roomRef, {
        [`players.${playerId}.position`]: newPosition,
        [`players.${playerId}.balance`]: newBalance,
        [`players.${playerId}.islandTurns`]: islandTurns,
        lastDiceValues: [d1, d2],
        lastAction: action,
        turnDeadline: decisionTime,
        chat: chatUpdate
      });
    });
  },

  teleportPlayer: async (roomId: string, playerId: string, targetPos: number) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw "Room not found";
          const roomData = roomDoc.data() as GameRoom;
          const player = roomData.players[playerId];

          const targetCell = BOARD_DATA.find(c => c.id === targetPos);
          const msg = createSystemMessage(`${player.name} 님이 ${targetCell?.name || '알 수 없는 곳'}(으)로 이동했습니다.`);
          
          const action: GameAction = {
              type: 'TELEPORT',
              message: targetPos === 20 ? '무인도로 강제 이동' : '이동',
              subjectId: playerId,
              timestamp: Date.now()
          };

          transaction.update(roomRef, {
              [`players.${playerId}.position`]: targetPos,
              [`players.${playerId}.islandTurns`]: targetPos === 20 ? 3 : 0,
              lastAction: action,
              turnDeadline: Date.now() + 60000,
              chat: [...(roomData.chat || []), msg]
          });
      });
  },

  payWelfareFund: async (roomId: string, playerId: string, amount: number) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw "Room";
          const roomData = roomDoc.data() as GameRoom;
          
          const player = roomData.players[playerId];
          
          const msg = createSystemMessage(`${player.name} 님이 사회복지기금 ${amount.toLocaleString()}원을 기부했습니다.`);

          const action: GameAction = {
              type: 'WELFARE',
              message: '사회복지기금 납부',
              subjectId: playerId,
              amount: amount,
              timestamp: Date.now()
          };

          transaction.update(roomRef, {
              [`players.${playerId}.balance`]: player.balance - amount,
              welfareFund: (roomData.welfareFund || 0) + amount,
              lastAction: action,
              chat: [...(roomData.chat || []), msg]
          });
      });
  },

  receiveWelfareFund: async (roomId: string, playerId: string) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      return await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw "Room";
          const roomData = roomDoc.data() as GameRoom;
          
          const fund = roomData.welfareFund || 0;
          if (fund === 0) return 0; 
          
          const player = roomData.players[playerId];
          const msg = createSystemMessage(`${player.name} 님이 사회복지기금 ${fund.toLocaleString()}원을 수령했습니다!`);

          const action: GameAction = {
              type: 'WELFARE',
              message: '사회복지기금 수령',
              subjectId: playerId,
              amount: fund,
              timestamp: Date.now()
          };

          transaction.update(roomRef, {
              [`players.${playerId}.balance`]: player.balance + fund,
              welfareFund: 0,
              lastAction: action,
              chat: [...(roomData.chat || []), msg]
          });
          
          return fund;
      });
  },

  purchaseLand: async (roomId: string, playerId: string, cellId: number, cost: number, buildings: BuildingState) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) throw "Room not found";
        const roomData = roomDoc.data() as GameRoom;
        
        const player = roomData.players[playerId];
        if (player.balance < cost) throw "Insufficient funds";

        const cellData = BOARD_DATA.find(c => c.id === cellId);
        let newToll = 0;

        if (cellData) {
            if (cellData.type === 'SPECIAL' || cellData.type === 'VEHICLE') {
                newToll = cellData.toll || 0;
            } else if (cellData.price) {
                const basePrice = cellData.price;
                newToll = basePrice * RATIOS.LAND_TOLL;
                if (buildings.hasVilla) newToll += basePrice * RATIOS.VILLA_TOLL;
                if (buildings.hasBuilding) newToll += basePrice * RATIOS.BUILD_TOLL;
                if (buildings.hasHotel) newToll += basePrice * RATIOS.HOTEL_TOLL;
            }
        }

        const ownershipData: LandOwnership = {
            ownerId: playerId,
            buildings: buildings,
            currentToll: Math.floor(newToll)
        };

        const action: GameAction = {
            type: 'BUY',
            message: `${cellData?.name} 매입/건설`,
            subjectId: playerId,
            amount: cost,
            timestamp: Date.now()
        };

        // Determine if it's initial land buy or upgrade for chat message
        const isUpgrade = roomData.ownership[cellId] !== undefined;
        let chatMsgText = "";
        
        if (isUpgrade) {
             const built = [];
             if (buildings.hasVilla && !roomData.ownership[cellId].buildings.hasVilla) built.push("별장");
             if (buildings.hasBuilding && !roomData.ownership[cellId].buildings.hasBuilding) built.push("빌딩");
             if (buildings.hasHotel && !roomData.ownership[cellId].buildings.hasHotel) built.push("호텔");
             // Request: <닉네임> 님이 <나라 이름>에 <건물 이름>을 건설하셨습니다.
             chatMsgText = `${player.name} 님이 ${cellData?.name}에 ${built.join(', ')}을(를) 건설하셨습니다.`;
        } else {
             // Request: <닉네임> 님이 <나라 이름>을 구매하셨습니다.
             chatMsgText = `${player.name} 님이 ${cellData?.name}을(를) 구매하셨습니다.`;
        }
        
        const msg = createSystemMessage(chatMsgText);

        transaction.update(roomRef, {
            [`ownership.${cellId}`]: ownershipData,
            [`players.${playerId}.balance`]: player.balance - cost,
            [`players.${playerId}.assets`]: player.assets + 1,
            lastAction: action,
            chat: [...(roomData.chat || []), msg]
        });
    });
  },

  sellLand: async (roomId: string, playerId: string, cellId: number) => {
     const roomRef = doc(db, ROOMS_COLLECTION, roomId);
     await runTransaction(db, async (transaction) => {
         const roomDoc = await transaction.get(roomRef);
         if (!roomDoc.exists()) throw "Room";
         const roomData = roomDoc.data() as GameRoom;
         const player = roomData.players[playerId];

         const ownership = roomData.ownership[cellId];
         if (!ownership || ownership.ownerId !== playerId) throw "Not owner";

         const cellData = BOARD_DATA.find(c => c.id === cellId);
         if (!cellData || !cellData.price) return;

         // Fixed: Calculation now includes buildings
         let totalInvested = cellData.price;
         if (ownership.buildings.hasVilla) totalInvested += cellData.price * RATIOS.VILLA_COST;
         if (ownership.buildings.hasBuilding) totalInvested += cellData.price * RATIOS.BUILD_COST;
         if (ownership.buildings.hasHotel) totalInvested += cellData.price * RATIOS.HOTEL_COST;
         
         // 100% Refund of Total Investment
         const sellAmount = Math.floor(totalInvested);

         const newOwnership = { ...roomData.ownership };
         delete newOwnership[cellId];

         const msg = createSystemMessage(`${player.name} 님이 ${cellData.name}을(를) 매각하여 ${sellAmount.toLocaleString()}원을 확보했습니다.`);

         const action: GameAction = {
             type: 'SELL',
             message: `${cellData.name} 매각`,
             subjectId: playerId,
             amount: sellAmount,
             timestamp: Date.now()
         };

         transaction.update(roomRef, {
             ownership: newOwnership,
             [`players.${playerId}.balance`]: roomData.players[playerId].balance + sellAmount,
             [`players.${playerId}.assets`]: roomData.players[playerId].assets - 1,
             lastAction: action,
             chat: [...(roomData.chat || []), msg]
         });
     });
  },

  payToll: async (roomId: string, payerId: string, ownerId: string, amount: number) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) throw "Room not found";
        const roomData = roomDoc.data() as GameRoom;

        const payer = roomData.players[payerId];
        const owner = roomData.players[ownerId];
        
        const newPayerBalance = payer.balance - amount;

        // Request: <통행료를 내는 사람>님이 <통행료를 받는 사람>님에게 통행료 <금액>을 지불했습니다.
        const msg = createSystemMessage(`${payer.name} 님이 ${owner.name} 님에게 통행료 ${amount.toLocaleString()}원을 지불했습니다.`);

        const action: GameAction = {
            type: 'PAY_TOLL',
            message: `통행료 지불`,
            subjectId: payerId,
            targetId: ownerId,
            amount: amount,
            timestamp: Date.now()
        };

        transaction.update(roomRef, {
            [`players.${payerId}.balance`]: newPayerBalance,
            [`players.${ownerId}.balance`]: owner.balance + amount,
            lastAction: action,
            chat: [...(roomData.chat || []), msg]
        });
    });
  },

  declareBankruptcy: async (roomId: string, playerId: string) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw "Room";
          const roomData = roomDoc.data() as GameRoom;
          const player = roomData.players[playerId];

          const newOwnership = { ...roomData.ownership };
          Object.keys(newOwnership).forEach(key => {
              if (newOwnership[key].ownerId === playerId) {
                  delete newOwnership[key];
              }
          });
          
          // Request: <닉네임> 님이 파산했습니다.
          const msg = createSystemMessage(`${player.name} 님이 파산했습니다.`);

          transaction.update(roomRef, {
              ownership: newOwnership,
              [`players.${playerId}.isBankrupt`]: true,
              [`players.${playerId}.balance`]: 0,
              lastAction: {
                  type: 'BANKRUPT',
                  message: '파산 선언! 게임에서 탈락합니다.',
                  subjectId: playerId,
                  timestamp: Date.now()
              },
              chat: [...(roomData.chat || []), msg]
          });
      });
      await GameService.endTurn(roomId); 
  },

  applyGoldenKey: async (roomId: string, playerId: string) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      const key = GOLDEN_KEYS[Math.floor(Math.random() * GOLDEN_KEYS.length)];

      return await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw "Room";
          const roomData = roomDoc.data() as GameRoom;
          const player = roomData.players[playerId];

          const result = key.effect(player.position, player.balance);
          
          let updateData: any = {};
          
          if (result.balanceChange !== undefined) {
              updateData[`players.${playerId}.balance`] = player.balance + result.balanceChange;
          }
          
          const action: GameAction = {
              type: 'GOLD_KEY',
              message: `황금열쇠: ${key.title}`, 
              subjectId: playerId,
              amount: result.balanceChange,
              timestamp: Date.now()
          };

          // Request: <닉네임> 님이 <황금열쇠 내용>으로 인해 <결과>
          const msg = createSystemMessage(`${player.name} 님이 황금열쇠 [${key.title}] 효과로 ${result.message.replace(' 수령', '').replace(' 납부', '')} 결과를 얻었습니다.`);

          updateData.lastAction = action;
          updateData.chat = [...(roomData.chat || []), msg];
          
          transaction.update(roomRef, updateData);
          
          return { key, result };
      });
  },

  endTurn: async (roomId: string) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw "Room not found";
          const roomData = roomDoc.data() as GameRoom;

          // Check Win Condition
          const activePlayers = roomData.playerOrder.filter(uid => !roomData.players[uid].isBankrupt);
          if (activePlayers.length === 1 && roomData.status === 'PLAYING') {
              const winMsg = createSystemMessage(`${roomData.players[activePlayers[0]].name} 님이 최종 승리하였습니다!`);
              transaction.update(roomRef, {
                  status: 'FINISHED',
                  winnerId: activePlayers[0],
                  lastAction: {
                      type: 'WIN',
                      message: '게임 종료! 승자가 결정되었습니다.',
                      subjectId: activePlayers[0],
                      timestamp: Date.now()
                  },
                  chat: [...(roomData.chat || []), winMsg]
              });
              return;
          }

          let nextIdx = (roomData.currentTurnIndex + 1) % roomData.playerOrder.length;
          let loops = 0;
          
          // Skip bankrupt players
          while (roomData.players[roomData.playerOrder[nextIdx]].isBankrupt && loops < roomData.playerOrder.length) {
              nextIdx = (nextIdx + 1) % roomData.playerOrder.length;
              loops++;
          }

          const currentPlayerId = roomData.playerOrder[roomData.currentTurnIndex];
          const nextPlayerId = roomData.playerOrder[nextIdx];

          transaction.update(roomRef, {
              currentTurnIndex: nextIdx,
              [`players.${currentPlayerId}.isTurn`]: false,
              [`players.${nextPlayerId}.isTurn`]: true,
              turnDeadline: Date.now() + TURN_DURATION_MS,
              lastAction: {
                  type: 'START_TURN',
                  message: '턴 종료',
                  subjectId: nextPlayerId,
                  timestamp: Date.now()
              }
          });
      });
  },

  subscribeToRoom: (roomId: string, callback: (room: GameRoom | null) => void) => {
    return onSnapshot(doc(db, ROOMS_COLLECTION, roomId), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as GameRoom);
      } else {
        callback(null);
      }
    });
  },

  subscribeToRoomList: (callback: (rooms: GameRoom[]) => void) => {
    return onSnapshot(collection(db, ROOMS_COLLECTION), (snapshot) => {
      const rooms: GameRoom[] = [];
      snapshot.forEach((doc) => {
        rooms.push(doc.data() as GameRoom);
      });
      callback(rooms);
    });
  }
};
