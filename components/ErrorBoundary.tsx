"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Atualiza o estado para mostrar a UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log detalhado do erro
    console.group('🚨 ErrorBoundary: Erro capturado');
    console.error('❌ Erro:', error);
    console.error('📍 Onde:', error.stack);
    console.error('🔍 Component Stack:', errorInfo.componentStack);
    console.error('📊 Error Info:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.slice(0, 2000),
      componentStack: errorInfo.componentStack?.slice(0, 2000),
      timestamp: new Date().toISOString(),
    });
    console.groupEnd();

    // Atualizar estado
    this.setState({
      error,
      errorInfo,
    });

    // Você pode enviar para serviço de monitoramento aqui
    // Exemplo: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Renderizar UI de fallback customizada
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI padrão de erro
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          backgroundColor: '#fef2f2',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h2 style={{ color: '#dc2626', marginTop: 0 }}>
            ⚠️ Algo deu errado
          </h2>
          <p style={{ color: '#991b1b' }}>
            Ocorreu um erro ao renderizar este componente.
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#dc2626' }}>
                Ver detalhes do erro (modo desenvolvimento)
              </summary>
              <pre style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#fee2e2',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                color: '#7f1d1d',
              }}>
                <strong>Erro:</strong> {this.state.error.toString()}
                {'\n\n'}
                <strong>Stack:</strong>
                {'\n'}
                {this.state.error.stack}
                {this.state.errorInfo?.componentStack && (
                  <>
                    {'\n\n'}
                    <strong>Component Stack:</strong>
                    {'\n'}
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleReset}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🔄 Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
