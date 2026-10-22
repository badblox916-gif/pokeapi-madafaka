import type { AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { AppState, Platform, Vibration } from 'react-native';

const PULSE_INTERVAL_MS = 80;

export function usePokemonHaptics(player: AudioPlayer) {
  const stopRef = useRef<() => void>(() => {});
  const stopHaptics = useCallback(() => stopRef.current(), []);

  useFocusEffect(useCallback(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let foreground = AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
    let unavailable = false;

    const stop = () => {
      if (interval === undefined) return;
      clearInterval(interval);
      interval = undefined;
      // En Android también interrumpe el último pulso que siga en curso.
      if (Platform.OS === 'android') Vibration.cancel();
    };
    stopRef.current = stop;

    const pulse = () => {
      if (!foreground || !player.playing || !player.isLoaded || player.isBuffering) {
        stop();
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {
        // Un dispositivo sin soporte háptico debe poder seguir reproduciendo audio.
        unavailable = true;
        stop();
      });
    };

    const playback = player.addListener('playbackStatusUpdate', (status) => {
      if (unavailable || !foreground || !status.isLoaded || !status.playing ||
          status.isBuffering || status.didJustFinish || status.error) {
        stop();
        return;
      }
      if (interval !== undefined) return;
      interval = setInterval(pulse, PULSE_INTERVAL_MS);
      pulse();
    });

    const appState = AppState.addEventListener('change', (state) => {
      foreground = state === 'active';
      if (!foreground) stop();
    });

    return () => {
      playback.remove();
      appState.remove();
      stop();
      stopRef.current = () => {};
    };
  }, [player]));

  return stopHaptics;
}
