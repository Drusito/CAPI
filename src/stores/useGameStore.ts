import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Room, Card, Player } from '../game/types';
import { router } from 'expo-router';

// En producción (Render) conectamos al mismo origen donde está servida la app.
// En desarrollo local usamos el servidor en puerto 3001.
function getServerUrl(): string {
  if (process.env.EXPO_PUBLIC_SERVER_URL) return process.env.EXPO_PUBLIC_SERVER_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  return 'http://localhost:3001';
}
const SERVER_URL = getServerUrl();

interface GameStore {
  socket: Socket | null;
  playerName: string;
  roomCode: string;
  room: Room | null;
  error: string | null;
  isConnected: boolean;

  // Acciones
  setPlayerName: (name: string) => void;
  setRoomCode: (code: string) => void;
  connectSocket: () => void;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  startGame: () => void;
  playCards: (cards: Card[]) => void;
  passTurn: () => void;
  playAgain: () => void;
  leaveRoom: () => void;
  clearError: () => void;
  getLocalPlayer: () => Player | undefined;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  playerName: '',
  roomCode: '',
  room: null,
  error: null,
  isConnected: false,

  setPlayerName: (name) => set({ playerName: name }),
  setRoomCode: (code) => set({ roomCode: code.toUpperCase() }),
  
  clearError: () => set({ error: null }),

  connectSocket: () => {
    if (get().socket) return; // Ya conectado

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      set({ isConnected: true });
      console.log('Conectado al servidor Socket.IO');
    });

    socket.on('disconnect', () => {
      set({ isConnected: false, room: null });
      console.log('Desconectado del servidor');
    });

    socket.on('room_update', (room: Room) => {
      set({ room, roomCode: room.id });
      
      // Enrutamiento automático basado en el estado del juego
      const status = room.gameState.status;
      if (status === 'lobby') {
        router.replace('/lobby');
      } else if (status === 'playing') {
        router.replace('/game');
      } else if (status === 'game_over') {
        router.replace('/results');
      }
    });

    socket.on('error_msg', (error: string) => {
      set({ error });
    });

    set({ socket });
  },

  createRoom: () => {
    const { socket, playerName } = get();
    if (!socket) return;
    socket.emit('create_room', { playerName });
  },

  joinRoom: (code) => {
    const { socket, playerName } = get();
    if (!socket) return;
    const cleanCode = code.trim().toUpperCase();
    socket.emit('join_room', { roomCode: cleanCode, playerName });
  },

  startGame: () => {
    const { socket, roomCode } = get();
    if (!socket || !roomCode) return;
    socket.emit('start_game', { roomCode });
  },

  playCards: (cards) => {
    const { socket, roomCode } = get();
    if (!socket || !roomCode) return;
    socket.emit('play_cards', { roomCode, cards });
  },

  passTurn: () => {
    const { socket, roomCode } = get();
    if (!socket || !roomCode) return;
    socket.emit('pass_turn', { roomCode });
  },

  playAgain: () => {
    const { socket, roomCode } = get();
    if (!socket || !roomCode) return;
    socket.emit('play_again', { roomCode });
  },

  leaveRoom: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('leave_room');
    }
    set({ room: null, roomCode: '' });
    router.replace('/');
  },

  getLocalPlayer: () => {
    const { room, socket } = get();
    if (!room || !socket) return undefined;
    return room.gameState.players.find(p => p.id === socket.id);
  }
}));
