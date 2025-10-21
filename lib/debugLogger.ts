/**
 * Debug Logger - Sistema de logging detalhado para debugging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'trace';

interface DebugLogOptions {
  level?: LogLevel;
  context?: string;
  data?: unknown;
  stack?: boolean;
}

class DebugLogger {
  private enabled: boolean;
  private contexts: Set<string>;

  constructor() {
    // Habilita debug em desenvolvimento ou quando DEBUG_MODE=true
    this.enabled = process.env.NODE_ENV === 'development' || 
                   process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
    this.contexts = new Set();
  }

  private getTimestamp(): string {
    return new Date().toISOString().split('T')[1].slice(0, -1);
  }

  private getEmoji(level: LogLevel): string {
    const emojis = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🐛',
      trace: '🔍'
    };
    return emojis[level] || '📝';
  }

  log(message: string, options: DebugLogOptions = {}) {
    if (!this.enabled) return;

    const { level = 'info', context = 'general', data, stack = false } = options;
    const emoji = this.getEmoji(level);
    const timestamp = this.getTimestamp();
    const prefix = `${emoji} [${timestamp}] [${context}]`;

    // Log principal
    console.log(`${prefix} ${message}`);

    // Log de dados adicionais
    if (data !== undefined) {
      console.log(`${prefix} Data:`, this.serializeData(data));
    }

    // Stack trace se solicitado
    if (stack && level === 'error') {
      console.trace(`${prefix} Stack trace:`);
    }

    // Registra contexto
    this.contexts.add(context);
  }

  group(name: string, context?: string) {
    if (!this.enabled) return;
    const prefix = context ? `[${context}]` : '';
    console.group(`🔽 ${prefix} ${name}`);
  }

  groupEnd() {
    if (!this.enabled) return;
    console.groupEnd();
  }

  info(message: string, context?: string, data?: unknown) {
    this.log(message, { level: 'info', context, data });
  }

  warn(message: string, context?: string, data?: unknown) {
    this.log(message, { level: 'warn', context, data });
  }

  error(message: string, context?: string, data?: unknown, stack = true) {
    this.log(message, { level: 'error', context, data, stack });
  }

  debug(message: string, context?: string, data?: unknown) {
    this.log(message, { level: 'debug', context, data });
  }

  trace(message: string, context?: string, data?: unknown) {
    this.log(message, { level: 'trace', context, data });
  }

  private serializeData(data: unknown): unknown {
    try {
      // Tenta serializar para detectar problemas
      JSON.stringify(data);
      return data;
    } catch {
      return {
        error: 'Failed to serialize',
        type: typeof data,
        constructor: (data as Record<string, unknown>)?.constructor?.name,
        keys: data ? Object.keys(data as Record<string, unknown>) : [],
      };
    }
  }

  // Método para logar estado de componente
  componentState(componentName: string, state: Record<string, unknown>) {
    if (!this.enabled) return;
    
    this.group(`Component State: ${componentName}`, 'component');
    Object.entries(state).forEach(([key, value]) => {
      console.log(`  ${key}:`, this.serializeData(value));
    });
    this.groupEnd();
  }

  // Método para logar chamadas de API
  apiCall(method: string, url: string, data?: unknown) {
    if (!this.enabled) return;
    
    this.group(`API ${method} ${url}`, 'api');
    console.log('  URL:', url);
    console.log('  Method:', method);
    if (data) console.log('  Data:', this.serializeData(data));
    console.log('  Timestamp:', this.getTimestamp());
    this.groupEnd();
  }

  apiResponse(url: string, status: number, data?: unknown) {
    if (!this.enabled) return;
    
    this.group(`API Response [${status}] ${url}`, 'api');
    console.log(`  Status: ${status}`);
    if (data) console.log('  Data:', this.serializeData(data));
    this.groupEnd();
  }

  // Relatório de contextos usados
  getContexts(): string[] {
    return Array.from(this.contexts);
  }

  enable() {
    this.enabled = true;
    console.log('🐛 Debug Logger ENABLED');
  }

  disable() {
    this.enabled = false;
    console.log('🔇 Debug Logger DISABLED');
  }
}

// Instância singleton
export const debugLogger = new DebugLogger();

// Exports para uso direto
export const debug = debugLogger.debug.bind(debugLogger);
export const info = debugLogger.info.bind(debugLogger);
export const warn = debugLogger.warn.bind(debugLogger);
export const error = debugLogger.error.bind(debugLogger);
export const trace = debugLogger.trace.bind(debugLogger);
export const group = debugLogger.group.bind(debugLogger);
export const groupEnd = debugLogger.groupEnd.bind(debugLogger);
