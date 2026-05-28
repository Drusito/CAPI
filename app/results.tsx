import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useGameStore } from '../src/stores/useGameStore';

export default function ResultsScreen() {
  const { room, playAgain, leaveRoom } = useGameStore();

  if (!room) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Conexión perdida...</Text>
      </View>
    );
  }

  const { players, winnerOrder } = room.gameState;

  // Ordenar jugadores según su posición final para renderizar el podio
  const sortedPlayers = [...players].sort((a, b) => {
    const aPlace = a.finishedPlace || 99;
    const bPlace = b.finishedPlace || 99;
    return aPlace - bPlace;
  });

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'Capitalista': return { bg: '#FFD60A22', border: '#FFD60A', text: '#FFD60A' };
      case 'Vice-Capitalista': return { bg: '#FF9F0A22', border: '#FF9F0A', text: '#FF9F0A' };
      case 'Neutro': return { bg: '#8E8E9322', border: '#8E8E93', text: '#AEAEB2' };
      case 'Vice-Vagabundo': return { bg: '#BF5AF222', border: '#BF5AF2', text: '#BF5AF2' };
      case 'Vagabundo': return { bg: '#FF453A22', border: '#FF453A', text: '#FF453A' };
      default: return { bg: '#2C2C2E', border: '#48484A', text: '#8E8E93' };
    }
  };

  const getPlaceEmoji = (place: number) => {
    if (place === 1) return '🏆';
    if (place === 2) return '🥈';
    if (place === 3) return '🥉';
    return '🎖️';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emojiMain}>🎉</Text>
        <Text style={styles.title}>Resultados</Text>
        <Text style={styles.subtitle}>Las jerarquías han quedado definidas</Text>
      </View>

      {/* Podio central */}
      <Text style={styles.podioLabel}>PODIO DE LA PARTIDA</Text>
      <ScrollView style={styles.podioScroll} showsVerticalScrollIndicator={false}>
        {sortedPlayers.map((player) => {
          const place = player.finishedPlace || 99;
          const badge = getRoleBadgeColor(player.role);
          
          return (
            <View key={player.id} style={styles.playerCard}>
              <View style={styles.playerMainRow}>
                <Text style={styles.placeText}>{getPlaceEmoji(place)} {place}º</Text>
                <Text style={styles.playerName}>{player.name}</Text>
              </View>

              {player.role && (
                <View style={[styles.roleBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                  <Text style={[styles.roleText, { color: badge.text }]}>
                    {player.role.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Botones de control */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btn, styles.btnAgain]} onPress={playAgain}>
          <Text style={styles.btnAgainText}>JUGAR OTRA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnExit]} onPress={leaveRoom}>
          <Text style={styles.btnExitText}>Salir al menú principal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101014',
    padding: 24,
    justifyContent: 'space-between',
  },
  infoText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 16,
  },
  emojiMain: {
    fontSize: 54,
    marginBottom: 8,
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 2,
    textAlign: 'center',
  },
  podioLabel: {
    color: '#3A3A3C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 16,
  },
  podioScroll: {
    flex: 1,
    marginBottom: 24,
  },
  playerCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  placeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    width: 60,
  },
  playerName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  roleBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footer: {
    marginBottom: 20,
  },
  btn: {
    height: 56, // Botones grandes de 56px
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAgain: {
    backgroundColor: '#FFD60A',
    marginBottom: 12,
  },
  btnAgainText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '900',
  },
  btnExit: {
    backgroundColor: '#1C1C1E',
  },
  btnExitText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '700',
  },
});
