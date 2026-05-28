import { GameState, Player, Card, PlayerRole, Room } from './types';
import { createDeck, shuffleDeck, getCardPower } from './deck';
import { isValidPlay, isTwoHearts } from './rules';

/**
 * Inicializa y reparte las cartas para una nueva partida del juego "Capitalista"
 */
export function initGame(players: Player[]): GameState {
  const activePlayers = players.map(p => ({
    ...p,
    cards: [] as Card[],
    role: p.role || 'Neutro', // Conservar rol previo si existe para la siguiente ronda
    finishedPlace: null,
    hasPassed: false
  }));

  const deck = shuffleDeck(createDeck());
  
  // Repartir cartas
  let playerIdx = 0;
  while (deck.length > 0) {
    const card = deck.pop();
    if (card) {
      activePlayers[playerIdx].cards.push(card);
    }
    playerIdx = (playerIdx + 1) % activePlayers.length;
  }

  // Ordenar cartas en la mano de cada jugador (de menor a mayor fuerza de la carta)
  for (const player of activePlayers) {
    player.cards.sort((a, b) => getCardPower(a.value) - getCardPower(b.value));
  }

  // Quien empiece la primera ronda:
  // Típicamente quien tenga el 3 de tréboles u otra carta baja, o simplemente el primer jugador
  let currentTurnIndex = 0;
  // Busquemos si alguien tiene el 3 de Clubs o Spades, o por defecto empezamos con el jugador index 0
  const spade3Index = activePlayers.findIndex(p => p.cards.some(c => c.suit === 'S' && c.value === '3'));
  if (spade3Index !== -1) {
    currentTurnIndex = spade3Index;
  }

  return {
    status: 'playing',
    players: activePlayers,
    currentTurnIndex,
    lastPlayed: [],
    lastPlayUserId: null,
    deckCount: 0,
    winnerOrder: [],
    playHistory: [],
    forcedRule: null
  };
}

/**
 * Pasa el turno al siguiente jugador elegible.
 * Un jugador es elegible si:
 * 1. Tiene cartas (no ha terminado).
 * 2. No ha pasado en la ronda actual (si se aplica regla de pasar ronda).
 */
export function advanceTurn(gameState: GameState): GameState {
  const { players, currentTurnIndex, lastPlayUserId } = gameState;
  const numPlayers = players.length;

  // Si todos los jugadores con cartas han pasado (o terminado) excepto el último que jugó,
  // la mesa debe limpiarse para que él vuelva a tirar libremente.
  const activePlayersCount = players.filter(p => p.cards.length > 0).length;
  const passedOrFinishedCount = players.filter(p => p.cards.length === 0 || p.hasPassed).length;

  // Ver si todos los demás han pasado o terminado
  if (passedOrFinishedCount >= numPlayers - 1 || (lastPlayUserId && players.find(p => p.id === lastPlayUserId)?.cards.length === 0 && passedOrFinishedCount === numPlayers)) {
    // Limpiar mesa
    gameState.lastPlayed = [];
    gameState.lastPlayUserId = null;
    gameState.forcedRule = null;
    for (const p of players) {
      if (p.cards.length > 0) {
        p.hasPassed = false; // pueden volver a jugar
      }
    }

    // El turno es para el último que jugó la carta (si aún tiene cartas) o, si no, el primer jugador elegible a su derecha.
    let targetIndex = currentTurnIndex;
    if (lastPlayUserId) {
      const idx = players.findIndex(p => p.id === lastPlayUserId);
      if (idx !== -1 && players[idx].cards.length > 0) {
        targetIndex = idx;
      }
    }
    
    gameState.currentTurnIndex = findNextActivePlayerIndex(players, targetIndex);
    return gameState;
  }

  // Avanzar un turno sencillo buscando el siguiente que no haya pasado y aún tenga cartas
  let nextIdx = (currentTurnIndex + 1) % numPlayers;
  let loops = 0;
  while (loops < numPlayers) {
    const p = players[nextIdx];
    if (p.cards.length > 0 && !p.hasPassed) {
      gameState.currentTurnIndex = nextIdx;
      return gameState;
    }
    nextIdx = (nextIdx + 1) % numPlayers;
    loops++;
  }

  // Si no se encuentra a nadie por protección, limpiamos mesa y avanzamos
  gameState.lastPlayed = [];
  gameState.lastPlayUserId = null;
  gameState.forcedRule = null;
  for (const p of players) {
    if (p.cards.length > 0) p.hasPassed = false;
  }
  gameState.currentTurnIndex = findNextActivePlayerIndex(players, currentTurnIndex);
  return gameState;
}

function findNextActivePlayerIndex(players: Player[], startIdx: number): number {
  let idx = startIdx;
  for (let i = 0; i < players.length; i++) {
    if (players[idx].cards.length > 0) {
      return idx;
    }
    idx = (idx + 1) % players.length;
  }
  return startIdx;
}

/**
 * Ejecuta la jugada de cartas de un jugador
 */
export function playTurn(gameState: GameState, playerId: string, cardsToPlay: Card[]): GameState {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || gameState.status !== 'playing') return gameState;

  // Verificar que el turno coincide
  const currentTurnPlayer = gameState.players[gameState.currentTurnIndex];
  if (currentTurnPlayer.id !== playerId) return gameState;

  // Capturar si es empate (mismo valor que la mesa, misma cantidad) → saltará turno
  const isSameValue =
    gameState.lastPlayed.length > 0 &&
    cardsToPlay.length === gameState.lastPlayed.length &&
    cardsToPlay[0].value === gameState.lastPlayed[0].value;

  // Validar si las cartas se pueden jugar (pasamos la forcedRule activa)
  if (!isValidPlay(cardsToPlay, gameState.lastPlayed, gameState.forcedRule)) {
    return gameState;
  }

  // La jugada es válida: limpiar forcedRule (se resolverá de nuevo si se juega 7/8)
  gameState.forcedRule = null;

  // Descontar cartas de la mano del jugador
  const cardsToPlayIds = cardsToPlay.map(c => c.id);
  player.cards = player.cards.filter(c => !cardsToPlayIds.includes(c.id));

  // Actualizar estado de la mesa
  gameState.lastPlayed = cardsToPlay;
  gameState.lastPlayUserId = playerId;

  // Añadir al historial (máximo 10 jugadas)
  const historyEntry = { playerId, playerName: player.name, cards: cardsToPlay };
  gameState.playHistory = [historyEntry, ...gameState.playHistory].slice(0, 10);

  // Si el jugador se quedó sin cartas, sale y se añade al podio
  if (player.cards.length === 0) {
    gameState.winnerOrder.push(player.id);
    player.finishedPlace = gameState.winnerOrder.length;
  }

  // Verificar si la partida ha terminado
  const remainingPlayersCount = gameState.players.filter(p => p.cards.length > 0).length;
  if (remainingPlayersCount <= 1) {
    const lastPlayer = gameState.players.find(p => p.cards.length > 0);
    if (lastPlayer) {
      gameState.winnerOrder.push(lastPlayer.id);
      lastPlayer.finishedPlace = gameState.winnerOrder.length;
    }
    assignRoles(gameState.players, gameState.winnerOrder);
    gameState.status = 'game_over';
    return gameState;
  }

  // REGLA ESPECIAL: 2♥ solitario → cierra la ronda al instante
  // Puede jugarse sobre cualquier jugada (pareja, trío, cuarteto)
  if (isTwoHearts(cardsToPlay)) {
    gameState.lastPlayed = [];
    gameState.lastPlayUserId = null;
    gameState.forcedRule = null;
    for (const p of gameState.players) {
      if (p.cards.length > 0) p.hasPassed = false;
    }
    const twoHIdx = gameState.players.findIndex(p => p.id === playerId);
    if (twoHIdx !== -1 && gameState.players[twoHIdx].cards.length > 0) {
      gameState.currentTurnIndex = twoHIdx;
    } else {
      gameState.currentTurnIndex = findNextActivePlayerIndex(gameState.players, twoHIdx !== -1 ? twoHIdx : 0);
    }
    return gameState;
  }

  // REGLA DEL 7: el siguiente jugador solo puede responder con 7 u 8
  if (cardsToPlay[0].value === '7') {
    gameState.forcedRule = 'seven';
  }
  // REGLA DEL 8: el siguiente jugador solo puede responder con igual o menor
  else if (cardsToPlay[0].value === '8') {
    gameState.forcedRule = 'eight';
  }

  // Avanzar turno
  advanceTurn(gameState);

  // REGLA DEL MISMO NÚMERO: si la jugada empataba con la mesa, saltar un jugador adicional
  if (isSameValue) {
    const skippedIdx = gameState.currentTurnIndex;
    const players = gameState.players;
    let afterSkipped = (skippedIdx + 1) % players.length;
    let loops = 0;
    while (loops < players.length) {
      if (players[afterSkipped].cards.length > 0 && !players[afterSkipped].hasPassed) {
        gameState.currentTurnIndex = afterSkipped;
        break;
      }
      afterSkipped = (afterSkipped + 1) % players.length;
      loops++;
    }
  }

  return gameState;
}

/**
 * Pasa el turno
 */
export function passTurn(gameState: GameState, playerId: string): GameState {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || gameState.status !== 'playing') return gameState;

  // Verificar que el turno coincide
  const currentTurnPlayer = gameState.players[gameState.currentTurnIndex];
  if (currentTurnPlayer.id !== playerId) return gameState;

  // Un jugador que no tiene el turno o que ya pasó no aplica.
  // El que abre mesa (lastPlayed vacío) NO puede pasar.
  if (gameState.lastPlayed.length === 0) {
    return gameState; // Obligado a jugar si es dueño de la mesa limpia
  }

  player.hasPassed = true;
  // Al pasar, la forcedRule se consume (no se puede forzar al siguiente)
  gameState.forcedRule = null;

  // Avanzar turno
  return advanceTurn(gameState);
}

/**
 * Asigna roles de Capitalista según el orden de ganadores
 */
export function assignRoles(players: Player[], winnerOrder: string[]): void {
  const count = winnerOrder.length;
  if (count < 2) return;

  for (const player of players) {
    const place = winnerOrder.indexOf(player.id) + 1; // 1-based index
    if (place === 1) {
      player.role = 'Capitalista';
    } else if (place === count) {
      player.role = 'Vagabundo';
    } else if (count >= 4 && place === 2) {
      player.role = 'Vice-Capitalista';
    } else if (count >= 4 && place === count - 1) {
      player.role = 'Vice-Vagabundo';
    } else {
      player.role = 'Neutro';
    }
  }
}
