import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useGameStore } from '../src/stores/useGameStore';
import { Card, CardSuit, PlayHistoryEntry } from '../src/game/types';
import { isValidPlay } from '../src/game/rules';

export default function GameScreen() {
  const { room, socket, playCards, passTurn, leaveRoom } = useGameStore();
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);

  if (!room || !socket) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Conexión perdida con la sala...</Text>
      </View>
    );
  }

  const { players, currentTurnIndex, lastPlayed, lastPlayUserId, playHistory, forcedRule } = room.gameState;
  const activePlayer = players[currentTurnIndex];
  const isMyTurn = activePlayer?.id === socket.id;

  const localPlayer = players.find(p => p.id === socket.id);
  const hand = localPlayer?.cards || [];

  // Mapeo de palos a colores y emojis
  const suitMeta: Record<CardSuit, { emoji: string; color: string }> = {
    H: { emoji: '♥', color: '#E8001C' }, // Hearts - rojo
    D: { emoji: '♦', color: '#E8001C' }, // Diamonds - rojo
    C: { emoji: '♣', color: '#000000' }, // Clubs - negro puro
    S: { emoji: '♠', color: '#000000' }, // Spades - negro puro
  };

  const handleSelectCard = (card: Card) => {
    const suitNames: Record<string, string> = { H: 'Corazones', D: 'Rombos', C: 'Tréboles', S: 'Picas' };
    console.log(`Carta seleccionada: ${card.value} de ${suitNames[card.suit]} (${card.id})`);
    const exists = selectedCards.find(c => c.id === card.id);
    if (exists) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else {
      // Solo cartas del mismo valor. Máximo 4 (un cuarteto).
      if (selectedCards.length > 0 && selectedCards[0].value !== card.value) {
        setSelectedCards([card]);
      } else if (selectedCards.length < 4) {
        setSelectedCards([...selectedCards, card]);
      }
    }
  };

  const handlePlay = () => {
    if (selectedCards.length === 0) return;
    
    // Validar si la jugada es válida
    if (!isValidPlay(selectedCards, lastPlayed, forcedRule)) {
      const msg = forcedRule === 'seven'
        ? 'Regla del 7: debes jugar un 7 u 8.'
        : forcedRule === 'eight'
        ? 'Regla del 8: debes jugar igual o menor.'
        : 'Jugada no válida. Debes tirar el mismo número de cartas y de valor superior.';
      alert(msg);
      return;
    }

    playCards(selectedCards);
    setSelectedCards([]); // Limpiar selección
  };

  const handlePass = () => {
    passTurn();
    setSelectedCards([]);
  };

  const getLastPlayedPlayerName = () => {
    if (!lastPlayUserId) return '';
    const maker = players.find(p => p.id === lastPlayUserId);
    return maker ? maker.name : 'Alguien';
  };

  const renderCard = (card: Card, forTable = false) => {
    const { emoji, color } = suitMeta[card.suit];
    const isSelected = !forTable && selectedCards.some(c => c.id === card.id);

    const content = (
      <View style={[forTable ? styles.cardTable : styles.card, isSelected && styles.cardSelected]}>
        <View style={styles.cardCorner}>
          <Text style={[styles.cardCornerValue, { color }]}>{card.value}</Text>
          <Text style={[styles.cardCornerSuit, { color }]}>{emoji}</Text>
        </View>
        <Text style={[styles.cardCenter, { color, fontSize: forTable ? 22 : 30 }]}>{emoji}</Text>
        <View style={[styles.cardCorner, styles.cardCornerBottom]}>
          <Text style={[styles.cardCornerValue, { color }]}>{card.value}</Text>
          <Text style={[styles.cardCornerSuit, { color }]}>{emoji}</Text>
        </View>
      </View>
    );

    if (forTable) return <View key={card.id}>{content}</View>;

    return (
      <TouchableOpacity
        key={card.id}
        activeOpacity={0.85}
        onPress={() => handleSelectCard(card)}
        style={[
          styles.handCardWrapper,
          isSelected && styles.handCardWrapperSelected,
        ]}
      >
        {content}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        
        {/* Cabecera Técnica del Turno */}
        <View style={styles.header}>
          <Text style={styles.turnLabel}>
            {isMyTurn ? '🌟 ¡ES TU TURNO!' : `Turno de: ${activePlayer?.name || 'Esperando...'}`}
          </Text>
          <TouchableOpacity onPress={leaveRoom} style={styles.btnExit}>
            <Text style={styles.btnExitText}>Abandonar</Text>
          </TouchableOpacity>
        </View>

        {/* HISTORIAL DE JUGADAS (estilo marcador casino) */}
        {playHistory.length > 0 && (
          <View style={styles.historyBar}>
            <Text style={styles.historyLabel}>HISTORIAL</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historyScroll}
            >
              {playHistory.map((entry: PlayHistoryEntry, i: number) => {
                const suitColors: Record<string, string> = {
                  H: '#FF453A', D: '#FF6060',  // rojos sobre fondo oscuro
                  C: '#E5E5EA', S: '#E5E5EA'   // blanco/gris claro sobre fondo oscuro
                };
                const suitEmojis: Record<string, string> = {
                  H: '♥', D: '♦', C: '♣', S: '♠'
                };
                const isRecent = i === 0;
                return (
                  <View key={i} style={[styles.historyEntry, isRecent && styles.historyEntryRecent]}>
                    {/* Iniciales del jugador */}
                    <Text style={[styles.historyPlayer, isRecent && styles.historyPlayerRecent]}>
                      {entry.playerName.slice(0, 2).toUpperCase()}
                    </Text>
                    {/* Cartas jugadas en miniatura */}
                    <View style={styles.historyCards}>
                      {entry.cards.map((c, ci) => (
                        <View key={ci} style={[styles.historyCard, isRecent && styles.historyCardRecent]}>
                          <Text style={[styles.historyCardText, { color: suitColors[c.suit] }]}>
                            {c.value}{suitEmojis[c.suit]}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 20% DE LA PANTALLA: MESA */}
        <View style={styles.tableArea}>
          <Text style={styles.sectionLabel}>MESA</Text>
          {lastPlayed.length > 0 ? (
            <View style={styles.tableBlock}>
              <View style={styles.cardsInTable}>
                {lastPlayed.map(c => renderCard(c, true))}
              </View>
              <Text style={styles.tableInfo}>
                Jugado por: <Text style={styles.highlightName}>{getLastPlayedPlayerName()}</Text>
              </Text>
            </View>
          ) : (
            <View style={styles.emptyTable}>
              <Text style={styles.emptyTableText}>La mesa está limpia</Text>
              <Text style={styles.emptyTableSub}>Tira cualquier carta de tu mano</Text>
            </View>
          )}
        </View>

        {/* 70% DE LA PANTALLA: MANO DEL JUGADOR */}
        <View style={styles.handArea}>
          <View style={styles.panelTitleRow}>
            <Text style={styles.sectionLabel}>TU MANO ({hand.length} cartas)</Text>
            {localPlayer?.role && (
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>{localPlayer.role}</Text>
              </View>
            )}
          </View>

          {localPlayer?.hasPassed ? (
            <View style={styles.passedScreen}>
              <Text style={styles.passedTitle}>¡Has Pasado!</Text>
              <Text style={styles.passedSub}>Espera a que se limpie la mesa para volver a jugar.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.handScroll,
                hand.length <= 5 && { flexGrow: 1, justifyContent: 'center' }
              ]}
            >
              {hand.map(c => renderCard(c, false))}
            </ScrollView>
          )}

          {/* Información del Estado del Turno de otros */}
          {!isMyTurn && (
            <View style={styles.waitNotice}>
              <Text style={styles.waitNoticeText}>
                Esperando a que juegue {activePlayer?.name}...
              </Text>
            </View>
          )}
        </View>

        {/* 10% DE LA PANTALLA: CONTROLES */}
        <View style={styles.controlsArea}>
          <TouchableOpacity 
            style={[
              styles.controlBtn, 
              styles.btnPass, 
              (!isMyTurn || lastPlayed.length === 0 || localPlayer?.hasPassed) && styles.controlBtnDisabled
            ]} 
            onPress={handlePass}
            disabled={!isMyTurn || lastPlayed.length === 0 || localPlayer?.hasPassed}
          >
            <Text style={styles.controlBtnTextPass}>PASAR</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.controlBtn, 
              styles.btnPlay, 
              (!isMyTurn || selectedCards.length === 0 || localPlayer?.hasPassed) && styles.controlBtnDisabled
            ]} 
            onPress={handlePlay}
            disabled={!isMyTurn || selectedCards.length === 0 || localPlayer?.hasPassed}
          >
            <Text style={styles.controlBtnTextPlay}>JUGAR</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#101014',
  },
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  infoText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  turnLabel: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '800',
  },
  btnExit: {
    backgroundColor: '#FF453A22',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnExitText: {
    color: '#FF453A',
    fontWeight: '700',
    fontSize: 12,
  },
  // 20% Mesa
  tableArea: {
    flex: 2,
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    marginTop: 12,
    padding: 12,
  },
  sectionLabel: {
    color: '#3A3A3C',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  tableBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsInTable: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tableInfo: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 8,
  },
  highlightName: {
    color: '#FFF',
    fontWeight: '700',
  },
  emptyTable: {
    alignItems: 'center',
  },
  emptyTableText: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyTableSub: {
    color: '#48484A',
    fontSize: 12,
    marginTop: 2,
  },
  // 70% Mano
  handArea: {
    flex: 5,
    marginTop: 12,
  },
  panelTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleTag: {
    backgroundColor: '#0A84FF22',
    borderColor: '#0A84FF',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleTagText: {
    color: '#0A84FF',
    fontSize: 10,
    fontWeight: '700',
  },
  passedScreen: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  passedTitle: {
    color: '#FF453A',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  passedSub: {
    color: '#8E8E93',
    fontSize: 13,
    textAlign: 'center',
  },
  waitNotice: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFD60A22',
    borderColor: '#FFD60A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  waitNoticeText: {
    color: '#FFD60A',
    fontSize: 12,
    fontWeight: '700',
  },
  // Mano UNO-style: scroll horizontal, cartas grandes
  handScroll: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  handCardWrapper: {
    marginHorizontal: 5,
  },
  handCardWrapperSelected: {
    transform: [{ translateY: -20 }],
  },
  // Carta mano (grande)
  card: {
    backgroundColor: '#FFF',
    width: 78,
    height: 116,
    borderRadius: 14,
    padding: 7,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardSelected: {
    backgroundColor: '#FFFBE6',
    borderColor: '#FFD60A',
    borderWidth: 2.5,
    shadowColor: '#FFD60A',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 12,
  },
  cardCorner: {
    alignItems: 'flex-start',
  },
  cardCornerBottom: {
    transform: [{ rotate: '180deg' }],
    alignSelf: 'flex-end',
  },
  cardCornerValue: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 17,
  },
  cardCornerSuit: {
    fontSize: 13,
    lineHeight: 15,
  },
  cardCenter: {
    textAlign: 'center',
    alignSelf: 'center',
  },
  // Carta mesa (más pequeña)
  cardTable: {
    width: 60,
    height: 88,
    borderRadius: 10,
    backgroundColor: '#FFF',
    padding: 5,
    justifyContent: 'space-between',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardSuit: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
  },
  // Historial de jugadas
  historyBar: {
    backgroundColor: '#0D0D10',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyLabel: {
    color: '#3A3A3C',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginRight: 8,
    writingDirection: 'ltr',
  },
  historyScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyEntry: {
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  historyEntryRecent: {
    borderColor: '#FFD60A',
    backgroundColor: '#1C1A0A',
  },
  historyPlayer: {
    color: '#48484A',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
  },
  historyPlayerRecent: {
    color: '#FFD60A',
  },
  historyCards: {
    flexDirection: 'row',
  },
  historyCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginHorizontal: 1,
  },
  historyCardRecent: {
    backgroundColor: '#3A3500',
  },
  historyCardText: {
    fontSize: 10,
    fontWeight: '800',
  },
  // 10% Controles
  controlsArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    height: 68,
  },
  controlBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  btnPass: {
    backgroundColor: '#8E8E9322',
    borderColor: '#8E8E93',
    borderWidth: 1,
  },
  btnPlay: {
    backgroundColor: '#34C759',
  },
  controlBtnDisabled: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
    opacity: 0.4,
  },
  controlBtnTextPass: {
    color: '#AEAEB2',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  controlBtnTextPlay: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
