import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePokemons } from '@/hooks/use-pokemons';
import { usePokemonHaptics } from '@/hooks/use-pokemon-haptics';
import { useTheme } from '@/hooks/use-theme';
import { POKEMON_LIMIT } from '@/services/pokemon';

export default function Index() {
  const player = useAudioPlayer(null, { updateInterval: 50 });
  const stopHaptics = usePokemonHaptics(player);
  const { pokemons, loading, error, retry } = usePokemons();
  const [audioError, setAudioError] = useState<string | null>(null);
  const [hapticError, setHapticError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.error) {
        stopHaptics();
        setAudioError('No se pudo reproducir el sonido. Revisa tu conexión e inténtalo otra vez.');
      }
    });
    return () => subscription.remove();
  }, [player, stopHaptics]);

  const testHaptics = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setHapticError(null);
    } catch {
      setHapticError('No se pudo activar la vibración. Revisa los ajustes de vibración del teléfono.');
    }
  };

  const openCamera = () => {
    stopHaptics();
    player.pause();
    router.navigate('/camera');
  };

  const playCry = (uri: string | null) => {
    if (!uri) return;
    stopHaptics();
    try {
      player.replace({ uri });
      player.play();
      setAudioError(null);
    } catch {
      stopHaptics();
      setAudioError('No se pudo reproducir el sonido.');
    }
  };

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      data={pokemons}
      keyExtractor={(pokemon) => String(pokemon.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Pokémon</Text>
          <Text style={{ color: theme.textSecondary }}>
            {pokemons.length} de {POKEMON_LIMIT} Pokémon cargados
          </Text>
          <Text style={{ color: theme.textSecondary }}>Toca un Pokémon para escuchar su sonido y sentir la vibración.</Text>
          <View style={styles.actions}>
            <Pressable onPress={testHaptics} accessibilityRole="button" style={styles.retry}>
              <Text style={{ color: theme.text }}>Probar vibración</Text>
            </Pressable>
            <Pressable onPress={openCamera} accessibilityRole="button" style={styles.retry}>
              <Text style={{ color: theme.text }}>Abrir cámara</Text>
            </Pressable>
          </View>
          {hapticError && <Text accessibilityRole="alert" style={{ color: theme.text }}>{hapticError}</Text>}
          {audioError && <Text style={{ color: theme.text }}>{audioError}</Text>}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => playCry(item.cry)}
          disabled={!item.cry}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, número ${item.id}`}
          accessibilityHint={item.cry ? 'Reproduce el sonido del Pokémon' : 'Sin sonido disponible'}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.img} />
          ) : (
            <View style={styles.img} />
          )}
          <View style={styles.details}>
            <Text style={[styles.name, { color: theme.text }]}>
              #{String(item.id).padStart(3, '0')} {item.name}
            </Text>
            <Text style={[styles.types, { color: theme.textSecondary }]}>
              Tipos: {item.types.join(' / ')}
            </Text>
            <Text style={{ color: theme.textSecondary }}>
              Altura: {item.height.toFixed(1)} m · Peso: {item.weight.toFixed(1)} kg
            </Text>
            <Text style={{ color: theme.textSecondary }}>
              Habilidades: {item.abilities.join(', ').replace(/-/g, ' ')}
            </Text>
          </View>
        </Pressable>
      )}
      ListFooterComponent={
        <View style={styles.footer}>
          {loading ? (
            <ActivityIndicator color={theme.text} accessibilityLabel="Cargando Pokémon" />
          ) : error ? (
            <>
              <Text style={{ color: theme.text }}>{error}</Text>
              <Pressable onPress={retry} accessibilityRole="button" style={styles.retry}>
                <Text style={{ color: theme.text }}>Reintentar carga</Text>
              </Pressable>
            </>
          ) : (
            <Text style={{ color: theme.textSecondary }}>Lista completa: {POKEMON_LIMIT} Pokémon.</Text>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 8 },
  header: { gap: 8, paddingBottom: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12 },
  img: { width: 64, height: 64 },
  details: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: '600', textTransform: 'capitalize' },
  types: { textTransform: 'capitalize' },
  footer: { padding: 16, gap: 12, alignItems: 'center' },
  retry: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#808080' },
});
