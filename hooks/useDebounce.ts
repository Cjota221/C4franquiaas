import { useEffect, useState } from 'react';

/**
 * Hook para debounce de valores
 * Útil para busca em tempo real sem fazer requisições a cada tecla pressionada
 * 
 * @param value - O valor a ser "debounced"
 * @param delay - Delay em milissegundos (padrão: 500ms)
 * @returns O valor atrasado
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configura o timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpa o timeout se o valor mudar antes do delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
