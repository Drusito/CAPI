import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Share } from 'react-native';
import { useGameStore } from '../src/stores/useGameStore';

export default function LobbyScreen() {
  const { room, roomCode, leaveRoom, startGame } = useGameStore();

  if (!room) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Cargando datos de la sala...</Text>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Únete a mi partida de Capitalista! Código: ${roomCode}`,
      });
    } catch (e) {
      console.log('Error compartiendo código', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sala de Espera</Text>
        <Text style={styles.subtitle}>Comparte el código con tus amigos</Text>
      </View>

      {/* Tarjeta de Código de Sala */}
      <TouchableOpacity style={styles.codeCard} onPress={handleShare} activeOpacity={0.8}>
        <Text style={styles.codeLabel}>CÓDIGO DE SALA (Toca para compartir)</Text>
        <Text style={styles.codeText}>{roomCode}</Text>
      </TouchableOpacity>

      <Text style={styles.playersTitle}>JUGADORES ({room.players.length})</Text>

      {/* Lista de Jugadores unificados */}
      <ScrollView style={styles.playersList}>
        {room.players.map((player, idx) => {
          const isHost = idx === 0;
          return (
            <View key={player.id || idx} style={styles.playerItem}>
              <View style={styles.playerInfoRow}>
                <Text style={styles.playerEmoji}>👤</Text>
                <Text style={styles.playerName}>
                  {player.name} {isHost && <Text style={styles.hostBadge}>(Host)</Text>}
                </Text>
              </View>
              {player.role && (
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>{player.role}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Botón de Iniciar */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btn, styles.btnStart, room.players.length < 2 && styles.btnDisabled]}
          onPress={startGame}
          disabled={room.players.length < 2}
        >
          <Text style={styles.btnStartText}>
            {room.players.length < 2 ? 'Faltan jugadores...' : 'Empezar Partida'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnLeave]} onPress={leaveRoom}>
          <Text style={styles.btnLeaveText}>Salir de la sala</Text>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  codeCard: {
    backgroundColor: '#1C1C1E',
    borderColor: '#3A3A3C',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
  },
  codeLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  codeText: {
    color: '#0A84FF',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 4,
  },
  playersTitle: {
    color: '#3A3A3C',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  playersList: {
    flex: 1,
    marginBottom: 24,
  },
  playerItem: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  playerName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  hostBadge: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: 'normal',
  },
  roleTag: {
    backgroundColor: '#34C75944',
    borderColor: '#34C759',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleTagText: {
    color: '#34C759',
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    marginBottom: 20,
  },
  btn: {
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnStart: {
    backgroundColor: '#34C759',
    marginBottom: 12,
  },
  btnDisabled: {
    backgroundColor: '#2C2C2E',
    opacity: 0.6,
  },
  btnStartText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
  btnLeave: {
    backgroundColor: '#FF453A22',
  },
  btnLeaveText: {
    color: '#FF453A',
    fontSize: 16,
    fontWeight: '700',
  },
});
