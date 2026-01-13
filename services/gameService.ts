import { db } from '../firebaseConfig';
import { collection, doc, setDoc, updateDoc, onSnapshot, getDoc, runTransaction } from 'firebase/firestore';
import { GameRoom, Player, BuildingState, LandOwnership } from '../types';

const ROOMS_COLLECTION = 'rooms';

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
      balance: 2000000000,
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
      createdAt: Date.now()
    };

    await setDoc(roomRef, newRoom);
    return roomId;
  },

  joinRoom: async (roomId: string, user: { uid: string, displayName: string | null }): Promise<void> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    await runTransaction(db, async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists()) throw new Error("Room does not exist!");

      const roomData = roomDoc.data() as GameRoom;
      if (roomData.players[user.uid]) return;
      if (roomData.currentPlayers >= roomData.maxPlayers) throw new Error("Room is full!");
      if (roomData.status === 'PLAYING') throw new Error("Game already started!");

      const newPlayer: Player = {
        id: user.uid,
        name: user.displayName || 'Guest',
        balance: 2000000000,
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

  // Start the game (Host only)
  startGame: async (roomId: string) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, { status: 'PLAYING' });
  },

  // Roll Dice and Move
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
      
      // Pass Start Bonus (Salary)
      let newBalance = player.balance;
      if (newPosition < player.position) {
          newBalance += 300000; // Salary
      }

      transaction.update(roomRef, {
        [`players.${playerId}.position`]: newPosition,
        [`players.${playerId}.balance`]: newBalance,
        lastDiceValues: [d1, d2]
      });
    });
  },

  // Purchase Land / Construct Buildings
  purchaseLand: async (roomId: string, playerId: string, cellId: number, cost: number, buildings: BuildingState) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) throw "Room not found";
        const roomData = roomDoc.data() as GameRoom;
        
        const player = roomData.players[playerId];
        if (player.balance < cost) throw "Insufficient funds";

        // Calculate simplified toll based on buildings (logic should match GameEventModal)
        // For simplicity in backend, we just store it. 
        // In a real app, recalculate toll here securely.
        let newToll = 0; // Placeholder, relying on next visit calculation or GameEventModal logic

        const ownershipData: LandOwnership = {
            ownerId: playerId,
            buildings: buildings,
            currentToll: newToll 
        };

        transaction.update(roomRef, {
            [`ownership.${cellId}`]: ownershipData,
            [`players.${playerId}.balance`]: player.balance - cost,
            [`players.${playerId}.assets`]: player.assets + 1
        });
    });
  },

  // End Turn
  endTurn: async (roomId: string) => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      
      await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw "Room not found";
          const roomData = roomDoc.data() as GameRoom;

          const currentIdx = roomData.currentTurnIndex;
          const nextIdx = (currentIdx + 1) % roomData.playerOrder.length;
          const currentPlayerId = roomData.playerOrder[currentIdx];
          const nextPlayerId = roomData.playerOrder[nextIdx];

          transaction.update(roomRef, {
              currentTurnIndex: nextIdx,
              [`players.${currentPlayerId}.isTurn`]: false,
              [`players.${nextPlayerId}.isTurn`]: true,
          });
      });
  },

  subscribeToRoom: (roomId: string, callback: (room: GameRoom) => void) => {
    return onSnapshot(doc(db, ROOMS_COLLECTION, roomId), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as GameRoom);
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