import { CameraView, type CameraType } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function PokemonCamera() {
  const camera = useRef<CameraView>(null);
  const mounted = useRef(true);
  const busy = useRef(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mountError, setMountError] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const takePhoto = async () => {
    if (!camera.current || !ready || busy.current) return;
    busy.current = true;
    setCapturing(true);
    setError(null);
    try {
      const result = await camera.current.takePictureAsync({ quality: 0.8 });
      if (mounted.current) {
        setReady(false);
        setPhoto(result.uri);
      }
    } catch {
      if (mounted.current) setError('No se pudo tomar la foto. Inténtalo de nuevo.');
    } finally {
      busy.current = false;
      if (mounted.current) setCapturing(false);
    }
  };

  const resetCamera = () => {
    setReady(false);
    setError(null);
    setMountError(false);
    setPhoto(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.preview}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.fill} resizeMode="contain" accessibilityLabel="Foto capturada" />
        ) : !mountError ? (
          <>
            <CameraView
              key={facing}
              ref={camera}
              style={styles.fill}
              facing={facing}
              mode="picture"
              onCameraReady={() => setReady(true)}
              onMountError={() => {
                setReady(false);
                setMountError(true);
                setError('No se pudo abrir la cámara. Revisa que otra aplicación no la esté usando.');
              }}
            />
            {!ready && <ActivityIndicator style={StyleSheet.absoluteFill} color="#ffffff" accessibilityLabel="Abriendo cámara" />}
          </>
        ) : null}
      </View>
      {error && <Text accessibilityRole="alert" style={{ color: theme.text }}>{error}</Text>}
      {photo ? (
        <>
          <Text style={{ color: theme.textSecondary }}>Vista previa de la foto. No se guarda en la galería.</Text>
          <Pressable onPress={resetCamera} accessibilityRole="button" style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
            <Text style={{ color: theme.text }}>Tomar otra foto</Text>
          </Pressable>
        </>
      ) : mountError ? (
        <Pressable onPress={resetCamera} accessibilityRole="button" style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
          <Text style={{ color: theme.text }}>Reintentar cámara</Text>
        </Pressable>
      ) : (
        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              setReady(false);
              setError(null);
              setFacing((current) => current === 'back' ? 'front' : 'back');
            }}
            disabled={!ready || capturing}
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready || capturing }}
            style={[styles.button, styles.action, { backgroundColor: theme.backgroundElement, opacity: !ready || capturing ? 0.5 : 1 }]}>
            <Text style={{ color: theme.text }}>Cambiar cámara</Text>
          </Pressable>
          <Pressable
            onPress={takePhoto}
            disabled={!ready || capturing}
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready || capturing, busy: capturing }}
            style={[styles.button, styles.action, { backgroundColor: theme.text, opacity: !ready || capturing ? 0.5 : 1 }]}>
            {capturing ? <ActivityIndicator color={theme.background} /> : <Text style={{ color: theme.background }}>Tomar foto</Text>}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 16 },
  preview: { flex: 1, minHeight: 180, borderRadius: 16, overflow: 'hidden', backgroundColor: '#111111' },
  fill: { width: '100%', height: '100%' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  action: { flexGrow: 1 },
  button: { minHeight: 48, borderRadius: 12, padding: 16, justifyContent: 'center', alignItems: 'center' },
});
