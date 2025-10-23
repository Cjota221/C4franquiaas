import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Script from 'next/script';
import LojaHeader from '@/components/loja/LojaHeader';
import LojaFooter from '@/components/loja/LojaFooter';
import { LojaProvider, type LojaInfo } from '@/contexts/LojaContext';

async function getLojaInfo(dominio: string): Promise<LojaInfo | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/loja/${dominio}/info`, {
      cache: 'no-store' // Sempre buscar dados frescos
    });
    
    if (!res.ok) {
      console.error(`[Layout] Erro ao buscar loja ${dominio}:`, res.status);
      return null;
    }
    
    const json = await res.json();
    console.log(`[Layout] Loja carregada: ${json.loja?.nome}`);
    return json.loja;
  } catch (error) {
    console.error('[Layout] Erro ao carregar loja:', error);
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
  const { dominio } = await params;
  const loja = await getLojaInfo(dominio);

  if (!loja || !loja.ativo) {
    notFound();
  }

  return (
    <html lang="pt-BR">
      <head>
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
      </head>

      <body className="min-h-screen flex flex-col">
        <LojaProvider loja={loja}>
          <LojaHeader dominio={dominio} />
          
          <main className="flex-1">
            {children}
          </main>
          
          <LojaFooter />
        </LojaProvider>
      </body>
    </html>
  );
}
