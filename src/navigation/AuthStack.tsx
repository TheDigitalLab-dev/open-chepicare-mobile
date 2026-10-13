import { useCallback, useState } from 'react';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import {
  ForgotPasswordScreen,
  LoginScreen,
  PairingScanScreen,
  RegisterScreen,
  ResetPasswordScreen,
  ServerSettingsScreen,
  WelcomeScreen,
} from '@/screens/auth';
import type { OwnerRegistration } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/types/api';
import { forgotPasswordErrorMessage, loginErrorMessage } from '@/utils/authErrors';
import { registerErrorMessage } from '@/utils/registration';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type Nav = NativeStackNavigationProp<AuthStackParamList>;

/** Toma el primer mensaje por campo de un `ApiError` 422. */
function firstFieldErrors(
  err: unknown,
): Partial<Record<keyof OwnerRegistration, string>> {
  if (!(err instanceof ApiError) || !err.fieldErrors) return {};
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(err.fieldErrors)) {
    if (messages.length > 0) out[key] = messages[0]!;
  }
  return out as Partial<Record<keyof OwnerRegistration, string>>;
}

function messageFrom(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function WelcomeRoute() {
  const navigation = useNavigation<Nav>();
  return (
    <WelcomeScreen
      onLogin={() => navigation.navigate('Login')}
      onRegister={() => navigation.navigate('Register')}
      onOpenServerSettings={() => navigation.navigate('ServerSettings')}
    />
  );
}

function LoginRoute() {
  const navigation = useNavigation<Nav>();
  const { signIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const onSubmit = useCallback(
    async ({ login, password }: { login: string; password: string }) => {
      setSubmitting(true);
      setErrorMessage(undefined);
      try {
        // Al tener éxito, el rol cambia y RootNavigator monta el árbol del rol.
        await signIn(login, password);
      } catch (err) {
        // 401 = credenciales inválidas o cuenta eliminada (mensaje genérico que
        // no revela si existe); "inactiva" y el límite de intentos sí se dicen.
        setErrorMessage(loginErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
    },
    [signIn],
  );

  return (
    <LoginScreen
      onSubmit={onSubmit}
      submitting={submitting}
      errorMessage={errorMessage}
      onForgotPassword={() => navigation.navigate('ForgotPassword')}
      onCreateAccount={() => navigation.navigate('Register')}
      onOpenServerSettings={() => navigation.navigate('ServerSettings')}
      onScanPairingQr={() => navigation.navigate('PairingScan')}
    />
  );
}

function RegisterRoute() {
  const navigation = useNavigation<Nav>();
  const { register } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] =
    useState<Partial<Record<keyof OwnerRegistration, string>>>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const onSubmit = useCallback(
    async (data: OwnerRegistration) => {
      setSubmitting(true);
      setFieldErrors(undefined);
      setErrorMessage(undefined);
      try {
        await register(data);
      } catch (err) {
        // Por campo (422) junto a cada campo; lo demás, en un aviso general.
        setFieldErrors(firstFieldErrors(err));
        setErrorMessage(registerErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
    },
    [register],
  );

  return (
    <RegisterScreen
      onBack={navigation.goBack}
      onSubmit={onSubmit}
      submitting={submitting}
      fieldErrors={fieldErrors}
      errorMessage={errorMessage}
    />
  );
}

function ForgotPasswordRoute() {
  const navigation = useNavigation<Nav>();
  const { forgotPassword } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const onSubmit = useCallback(
    async (email: string) => {
      setSubmitting(true);
      setErrorMessage(undefined);
      try {
        await forgotPassword(email);
        // El backend responde 200 aunque el correo no exista; mensaje genérico.
        setSent(true);
      } catch (err) {
        // 429 / sin red se informan; cualquier otro error no revela la cuenta.
        const message = forgotPasswordErrorMessage(err);
        if (message) setErrorMessage(message);
        else setSent(true);
      } finally {
        setSubmitting(false);
      }
    },
    [forgotPassword],
  );

  return (
    <ForgotPasswordScreen
      onBack={navigation.goBack}
      onSubmit={onSubmit}
      submitting={submitting}
      sent={sent}
      errorMessage={errorMessage}
    />
  );
}

function ResetPasswordRoute() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<AuthStackParamList, 'ResetPassword'>>();
  const { resetPassword } = useAuth();
  const token = route.params?.token;
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const onSubmit = useCallback(
    async ({
      password,
      passwordConfirmation,
    }: {
      password: string;
      passwordConfirmation: string;
    }) => {
      if (!token) {
        setErrorMessage('Enlace inválido o expirado.');
        return;
      }
      setSubmitting(true);
      setErrorMessage(undefined);
      try {
        await resetPassword(token, password, passwordConfirmation);
        navigation.navigate('Login');
      } catch (err) {
        setErrorMessage(messageFrom(err, 'No se pudo restablecer la contraseña.'));
      } finally {
        setSubmitting(false);
      }
    },
    [token, resetPassword, navigation],
  );

  return (
    <ResetPasswordScreen
      token={token}
      onBack={navigation.goBack}
      onSubmit={onSubmit}
      submitting={submitting}
      errorMessage={errorMessage}
    />
  );
}

export function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeRoute} />
      <Stack.Screen name="Login" component={LoginRoute} />
      <Stack.Screen name="Register" component={RegisterRoute} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordRoute} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordRoute} />
      <Stack.Screen name="ServerSettings" component={ServerSettingsScreen} />
      <Stack.Screen name="PairingScan" component={PairingScanScreen} />
    </Stack.Navigator>
  );
}
