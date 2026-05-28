import { Server, Socket } from 'socket.io';
import { rooms, createRoom, joinRoom, leaveRoom } from './rooms';
import { initGame, playTurn, passTurn } from '../src/game/engine';
import { Card } from '../src/game/types';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    // Evento: Crear una sala
    socket.on('create_room', ({ playerName }: { playerName: string }) => {
      if (!playerName) return;
      const room = createRoom(socket.id, playerName);
      socket.join(room.id);
      console.log(`Sala creada: ${room.id} por ${playerName}`);
      socket.emit('room_update', room);
    });

    // Evento: Unirse a una sala
    socket.on('join_room', ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
      const code = roomCode.trim().toUpperCase();
      const room = joinRoom(code, socket.id, playerName);

      if (room) {
        socket.join(code);
        console.log(`Jugador ${playerName} se unió a sala ${code}`);
        // Notificar a todos en la sala del cambio de estado
        io.to(code).emit('room_update', room);
      } else {
        socket.emit('error_msg', 'La sala no existe o la partida ya comenzó.');
      }
    });

    // Evento: Empezar el juego
    socket.on('start_game', ({ roomCode }: { roomCode: string }) => {
      const code = roomCode.trim().toUpperCase();
      const room = rooms[code];
      if (!room) return;

      // El juego requiere un mínimo de 2 jugadores para ser divertido (por reglas, al menos 2)
      if (room.players.length < 2) {
        socket.emit('error_msg', 'Se necesitan al menos 2 jugadores para comenzar.');
        return;
      }

      // Inicializar el juego
      room.gameState = initGame(room.players);
      room.gameState.status = 'playing';

      io.to(code).emit('room_update', room);
      console.log(`Juego iniciado en sala ${code}`);
    });

    // Evento: Jugar cartas
    socket.on('play_cards', ({ roomCode, cards }: { roomCode: string; cards: Card[] }) => {
      const code = roomCode.trim().toUpperCase();
      const room = rooms[code];
      if (!room || room.gameState.status !== 'playing') return;

      // Intentar jugar las cartas
      const updatedState = playTurn(room.gameState, socket.id, cards);
      room.gameState = updatedState;

      io.to(code).emit('room_update', room);
    });

    // Evento: Pasar el turno
    socket.on('pass_turn', ({ roomCode }: { roomCode: string }) => {
      const code = roomCode.trim().toUpperCase();
      const room = rooms[code];
      if (!room || room.gameState.status !== 'playing') return;

      // Intentar pasar el turno
      const updatedState = passTurn(room.gameState, socket.id);
      room.gameState = updatedState;

      io.to(code).emit('room_update', room);
    });

    // Evento: Solicitar otra partida o reiniciar (Volver al lobby guardando jerarquía de roles de fin)
    socket.on('play_again', ({ roomCode }: { roomCode: string }) => {
      const code = roomCode.trim().toUpperCase();
      const room = rooms[code];
      if (!room) return;

      // Limpiar el estado o preparar el lobby
      room.gameState = {
        status: 'lobby',
        players: room.gameState.players.map(p => ({
          ...p,
          cards: [],
          finishedPlace: null,
          hasPassed: false
          // Conservamos el rol asignado en la partida anterior para que se refleje (ej: Capitalista, Vagabundo)
        })),
        currentTurnIndex: 0,
        lastPlayed: [],
        lastPlayUserId: null,
        deckCount: 0,
        winnerOrder: [],
        playHistory: [],
        forcedRule: null
      };

      // Limpiar también la lista de jugadores de la clase room raíz para sincronizar
      room.players = room.gameState.players;

      io.to(code).emit('room_update', room);
    });

    // Evento: Salir o desconectarse
    socket.on('leave_room', () => {
      handleDisconnect();
    });

    socket.on('disconnect', () => {
      console.log(`Usuario desconectado: ${socket.id}`);
      handleDisconnect();
    });

    function handleDisconnect() {
      const result = leaveRoom(socket.id);
      if (result) {
        const { roomId, room } = result;
        if (room) {
          io.to(roomId).emit('room_update', room);
        } else {
          console.log(`Sala vacía eliminada: ${roomId}`);
        }
      }
    }
  });
}
