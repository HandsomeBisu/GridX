// Enum for managing the high-level application screen state
export enum AppScreen {
  MAIN_MENU = 'MAIN_MENU',
  LOBBY = 'LOBBY',
  GAME = 'GAME',
}

export type CellType = 'LAND' | 'START' | 'ISLAND' | 'SPACE' | 'FUND' | 'GOLD_KEY' | 'VEHICLE' | 'SPECIAL';

export interface BoardCell {
  id: number;
  name: string;
  engName?: string; // For design purposes
  type: CellType;
  price?: number; // Purchase price
  toll?: number; // Base toll
  color?: string; // Visual color group
  countryCode?: string; // ISO 3166-1 alpha-2 code for flags
  image?: string; // Custom background image URL for special cells
  owner?: string | null; // ID of the player who owns it
  isLocked?: boolean; // For Island logic
}

export interface Player {
  id: string; // Firebase UID
  name: string;
  balance: number;
  color: string;
  position: number; // 0-39
  isHost: boolean;
  isBankrupt: boolean;
  assets: number;
  isTurn: boolean;
}

// Phase 4: Building & Ownership Logic
export interface BuildingState {
  hasVilla: boolean;
  hasBuilding: boolean;
  hasHotel: boolean;
}

export interface LandOwnership {
  ownerId: string;
  buildings: BuildingState;
  currentToll: number;
}

export interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  currentPlayers: number;
  status: 'WAITING' | 'PLAYING';
  players: Record<string, Player>; // Map of UID -> Player Data
  playerOrder: string[]; // Array of UIDs to determine turn order
  ownership: Record<string, LandOwnership>; // Map of Cell ID (string) -> Ownership
  currentTurnIndex: number; // Index in playerOrder
  lastDiceValues?: [number, number]; // Sync dice result
  createdAt: number;
}