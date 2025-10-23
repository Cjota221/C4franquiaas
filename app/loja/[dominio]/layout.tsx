import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Script from 'next/script';
import LojaHeader from '@/components/loja/LojaHeader';
import LojaFooter from '@/components/loja/LojaFooter';
import { LojaProvider, type LojaInfo } from '@/contexts/LojaContext';

async function getLojaInfo(dominio: string): Promise<LojaInfo | null> {
  try {
    console.log('[DEBUG Layout] 1. Iniciando busca da loja:', dominio);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log('[DEBUG Layout] 2. Base URL:', baseUrl);
    
    const url = `${baseUrl}/api/loja/${dominio}/info`;
    console.log('[DEBUG Layout] 3. URL completa:', url);
    
    const res = await fetch(url, {
      cache: 'no-store' // Sempre buscar dados frescos
    });
    
    console.log('[DEBUG Layout] 4. Response status:', res.status);
    
    if (!res.ok) {
      console.error(`[DEBUG Layout] 5. ERRO - Status não OK:`, res.status, res.statusText);
      const text = await res.text();
      console.error('[DEBUG Layout] 6. Response body:', text);
      return null;
    }
    
    const json = await res.json();
    console.log('[DEBUG Layout] 7. JSON recebido:', JSON.stringify(json, null, 2));
    console.log(`[DEBUG Layout] 8. Loja carregada com sucesso: ${json.loja?.nome}`);
    return json.loja;
  } catch (error) {
    console.error('[DEBUG Layout] 9. EXCEÇÃO capturada:', error);
    console.error('[DEBUG Layout] 10. Stack:', error instanceof Error ? error.stack : 'N/A');
    return null;
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ dominio: string }>;
}): Promise<Metadata> {
  const { dominio } = await params;
  const loja = await getLojaInfo(dominio);
  
  if (!loja) {
    return {
      title: 'Loja não encontrada',
      description: 'A loja que você procura não está disponível.'
    };
  }

  return {
    title: loja.meta_title || loja.nome,
    description: loja.meta_description || loja.descricao || `Loja online de ${loja.nome}`,
    icons: loja.favicon ? [{ url: loja.favicon }] : undefined,
  };
}

export default async function LojaLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ dominio: string }>;
}) {
  console.log('[DEBUG Layout] A. LojaLayout chamado');
  const { dominio } = await params;
  console.log('[DEBUG Layout] B. Domínio extraído dos params:', dominio);
  
  const loja = await getLojaInfo(dominio);
  console.log('[DEBUG Layout] C. Loja retornada:', loja ? 'SIM' : 'NULL');
  console.log('[DEBUG Layout] D. Loja ativa?', loja?.ativo);

  if (!loja || !loja.ativo) {
    console.error('[DEBUG Layout] E. CHAMANDO notFound() - Loja:', loja ? 'existe mas inativa' : 'não existe');
    notFound();
  }
  
  console.log('[DEBUG Layout] F. Continuando com renderização...');

  return (
    <>
      {/* CSS Variables para cores */}
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --cor-primaria: ${loja.cor_primaria};
            --cor-secundaria: ${loja.cor_secundaria};
            --cor-texto: ${loja.cor_texto};
            --cor-fundo: ${loja.cor_fundo};
            --cor-botao: ${loja.cor_botao};
            --cor-botao-hover: ${loja.cor_botao_hover};
            --cor-link: ${loja.cor_link};
          }
          
          body {
            font-family: '${loja.fonte_principal}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: var(--cor-texto);
            background-color: var(--cor-fundo);
          }
          
          h1, h2, h3, h4, h5, h6 {
            font-family: '${loja.fonte_secundaria}', '${loja.fonte_principal}', sans-serif;
          }
        `
      }} />

      {/* Google Analytics */}
      {loja.google_analytics && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${loja.google_analytics}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${loja.google_analytics}');
            `}
          </Script>
        </>
      )}

      {/* Facebook Pixel */}
      {loja.facebook_pixel && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${loja.facebook_pixel}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      <LojaProvider loja={loja}>
        <div className="min-h-screen flex flex-col">
          <LojaHeader dominio={dominio} />
          
          <main className="flex-1">
            {children}
          </main>
          
          <LojaFooter />
        </div>
      </LojaProvider>
    </>
  );
}
