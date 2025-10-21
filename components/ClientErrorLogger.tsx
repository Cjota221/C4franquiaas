"use client";

import { useEffect } from 'react';

// Função auxiliar para extrair informações úteis de qualquer tipo de erro
function serializeError(error: unknown): Record<string, unknown> {
  if (!error) {
    return { type: 'null_or_undefined', value: String(error) };
  }

  // Se for Error padrão
  if (error instanceof Error) {
    return {
      type: 'Error',
      name: error.name,
      message: error.message,
      stack: error.stack?.slice(0, 3000),
      ...extractErrorProperties(error),
    };
  }

  // Se for string
  if (typeof error === 'string') {
    return { type: 'string', message: error };
  }

  // Se for objeto
  if (typeof error === 'object') {
    try {
      const obj = error as Record<string, unknown>;
      return {
        type: 'object',
        constructor: obj.constructor?.name || 'Object',
        message: obj.message || obj.msg || obj.error || obj.description,
        code: obj.code || obj.statusCode || obj.status,
        details: obj.details || obj.data,
        // Tentar serializar como JSON (com limite)
        json: JSON.stringify(error, null, 2).slice(0, 2000),
        keys: Object.keys(error),
      };
    } catch {
      return {
        type: 'object_non_serializable',
        toString: String(error),
      };
    }
  }

  // Outros tipos (number, boolean, etc)
  return {
    type: typeof error,
    value: String(error),
  };
}

// Extrai propriedades customizadas de objetos Error
function extractErrorProperties(error: Error): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const errorObj = error as unknown as Record<string, unknown>;
  
  // Propriedades comuns de erros customizados
  const customProps = ['statusCode', 'code', 'response', 'request', 'config', 'data'];
  
  for (const prop of customProps) {
    if (prop in errorObj && errorObj[prop] !== undefined) {
      try {
        // Tentar serializar, mas limitar tamanho
        if (typeof errorObj[prop] === 'object') {
          props[prop] = JSON.stringify(errorObj[prop], null, 2).slice(0, 1000);
        } else {
          props[prop] = errorObj[prop];
        }
      } catch {
        props[prop] = String(errorObj[prop]).slice(0, 500);
      }
    }
  }
  
  return props;
}

export default function ClientErrorLogger(): null {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      try {
        console.group('❌ ClientErrorLogger: window.onerror');
        console.error('📋 Error Details:', {
          message: event.message || '(no message)',
          filename: event.filename || '(unknown)',
          line: event.lineno || 0,
          column: event.colno || 0,
          timestamp: new Date().toISOString(),
        });
        
        if (event.error) {
          console.error('🔍 Error Object:', serializeError(event.error));
        } else {
          console.warn('⚠️ No error object available');
        }
        
        console.groupEnd();
      } catch (loggingError) {
        // Fallback caso o próprio logging falhe
        console.error('ClientErrorLogger: Failed to log error', loggingError);
        console.error('ClientErrorLogger: Original event', event);
      }
    }

    function onRejection(ev: PromiseRejectionEvent) {
      try {
        console.group('❌ ClientErrorLogger: unhandledrejection');
        console.error('📋 Rejection Details:', {
          timestamp: new Date().toISOString(),
          promise: String(ev.promise),
        });
        
        console.error('🔍 Rejection Reason:', serializeError(ev.reason));
        
        console.groupEnd();
      } catch (loggingError) {
        // Fallback caso o próprio logging falhe
        console.error('ClientErrorLogger: Failed to log rejection', loggingError);
        console.error('ClientErrorLogger: Original event', ev);
      }
    }

    // Capturar erros do React (Error Boundaries)
    const originalConsoleError = console.error;
    console.error = function(...args: unknown[]) {
      // Detectar erros do React
      if (args.length > 0 && typeof args[0] === 'string') {
        const message = args[0];
        if (
          message.includes('React') || 
          message.includes('component') || 
          message.includes('render')
        ) {
          console.group('⚛️ ClientErrorLogger: React Error');
          originalConsoleError.apply(console, args);
          console.groupEnd();
          return;
        }
      }
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection as EventListener);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection as EventListener);
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}
