import { db } from '../firebaseConfig';
import { collection, doc, setDoc, updateDoc, onSnapshot, getDoc, runTransaction, deleteDoc } from 'firebase/firestore';
import { GameRoom, Player, BuildingState, LandOwnership, GameAction } from '../types';
import { BOARD_DATA } from '../data/boardData';
import { GOLDEN_KEYS } from '../data/goldenKeyData';

const ROOMS_COLLECTION = 'rooms';

// Balance Constants (Must match UI)
const RATIOS = {
  LAND_TOLL: 0.1,    // 10%
  VILLA_COST: 0.5,   
  VILLA_TOLL: 0.8,   // 80%
  BUILD_COST: 1.0,   
  BUILD_TOLL: 1.2,   // 120%
  HOTEL_COST: 1.5,   
  HOTEL_TOLL: 2.8,   // 280%
};

const generateRoomId = () => Math.random().toString(36).substring(2, 6).toUpperCase();

const getRandomColor = () => {
  const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const GameService = {
  createRoom: async (hostUser: { uid: string, displayName: string | null }, roomName: string): Promise<string> => {
    const roomId = generateRoomId();
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    const initialPlayer: Player = {
      id: hostUser.uid,
      name: hostUser.displayName || 'Host',
      balance: 5000000, // 500만 원 (Starting Balance)
      color: getRandomColor(),
      position: 0,
      isHost: true,
      isBankrupt: false,
      assets: 0,
      isTurn: true,
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
      if (roomData.status === 'PLAYING') throw new Error("이미 게임이 진행 중입니다.");
      if (roomData.currentPlayers >= roomData.maxPlayers) throw new Error("방이 꽉 찼습니다.");

      const newPlayer: Player = {
        id: user.uid,
        name: user.displayName || 'Guest',
        balance: 5000000, // 500만 원
        color: getRandomColor(),
        position: 0,
        isHost: false,
        isBankrupt: false,
        assets: 0,
        isTurn: false,
      };

      transaction.update(roomRef, {
        [`players.${user.uid}`]: newPlayer,
        playerOrder: [...roomData.playerOrder, user.uid],
        currentPlayers: roomData.currentPlayers + 1
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

              transaction.update(roomRef, {
                  players: newPlayers,
                  playerOrder: newOrder,
                  currentPlayers: roomData.currentPlayers - 1,
                  currentTurnIndex: newTurnIndex
              });
          }
      });
  },

  startGame: async (roomId: string) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    
    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) throw "Room not found";
        const roomData = roomDoc.data() as GameRoom;

        if (roomData.currentPlayers < 3) {
            throw new Error("게임을 시작하려면 최소 3명의 플레이어가 필요합니다.");
        }

        transaction.update(roomRef, { status: 'PLAYING' });
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
      
      let newPosition = (player.position + totalSteps) % 40;
      
      let newBalance = player.balance;
      let salaryMsg = '';
      
      if (newPosition < player.position) {
          newBalance += 300000; // Salary
          salaryMsg = ' (월급 수령)';
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
        lastDiceValues: [d1, d2],
        lastAction: action
      });
    });
  },

  // Space Travel Teleport
  teleportPlayer: async (roomId: string, playerId: string, targetPos: number) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw "Room not found";
          const roomData = roomDoc.data() as GameRoom;
          const player = roomData.players[playerId];
          
          if (!player.isTurn) throw "Not your turn";
          
          // Note: Typically Space Travel is a direct teleport, no salary.
          
          const action: GameAction = {
              type: 'TELEPORT',
              message: `우주여행으로 이동`,
              subjectId: playerId,
              timestamp: Date.now()
          };

          transaction.update(roomRef, {
              [`players.${playerId}.position`]: targetPos,
              lastAction: action
          });
      });
  },

  // Pay into Welfare Fund
  payWelfareFund: async (roomId: string, playerId: string, amount: number) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw "Room";
          const roomData = roomDoc.data() as GameRoom;
          
          const player = roomData.players[playerId];
          
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
              lastAction: action
          });
      });
  },

  // Receive Welfare Fund
  receiveWelfareFund: async (roomId: string, playerId: string) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      return await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw "Room";
          const roomData = roomDoc.data() as GameRoom;
          
          const fund = roomData.welfareFund || 0;
          if (fund === 0) return 0; // Nothing to receive
          
          const player = roomData.players[playerId];

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
              lastAction: action
          });
          
          return fund;
      });
  },

  purchaseLand: async (roomId: string, playerId: string, cellId: number, cost: number, buildings: BuildingState) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) throw "Room not found";
        
        const player = roomDoc.data().players[playerId];
        if (player.balance < cost) throw "Insufficient funds";

        // Calculate simplified toll
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

        transaction.update(roomRef, {
            [`ownership.${cellId}`]: ownershipData,
            [`players.${playerId}.balance`]: player.balance - cost,
            [`players.${playerId}.assets`]: player.assets + 1,
            lastAction: action
        });
    });
  },

  sellLand: async (roomId: string, playerId: string, cellId: number) => {
     const roomRef = doc(db, ROOMS_COLLECTION, roomId);
     await runTransaction(db, async (transaction) => {
         const roomDoc = await transaction.get(roomRef);
         if (!roomDoc.exists()) throw "Room";
         const roomData = roomDoc.data() as GameRoom;
         
         const ownership = roomData.ownership[cellId];
         if (!ownership || ownership.ownerId !== playerId) throw "Not owner";

         // Sell price = 50% of base price + buildings
         const cellData = BOARD_DATA.find(c => c.id === cellId);
         if (!cellData || !cellData.price) return;

         let val = cellData.price;
         if (ownership.buildings.hasVilla) val += cellData.price * RATIOS.VILLA_COST;
         if (ownership.buildings.hasBuilding) val += cellData.price * RATIOS.BUILD_COST;
         if (ownership.buildings.hasHotel) val += cellData.price * RATIOS.HOTEL_COST;
         
         const sellAmount = Math.floor(val * 0.5);

         // Remove ownership entry
         const newOwnership = { ...roomData.ownership };
         delete newOwnership[cellId];

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
             lastAction: action
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
        
        if (payer.balance < amount) throw "INSUFFICIENT_FUNDS"; // Force user to sell

        const action: GameAction = {
            type: 'PAY_TOLL',
            message: `통행료 지불`,
            subjectId: payerId,
            targetId: ownerId,
            amount: amount,
            timestamp: Date.now()
        };

        transaction.update(roomRef, {
            [`players.${payerId}.balance`]: payer.balance - amount,
            [`players.${ownerId}.balance`]: owner.balance + amount,
            lastAction: action
        });
    });
  },

  applyGoldenKey: async (roomId: string, playerId: string) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      // Random Key
      const key = GOLDEN_KEYS[Math.floor(Math.random() * GOLDEN_KEYS.length)];

      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw "Room";
          const player = roomDoc.data().players[playerId];

          const result = key.effect(player.position, player.balance);
          
          let updateData: any = {};
          
          if (result.newPos !== undefined) {
              updateData[`players.${playerId}.position`] = result.newPos;
              // Check pass start logic if moving forward
              if (result.newPos < player.position && key.type === 'MOVE' && result.newPos !== 20) { 
                 // Simple check for wrapping around (except move to island/prison)
                 // NOTE: This is simplified.
              }
          }
          if (result.balanceChange !== undefined) {
              updateData[`players.${playerId}.balance`] = player.balance + result.balanceChange;
          }

          const action: GameAction = {
              type: 'GOLD_KEY',
              message: `황금열쇠: ${key.title} (${result.message})`,
              subjectId: playerId,
              timestamp: Date.now()
          };

          updateData.lastAction = action;
          transaction.update(roomRef, updateData);
      });
      return key;
  },

  endTurn: async (roomId: string) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw "Room not found";
          const roomData = roomDoc.data() as GameRoom;

          let nextIdx = (roomData.currentTurnIndex + 1) % roomData.playerOrder.length;
          
          let loops = 0;
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