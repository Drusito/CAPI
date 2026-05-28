import { Card } from './types';
import { getCardPower } from './deck';

/**
 * El 2 de corazones (2♥) es la carta nuclear: puede jugarse sola sobre
 * cualquier jugada (pareja, trío, cuarteto) y cierra la ronda al instante.
 */
export function isTwoHearts(cards: Card[]): boolean {
  return cards.length === 1 && cards[0].value === '2' && cards[0].suit === 'H';
}

/**
 * Valida si un grupo de cartas es una jugada cohesiva (todas tienen el mismo valor).
 */
export function isValidCombo(cards: Card[]): boolean {
  if (cards.length === 0) return false;
  const firstValue = cards[0].value;
  return cards.every(c => c.value === firstValue);
}

/**
 * Valida si una jugada entrante se puede jugar sobre la jugada actual.
 *
 * Orden de cartas (menor → mayor): 3 4 5 6 7 8 9 10 J Q K A 2
 *
 * Reglas especiales:
 *  - 2♥ solo: puede jugarse sobre cualquier jugada (incluso parejas/tríos/cuartetos), cierra ronda.
 *  - Regla del 7 (forcedRule='seven'): el siguiente SOLO puede responder con 7 u 8.
 *  - Regla del 8 (forcedRule='eight'): el siguiente SOLO puede responder con igual o menor.
 *  - Mismo valor (= empate): jugada válida, provoca salto de turno (gestionado en engine).
 */
export function isValidPlay(
  incomingCards: Card[],
  lastPlayed: Card[],
  forcedRule: 'seven' | 'eight' | null = null
): boolean {
  if (incomingCards.length === 0) return false;
  if (!isValidCombo(incomingCards)) return false;

  // El 2♥ solitario puede jugarse sobre cualquier jugada sin restricción de cantidad
  if (isTwoHearts(incomingCards)) return true;

  // Mesa vacía: cualquier combo cohesivo es válido
  if (lastPlayed.length === 0) return true;

  // La cantidad de cartas debe coincidir (excepto el 2♥ ya tratado)
  if (incomingCards.length !== lastPlayed.length) return false;
  if (!isValidCombo(lastPlayed)) return false;

  const incomingValue = incomingCards[0].value;
  const tableValue = lastPlayed[0].value;
  const incomingPower = getCardPower(incomingValue);
  const tablePower = getCardPower(tableValue);

  // Regla del 7: solo se puede responder con 7 u 8
  if (forcedRule === 'seven') {
    return incomingValue === '7' || incomingValue === '8';
  }

  // Regla del 8: solo se puede responder con igual o menor
  if (forcedRule === 'eight') {
    return incomingPower <= tablePower;
  }

  // Regla normal: mayor o igual (igual = válido + salta turno, gestionado en engine)
  return incomingPower >= tablePower;
}

/**
 * Comprueba si un jugador tiene al menos una jugada válida disponible.
 */
export function playerCanPlay(
  playerCards: Card[],
  lastPlayed: Card[],
  forcedRule: 'seven' | 'eight' | null
): boolean {
  if (lastPlayed.length === 0) return true;
  if (playerCards.some(c => c.value === '2' && c.suit === 'H')) return true;

  const byValue: Record<string, Card[]> = {};
  for (const card of playerCards) {
    if (!byValue[card.value]) byValue[card.value] = [];
    byValue[card.value].push(card);
  }

  return Object.values(byValue).some(cards => {
    const subset = cards.slice(0, lastPlayed.length);
    if (subset.length < lastPlayed.length) return false;
    return isValidPlay(subset, lastPlayed, forcedRule);
  });
}
