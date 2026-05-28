import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useGameStore } from '../src/stores/useGameStore';

export default function HomeScreen() {
  const { 
    playerName, 
    setPlayerName, 
    roomCode, 
    setRoomCode, 
    createRoom, 
    joinRoom, 
    isConnected, 
    error, 
    clearError 
  } = useGameStore();

  const [inputCode, setInputCode] = useState('');

  const handleCreate = () => {
    if (!playerName.trim()) {
      alert('Por favor, ingresa tu nombre primero.');
      return;
    }
    createRoom();
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      alert('Por favor, ingresa tu nombre primero.');
      return;
    }
    if (!inputCode.trim()) {
      alert('Por favor, ingresa el código de sala.');
      return;
    }
    joinRoom(inputCode);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* Título */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🃏</Text>
          <Text style={styles.title}>Capitalista</Text>
          <Text style={styles.subtitle}>El juego de cartas MVP</Text>
        </View>

        {/* Estado Servidor */}
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CD964' : '#FF3B30' }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Servidor Conectado' : 'Conectando al servidor...'}
          </Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Text style={styles.label}>TU NOMBRE</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Ana, Luis, Carlos"
            placeholderTextColor="#666"
            value={playerName}
            onChangeText={setPlayerName}
            maxLength={12}
            autoCorrect={false}
          />

          <View style={styles.divider} />

          {/* Acción Crear */}
          <TouchableOpacity 
            style={[styles.btn, styles.btnCreate, !isConnected && styles.btnDisabled]} 
            onPress={handleCreate}
            disabled={!isConnected}
          >
            <Text style={styles.btnText}>Crear sala</Text>
          </TouchableOpacity>

          <View style={styles.orContainer}>
            <View style={styles.orLine} /><Text style={styles.orText}>Ó</Text><View style={styles.orLine} />
          </View>

          {/* Acción Unirse */}
          <Text style={styles.label}>CÓDIGO DE SALA</Text>
          <View style={styles.joinRow}>
            <TextInput
              style={[styles.input, styles.inputCode]}
              placeholder="X7KP4M"
              placeholderTextColor="#666"
              value={inputCode}
              onChangeText={(text) => setInputCode(text.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={[styles.btnJoin, !isConnected && styles.btnDisabled]} 
              onPress={handleJoin}
              disabled={!isConnected}
            >
              <Text style={styles.btnJoinText}>Unirse</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Errores del Server */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError} style={styles.errorClose}>
              <Text style={styles.errorCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.footer}>Cero Fricción · Partidas Efímeras</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101014',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 32,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#AEAEB2',
    fontSize: 12,
    fontWeight: '600',
  },
  form: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  label: {
    color: '#3A3A3C',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2C2C2E',
    color: '#FFF',
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginVertical: 12,
  },
  btn: {
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnCreate: {
    backgroundColor: '#34C759', // Verde brillante casino
  },
  btnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2C2C2E',
  },
  orText: {
    color: '#48484A',
    fontWeight: '700',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  joinRow: {
    flexDirection: 'row',
  },
  inputCode: {
    flex: 1,
    marginRight: 12,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 0,
  },
  btnJoin: {
    backgroundColor: '#0A84FF', // Azul brillante
    width: 100,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnJoinText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FF453A22',
    borderColor: '#FF453A',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF453A',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  errorClose: {
    paddingLeft: 12,
  },
  errorCloseText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    color: '#48484A',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 40,
  },
});
