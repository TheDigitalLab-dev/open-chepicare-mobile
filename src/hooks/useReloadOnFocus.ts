/**
 * Recarga los datos de una pantalla al VOLVER a ella (tras editar, registrar
 * un pago…). El primer foco se omite: coincide con el montaje, donde
 * `useAsync`/`usePaginatedList` ya hacen la carga inicial (antes cada pantalla
 * pedía todo dos veces al abrirse y la respuesta más lenta podía ganar).
 */
import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useReloadOnFocus(reload: () => Promise<unknown> | void): void {
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void reload();
    }, [reload]),
  );
}
