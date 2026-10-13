/**
 * Integración REAL del selector de servidor contra `../open-chepicare-web`.
 * El health check golpea `<url>/up` (health check de Rails).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import {
  checkServerHealth,
  getApiBaseUrl,
  getDefaultApiBaseUrl,
  loadServerUrl,
  normalizeServerUrl,
  resetServerUrl,
  setServerUrl,
} from '@/config/serverConfig';

afterEach(async () => {
  await resetServerUrl();
});

describe('normalizeServerUrl', () => {
  it('añade esquema https si falta y quita barras finales', () => {
    expect(normalizeServerUrl('pawcare.example.com/')).toBe(
      'https://pawcare.example.com',
    );
    expect(normalizeServerUrl('  http://10.0.2.2:3000//  ')).toBe('http://10.0.2.2:3000');
    expect(normalizeServerUrl('https://x.com')).toBe('https://x.com');
    expect(normalizeServerUrl('')).toBe('');
  });
});

describe('checkServerHealth (real)', () => {
  it('responde ok contra el backend en ejecución', async () => {
    // Misma fuente de verdad que jest.setup.ts: el backend real configurado.
    const backendUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
    const health = await checkServerHealth(backendUrl);
    expect(health.ok).toBe(true);
    expect(typeof health.latencyMs).toBe('number');
  }, 15000);

  it('devuelve ok:false ante un host inexistente (sin lanzar)', async () => {
    const health = await checkServerHealth('http://127.0.0.1:59999', 2000);
    expect(health.ok).toBe(false);
    expect(health.latencyMs).toBeNull();
  }, 10000);
});

describe('setServerUrl / getApiBaseUrl / reset', () => {
  it('activa y persiste la URL elegida en almacenamiento seguro, y la restablece', async () => {
    const def = getDefaultApiBaseUrl();

    const saved = await setServerUrl('http://192.168.1.50:3000/');
    expect(saved).toBe('http://192.168.1.50:3000');
    expect(getApiBaseUrl()).toBe('http://192.168.1.50:3000');
    expect(await SecureStore.getItemAsync('pawcare.server_url')).toBe(
      'http://192.168.1.50:3000',
    );

    await resetServerUrl();
    expect(getApiBaseUrl()).toBe(def);
    expect(await SecureStore.getItemAsync('pawcare.server_url')).toBeNull();
  });

  it('restaura la URL guardada al arrancar', async () => {
    await SecureStore.setItemAsync('pawcare.server_url', 'https://clinica.example.com');
    await loadServerUrl();
    expect(getApiBaseUrl()).toBe('https://clinica.example.com');
  });

  it('migra la URL de instalaciones anteriores (AsyncStorage) al almacenamiento seguro', async () => {
    await AsyncStorage.setItem('pawcare.server_url', 'https://vieja.example.com');
    await loadServerUrl();
    expect(getApiBaseUrl()).toBe('https://vieja.example.com');
    expect(await SecureStore.getItemAsync('pawcare.server_url')).toBe(
      'https://vieja.example.com',
    );
    expect(await AsyncStorage.getItem('pawcare.server_url')).toBeNull();
  });
});
