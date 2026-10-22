import { useCameraPermissions } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PokemonCamera } from '@/components/pokemon-camera';
import { useTheme } from '@/hooks/use-theme';

export default function CameraScreen() {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [active, setActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const focused = useIsFocused();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setActive(state === 'active');
      if (state === 'active') {
        void getPermission().catch(() => setError('No se pudo comprobar el permiso de cámara.'));
      }
    });
    return () => subscription.remove();
  }, [getPermission]);

  const enableCamera = async () => {
    setRequesting(true);
    setError(null);
    try {
      if (permission && !permission.canAskAgain && Platform.OS !== 'web') {
        await Linking.openSettings();
      } else {
        await requestPermission();
      }
    } catch {
      setError('No se pudo solicitar el permiso. Revisa los permisos de cámara en los ajustes.');
    } finally {
      setRequesting(false);
    }
  };

  const blockedOnWeb = Platform.OS === 'web' && permission && !permission.granted && !permission.canAskAgain;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top + 16, paddingLeft: insets.left + 16, paddingRight: insets.right + 16 }]}>
      <Text style={[styles.title, { color: theme.text }]}>Cámara</Text>
      {!permission ? (
        <View style={styles.message}>
          <ActivityIndicator color={theme.text} accessibilityLabel="Comprobando permiso de cámara" />
        </View>
      ) : !permission.granted ? (
        <View style={styles.message}>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {blockedOnWeb
              ? 'Habilita el permiso de cámara en los ajustes de este sitio en tu navegador y recarga la página.'
              : permission.canAskAgain
                ? 'Permite el acceso a la cámara para tomar una foto.'
                : 'El permiso de cámara está bloqueado. Puedes habilitarlo en los ajustes de la aplicación.'}
          </Text>
          {!blockedOnWeb && (
            <Pressable onPress={enableCamera} disabled={requesting} accessibilityRole="button" accessibilityState={{ disabled: requesting }} style={[styles.button, { backgroundColor: theme.backgroundElement, opacity: requesting ? 0.5 : 1 }]}>
              <Text style={{ color: theme.text }}>{requesting ? 'Abriendo…' : permission.canAskAgain ? 'Permitir cámara' : 'Abrir ajustes'}</Text>
            </Pressable>
          )}
        </View>
      ) : focused && active ? (
        <PokemonCamera />
      ) : <View style={styles.message} />}
      {error && <Text accessibilityRole="alert" style={{ color: theme.text }}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 16, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  message: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  description: { textAlign: 'center', fontSize: 16, lineHeight: 24, maxWidth: 420 },
  button: { minHeight: 48, borderRadius: 12, padding: 16, justifyContent: 'center', alignItems: 'center' },
});
