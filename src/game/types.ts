export type CardSuit = 'H' | 'D' | 'C' | 'S'; // Hearts, Diamonds, Clubs, Spades
export type CardValue = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: CardSuit;
  value: CardValue;
  id: string; // unique identifier "H_10", "D_A", etc.
}

export type PlayerRole = 'Capitalista' | 'Vice-Capitalista' | 'Neutro' | 'Vice-Vagabundo' | 'Vagabundo' | null;

export interface Player {
  id: string; // socket id o id único temporal
  name: string;
  cards: Card[];
  role: PlayerRole;
  finishedPlace: number | null; // 1, 2, 3...
  hasPassed: boolean;
}

export interface PlayHistoryEntry {
  playerId: string;
  playerName: string;
  cards: Card[];
}

export interface GameState {
  status: 'lobby' | 'playing' | 'game_over';
  players: Player[];
  currentTurnIndex: number;
  lastPlayed: Card[]; // Última jugada que está en la mesa
  lastPlayUserId: string | null; // Quién hizo la última jugada
  deckCount: number;
  winnerOrder: string[]; // IDs de jugadores en orden de finalización [1º, 2º, ...]
  playHistory: PlayHistoryEntry[]; // Historial de últimas jugadas (máx 10)
  forcedRule: 'seven' | 'eight' | null; // Regla activa del 7 u 8
}

export interface Room {
  id: string; // 6 char code
  players: Player[];
  gameState: GameState;
}
