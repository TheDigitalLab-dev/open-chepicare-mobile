/**
 * Jest (jest-expo). Filosofía de pruebas del repo (ver AGENTS.md):
 *  - TDD para hooks y lógica de negocio.
 *  - Integración REAL contra el backend en ejecución (`../pawcare-web`); NADA de
 *    respuestas de API mockeadas ni data falsa.
 *  - Solo se sustituyen shims de plataforma inevitables (SecureStore,
 *    AsyncStorage), porque no existen en el entorno Node de Jest.
 */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/?(*.)+(test).ts?(x)'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@reduxjs/.*|redux-persist|@react-native-async-storage/.*))',
  ],
};
