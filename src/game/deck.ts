import { Card, CardSuit, CardValue } from './types';

export const CARD_VALUES_ORDER: CardValue[] = [
  '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'
];

export function getCardPower(value: CardValue): number {
  return CARD_VALUES_ORDER.indexOf(value);
}

export function createDeck(): Card[] {
  const suits: CardSuit[] = ['H', 'D', 'C', 'S'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const value of CARD_VALUES_ORDER) {
      deck.push({
        suit,
        value,
        id: `${suit}_${value}`
      });
    }
  }

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
