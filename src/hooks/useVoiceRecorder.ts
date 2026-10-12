/**
 * Grabación de notas de voz con expo-audio (SDK 56).
 *
 * Capa fina sobre el módulo NATIVO de audio (no existe en Node/Jest): permisos
 * de micrófono, modo de audio, grabar/detener y el archivo resultante. La
 * lógica de negocio (archivo a subir, límite de duración) vive en
 * `services/assistant` y está probada allí.
 *
 * Formato: AAC en contenedor .m4a, mono, 64 kbps — suficiente para voz y
 * ~7 MB en el máximo de 15 min (el servidor admite hasta 25 MB).
 */
import { useCallback, useEffect, useState } from 'react';
import {
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from 'expo-audio';

import { audioFileFromRecording, MAX_RECORDING_SECONDS } from '@/services/assistant';
import type { AudioFile } from '@/types/assistant';

const VOICE_NOTE: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64000,
};

export interface VoiceRecorderState {
  isRecording: boolean;
  durationMillis: number;
  /** Mensaje para el usuario (permiso denegado, fallo del micrófono). */
  error: string | null;
  start: () => Promise<void>;
  /** Detiene y devuelve el archivo grabado (null si no había grabación). */
  stop: () => Promise<AudioFile | null>;
  /** Detiene y descarta la grabación en curso. */
  cancel: () => Promise<void>;
}

export function useVoiceRecorder(): VoiceRecorderState {
  const recorder = useAudioRecorder(VOICE_NOTE);
  const state = useAudioRecorderState(recorder, 250);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const current = await getRecordingPermissionsAsync();
      const permission = current.granted
        ? current
        : await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError(
          'Sin permiso de micrófono. Actívalo en los ajustes del teléfono para dictar.',
        );
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: MAX_RECORDING_SECONDS });
    } catch {
      setError('No se pudo iniciar la grabación. Inténtalo de nuevo.');
    }
  }, [recorder]);

  const stop = useCallback(async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      return recorder.uri ? audioFileFromRecording(recorder.uri) : null;
    } catch {
      setError('No se pudo guardar la grabación. Inténtalo de nuevo.');
      return null;
    }
  }, [recorder]);

  const cancel = useCallback(async () => {
    if (!recorder.isRecording) return;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
    } catch {
      // Nada que conservar.
    }
  }, [recorder]);

  // Salir de la pantalla con una grabación en curso la detiene.
  useEffect(
    () => () => {
      if (recorder.isRecording) void recorder.stop();
    },
    [recorder],
  );

  return {
    isRecording: state.isRecording,
    durationMillis: state.durationMillis,
    error,
    start,
    stop,
    cancel,
  };
}
