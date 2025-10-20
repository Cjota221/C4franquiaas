"use client";

import { useSearchParams } from 'next/navigation';
import Script from 'next/script';

/**
 * Este componente é responsável por injetar o script de depuração do layout
 * de forma condicional, com base na presença do parâmetro `debug_layout=1` na URL.
 * 
 * Ele usa o hook `useSearchParams`, que só pode ser usado em Componentes Cliente.
 * Isso resolve o erro de build anterior, onde `searchParams` foi passado incorretamente
 * para o RootLayout (um Componente de Servidor).
 */
export default function DebugScriptInjector() {
  const searchParams = useSearchParams();
  const isDebugMode = searchParams.get('debug_layout') === '1';

  if (!isDebugMode) {
    return null;
  }

  return <Script src="/debug-tools/debug-layout.js" strategy="lazyOnload" />;
}
