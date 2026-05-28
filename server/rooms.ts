import { Room, Player } from '../src/game/types';

// Almacén en memoria RAM para todas las salas
export const rooms: Record<string, Room> = {};

// Charset sin ambigüedades (no 0, O, 1, I)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
    }
  } while (rooms[code]); // Re-generar si de casualidad ya existe un lobby activo con ese código
  return code;
}

export function createRoom(hostId: string, hostName: string): Room {
  const code = generateRoomCode();
  const hostPlayer: Player = {
    id: hostId,
    name: hostName,
    cards: [],
    role: null,
    finishedPlace: null,
    hasPassed: false
  };

  const newRoom: Room = {
    id: code,
    players: [hostPlayer],
    gameState: {
      status: 'lobby',
      players: [hostPlayer],
      currentTurnIndex: 0,
      lastPlayed: [],
      lastPlayUserId: null,
      deckCount: 0,
      winnerOrder: [],
      playHistory: [],
      forcedRule: null
    }
  };

  rooms[code] = newRoom;
  return newRoom;
}

export function joinRoom(roomCode: string, playerId: string, playerName: string): Room | null {
  const cleanedCode = roomCode.trim().toUpperCase();
  const room = rooms[cleanedCode];
  if (!room) return null;

  // Evitar duplicados (por ejemplo si el mismo socket reconecta o algo estrambótico)
  const existingPlayerIndex = room.players.findIndex(p => p.id === playerId);
  if (existingPlayerIndex !== -1) {
    room.players[existingPlayerIndex].name = playerName;
    room.gameState.players[existingPlayerIndex].name = playerName;
    return room;
  }

  // Si la partida ya empezó, los nuevos jugadores no se pueden unir a jugar, pero para el MVP
  // simplifiquemos el flujo: o se une de espectador o se bloquea la unión. Bloqueemos o asumamos unión pre-game.
  if (room.gameState.status !== 'lobby') {
    return null; 
  }

  const newPlayer: Player = {
    id: playerId,
    name: playerName,
    cards: [],
    role: null,
    finishedPlace: null,
    hasPassed: false
  };

  room.players.push(newPlayer);
  room.gameState.players.push(newPlayer);
  return room;
}

export function leaveRoom(playerId: string): { roomId: string; room: Room | null } | null {
  for (const code of Object.keys(rooms)) {
    const room = rooms[code];
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    
    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);
      room.gameState.players = room.gameState.players.filter(p => p.id !== playerId);

      // Si no quedan jugadores, borrar la sala para no consumir RAM
      if (room.players.length === 0) {
        delete rooms[code];
        return { roomId: code, room: null };
      }

      // Si el juego estaba en curso y queda vacío o solo queda 1 jugador, podemos forzar un game over
      if (room.gameState.status === 'playing' && room.players.length < 2) {
        room.gameState.status = 'game_over';
      }

      return { roomId: code, room };
    }
  }
  return null;
}
