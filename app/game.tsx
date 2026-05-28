import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '../src/stores/useGameStore';
import { Card, CardSuit, PlayHistoryEntry } from '../src/game/types';
import { isValidPlay } from '../src/game/rules';

export default function GameScreen() {
  const { room, socket, playCards, passTurn, leaveRoom } = useGameStore();
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!room || !socket) {
      const t = setTimeout(() => router.replace('/'), 2000);
      return () => clearTimeout(t);
    }
  }, [room, socket]);

  if (!room || !socket) {
    return (
      <View style={styles.fullContainer}>
        <Text style={styles.infoText}>Sala no disponible. Volviendo al menú...</Text>
      </View>
    );
  }

  const { players, currentTurnIndex, lastPlayed, lastPlayUserId, playHistory, forcedRule } = room.gameState;
  const activePlayer = players[currentTurnIndex];
  const isMyTurn = activePlayer?.id === socket.id;
  const localPlayer = players.find(p => p.id === socket.id);
  const hand = localPlayer?.cards || [];

  const suitMeta: Record<CardSuit, { emoji: string; color: string }> = {
    H: { emoji: '♥', color: '#E8001C' },
    D: { emoji: '♦', color: '#E8001C' },
    C: { emoji: '♣', color: '#000000' },
    S: { emoji: '♠', color: '#000000' },
  };

  const handleSelectCard = (card: Card) => {
    const suitNames: Record<string, string> = { H: 'Corazones', D: 'Rombos', C: 'Tréboles', S: 'Picas' };
    console.log(`Carta: ${card.value} de ${suitNames[card.suit]}`);
    const exists = selectedCards.find(c => c.id === card.id);
    if (exists) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else {
      if (selectedCards.length > 0 && selectedCards[0].value !== card.value) {
        setSelectedCards([card]);
      } else if (selectedCards.length < 4) {
        setSelectedCards([...selectedCards, card]);
      }
    }
  };

  const handlePlay = () => {
    if (selectedCards.length === 0) return;
    if (!isValidPlay(selectedCards, lastPlayed, forcedRule)) {
      const msg = forcedRule === 'seven'
        ? 'Regla del 7: debes jugar un 7 u 8.'
        : forcedRule === 'eight'
        ? 'Regla del 8: debes jugar igual o menor.'
        : 'Jugada no válida. Mismas cartas y valor superior.';
      alert(msg);
      return;
    }
    playCards(selectedCards);
    setSelectedCards([]);
  };

  const handlePass = () => { passTurn(); setSelectedCards([]); };

  const getLastPlayedPlayerName = () => {
    if (!lastPlayUserId) return '';
    return players.find(p => p.id === lastPlayUserId)?.name ?? 'Alguien';
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
        <Text style={[styles.cardCenter, { color, fontSize: forTable ? 20 : 28 }]}>{emoji}</Text>
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
        activeOpacity={0.8}
        onPress={() => handleSelectCard(card)}
        style={[styles.handCardWrapper, isSelected && styles.handCardWrapperSelected]}
      >
        {content}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.outerRow}>

        {/* ===== SIDEBAR: LISTA DE JUGADORES ===== */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>JUGADORES</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {players.map((p, i) => {
              const isActive = i === currentTurnIndex;
              const isMe = p.id === socket.id;
              const finished = p.cards.length === 0;
              return (
                <View
                  key={p.id}
                  style={[
                    styles.sidebarPlayer,
                    isActive && styles.sidebarPlayerActive,
                    finished && styles.sidebarPlayerFinished,
                  ]}
                >
                  <Text
                    style={[styles.sidebarName, isActive && styles.sidebarNameActive]}
                    numberOfLines={1}
                  >
                    {isMe ? '★ ' : ''}{p.name}
                  </Text>
                  <View style={[styles.sidebarBadge, isActive && styles.sidebarBadgeActive]}>
                    <Text style={[styles.sidebarCount, isActive && styles.sidebarCountActive]}>
                      {finished ? '✔' : p.cards.length}
                    </Text>
                  </View>
                  {p.hasPassed && !finished && (
                    <Text style={styles.sidebarPassed}>PASO</Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ===== ÁREA PRINCIPAL ===== */}
        <View style={styles.mainArea}>

          {/* CABECERA */}
          <View style={styles.header}>
            <TouchableOpacity onPress={leaveRoom} style={styles.btnExit}>
              <Text style={styles.btnExitText}>Salir</Text>
            </TouchableOpacity>
          </View>

          {/* HISTORIAL */}
          {playHistory.length > 0 && (
            <View style={styles.historyBar}>
              <Text style={styles.historyLabel}>▶</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
                {playHistory.map((entry: PlayHistoryEntry, i: number) => {
                  const sc: Record<string, string> = { H: '#FF453A', D: '#FF6060', C: '#E5E5EA', S: '#E5E5EA' };
                  const se: Record<string, string> = { H: '♥', D: '♦', C: '♣', S: '♠' };
                  const isRecent = i === 0;
                  return (
                    <View key={i} style={[styles.historyEntry, isRecent && styles.historyEntryRecent]}>
                      <Text style={[styles.historyPlayer, isRecent && styles.historyPlayerRecent]}>
                        {entry.playerName.slice(0, 2).toUpperCase()}
                      </Text>
                      <View style={styles.historyCards}>
                        {entry.cards.map((c, ci) => (
                          <View key={ci} style={[styles.historyCard, isRecent && styles.historyCardRecent]}>
                            <Text style={[styles.historyCardText, { color: sc[c.suit] }]}>
                              {c.value}{se[c.suit]}
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

          {/* MESA */}
          <View style={styles.tableArea}>
            <Text style={styles.sectionLabel}>MESA</Text>
            {lastPlayed.length > 0 ? (
              <View style={styles.tableBlock}>
                <View style={styles.cardsInTable}>
                  {lastPlayed.map(c => renderCard(c, true))}
                </View>
                <Text style={styles.tableInfo}>
                  Por: <Text style={styles.highlightName}>{getLastPlayedPlayerName()}</Text>
                </Text>
              </View>
            ) : (
              <View style={styles.emptyTable}>
                <Text style={styles.emptyTableText}>Mesa limpia</Text>
                <Text style={styles.emptyTableSub}>Tira cualquier carta</Text>
              </View>
            )}
          </View>

          {/* MANO */}
          <View style={styles.handArea}>
            <View style={styles.panelTitleRow}>
              <Text style={styles.sectionLabel}>TU MANO ({hand.length})</Text>
              {localPlayer?.role && (
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>{localPlayer.role}</Text>
                </View>
              )}
            </View>

            {localPlayer?.hasPassed ? (
              <View style={styles.passedScreen}>
                <Text style={styles.passedTitle}>⏸ Pasado</Text>
                <Text style={styles.passedSub}>Espera a que se limpie la mesa.</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.handScroll,
                  hand.length <= 4 && { flexGrow: 1, justifyContent: 'center' }
                ]}
              >
                {hand.map(c => renderCard(c, false))}
              </ScrollView>
            )}


          </View>

          {/* CONTROLES */}
          <View style={styles.controlsArea}>
            <TouchableOpacity
              style={[
                styles.controlBtn, styles.btnPass,
                (!isMyTurn || lastPlayed.length === 0 || localPlayer?.hasPassed) && styles.controlBtnDisabled
              ]}
              onPress={handlePass}
              disabled={!isMyTurn || lastPlayed.length === 0 || localPlayer?.hasPassed}
            >
              <Text style={styles.controlBtnTextPass}>PASAR</Text>
            </TouchableOpacity>

            {(() => {
              const canPlay = isMyTurn && selectedCards.length > 0 && !localPlayer?.hasPassed;
              const playValid = canPlay && isValidPlay(selectedCards, lastPlayed, forcedRule);
              return (
                <TouchableOpacity
                  style={[
                    styles.controlBtn,
                    playValid ? styles.btnPlayValid : (canPlay ? styles.btnPlayInvalid : styles.controlBtnDisabled),
                  ]}
                  onPress={handlePlay}
                  disabled={!canPlay}
                >
                  <Text style={[styles.controlBtnTextPlay, !playValid && canPlay && { color: '#FF453A' }]}>
                    {selectedCards.length > 0 ? `JUGAR (${selectedCards.length})` : 'JUGAR'}
                  </Text>
                </TouchableOpacity>
              );
            })()}
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#101014' },
  fullContainer: { flex: 1, backgroundColor: '#101014', justifyContent: 'center', alignItems: 'center' },
  outerRow: { flex: 1, flexDirection: 'row' },
  infoText: { color: '#FFF', fontSize: 16 },

  // SIDEBAR
  sidebar: {
    width: 72,
    backgroundColor: '#0D0D10',
    paddingTop: 12,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: '#2C2C2E',
  },
  sidebarTitle: {
    color: '#3A3A3C', fontSize: 7, fontWeight: '900',
    letterSpacing: 0.8, textAlign: 'center', marginBottom: 8,
  },
  sidebarPlayer: {
    alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2,
    borderRadius: 10, marginBottom: 6, backgroundColor: '#1C1C1E',
    borderWidth: 1.5, borderColor: '#2C2C2E',
  },
  sidebarPlayerActive: {
    borderColor: '#FFD60A', borderWidth: 2, backgroundColor: '#201D05',
    shadowColor: '#FFD60A', shadowOpacity: 0.75, shadowRadius: 12, elevation: 10,
  },
  sidebarPlayerFinished: {
    borderColor: '#34C759', backgroundColor: '#051208', opacity: 0.6,
  },
  sidebarName: { color: '#8E8E93', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  sidebarNameActive: { color: '#FFD60A' },
  sidebarBadge: {
    marginTop: 4, backgroundColor: '#2C2C2E', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2, minWidth: 26, alignItems: 'center',
  },
  sidebarBadgeActive: { backgroundColor: '#3A3500' },
  sidebarCount: { color: '#AEAEB2', fontSize: 13, fontWeight: '900' },
  sidebarCountActive: { color: '#FFD60A' },
  sidebarPassed: { color: '#FF453A', fontSize: 7, fontWeight: '900', marginTop: 2 },

  // MAIN
  mainArea: { flex: 1, padding: 10, justifyContent: 'space-between' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#1C1C1E',
  },
  turnLabel: { color: '#34C759', fontSize: 14, fontWeight: '800', flex: 1 },
  btnExit: {
    backgroundColor: '#FF453A22', paddingVertical: 5,
    paddingHorizontal: 10, borderRadius: 8, marginLeft: 8,
  },
  btnExitText: { color: '#FF453A', fontWeight: '700', fontSize: 11 },

  historyBar: {
    backgroundColor: '#0D0D10', borderRadius: 10, paddingVertical: 5,
    paddingHorizontal: 6, marginTop: 6, borderWidth: 1, borderColor: '#2C2C2E',
    flexDirection: 'row', alignItems: 'center',
  },
  historyLabel: { color: '#3A3A3C', fontSize: 10, marginRight: 6 },
  historyScroll: { flexDirection: 'row', alignItems: 'center' },
  historyEntry: {
    alignItems: 'center', marginRight: 6, backgroundColor: '#1C1C1E',
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 3,
    borderWidth: 1, borderColor: '#2C2C2E',
  },
  historyEntryRecent: { borderColor: '#FFD60A', backgroundColor: '#1C1A0A' },
  historyPlayer: { color: '#48484A', fontSize: 8, fontWeight: '700', marginBottom: 1 },
  historyPlayerRecent: { color: '#FFD60A' },
  historyCards: { flexDirection: 'row' },
  historyCard: {
    backgroundColor: '#2C2C2E', borderRadius: 3,
    paddingHorizontal: 2, paddingVertical: 1, marginHorizontal: 1,
  },
  historyCardRecent: { backgroundColor: '#3A3500' },
  historyCardText: { fontSize: 9, fontWeight: '800' },

  tableArea: {
    flex: 2, justifyContent: 'center', backgroundColor: '#1C1C1E',
    borderRadius: 16, marginTop: 8, padding: 10,
  },
  sectionLabel: {
    color: '#3A3A3C', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4,
  },
  tableBlock: { alignItems: 'center', justifyContent: 'center' },
  cardsInTable: { flexDirection: 'row', justifyContent: 'center' },
  tableInfo: { color: '#8E8E93', fontSize: 11, marginTop: 6 },
  highlightName: { color: '#FFF', fontWeight: '700' },
  emptyTable: { alignItems: 'center' },
  emptyTableText: { color: '#34C759', fontSize: 14, fontWeight: '800' },
  emptyTableSub: { color: '#48484A', fontSize: 11, marginTop: 2 },

  handArea: { flex: 5, marginTop: 8 },
  panelTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  roleTag: {
    backgroundColor: '#0A84FF22', borderColor: '#0A84FF',
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  roleTagText: { color: '#0A84FF', fontSize: 9, fontWeight: '700' },
  passedScreen: {
    flex: 1, backgroundColor: '#1C1C1E', borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  passedTitle: { color: '#FF453A', fontSize: 18, fontWeight: '900', marginBottom: 6 },
  passedSub: { color: '#8E8E93', fontSize: 12, textAlign: 'center' },
  waitNotice: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFD60A22', borderColor: '#FFD60A', borderWidth: 1,
    borderRadius: 10, padding: 8, alignItems: 'center',
  },
  waitNoticeText: { color: '#FFD60A', fontSize: 11, fontWeight: '700' },
  handScroll: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 12 },
  handCardWrapper: { marginHorizontal: 4 },
  handCardWrapperSelected: { transform: [{ translateY: -20 }] },

  card: {
    backgroundColor: '#FFF', width: 66, height: 100, borderRadius: 12,
    padding: 6, justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  cardSelected: {
    backgroundColor: '#FFFBE6', borderColor: '#FFD60A', borderWidth: 2.5,
    shadowColor: '#FFD60A', shadowOpacity: 0.6, shadowRadius: 10, elevation: 12,
  },
  cardCorner: { alignItems: 'flex-start' },
  cardCornerBottom: { transform: [{ rotate: '180deg' }], alignSelf: 'flex-end' },
  cardCornerValue: { fontSize: 13, fontWeight: '900', lineHeight: 15 },
  cardCornerSuit: { fontSize: 11, lineHeight: 13 },
  cardCenter: { textAlign: 'center', alignSelf: 'center' },

  cardTable: {
    width: 50, height: 74, borderRadius: 8, backgroundColor: '#FFF',
    padding: 4, justifyContent: 'space-between', marginHorizontal: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 3, elevation: 3,
    borderWidth: 1, borderColor: '#E0E0E0',
  },

  controlsArea: { flexDirection: 'row', alignItems: 'center', marginTop: 8, height: 58 },
  controlBtn: {
    flex: 1, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', marginHorizontal: 4,
  },
  btnPass: { backgroundColor: '#8E8E9322', borderColor: '#8E8E93', borderWidth: 1 },
  btnPlayValid: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759', shadowOpacity: 0.45, shadowRadius: 10, elevation: 8,
  },
  btnPlayInvalid: { backgroundColor: '#3A1A1A', borderColor: '#FF453A', borderWidth: 1.5 },
  controlBtnDisabled: { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E', opacity: 0.3 },
  controlBtnTextPass: { color: '#AEAEB2', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  controlBtnTextPlay: { color: '#000', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
