import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Script from 'next/script';
import LojaHeader from '@/components/loja/LojaHeader';
import LojaHeaderMobile from '@/components/loja/LojaHeaderMobile';
import LojaFooter from '@/components/loja/LojaFooter';
import WhatsAppFlutuante from '@/components/loja/WhatsAppFlutuante';
import { LojaProvider, type LojaInfo } from '@/contexts/LojaContext';
import { createClient } from '@supabase/supabase-js';

// Busca diretamente no Supabase (evita fetch para API interna em Server Component)
async function getLojaInfo(dominio: string): Promise<LojaInfo | null> {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('[getLojaInfo] Variáveis de ambiente Supabase ausentes');
      return null;
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: loja, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('dominio', dominio)
      .eq('ativo', true)
      .single();

    if (error || !loja) {
      console.error(`[getLojaInfo] Loja não encontrada ou erro no Supabase para dominio: ${dominio}`, error);
      return null;
    }

    return {
      id: loja.id,
      nome: loja.nome,
      dominio: loja.dominio,
      logo: loja.logo,
      slogan: loja.slogan,
      descricao: loja.descricao,
      favicon: loja.favicon,
      cor_primaria: loja.cor_primaria || '#DB1472',
      cor_secundaria: loja.cor_secundaria || '#F8B81F',
      cor_texto: loja.cor_texto || '#1F2937',
      cor_fundo: loja.cor_fundo || '#FFFFFF',
      cor_botao: loja.cor_botao || '#DB1472',
      cor_botao_hover: loja.cor_botao_hover || '#B01059',
      cor_link: loja.cor_link || '#DB1472',
      fonte_principal: loja.fonte_principal || 'Inter',
      fonte_secundaria: loja.fonte_secundaria || 'Inter',
      banner_hero: loja.banner_hero,
      texto_hero: loja.texto_hero || loja.nome,
      subtexto_hero: loja.subtexto_hero || loja.descricao,
      banner_secundario: loja.banner_secundario,
      mensagens_regua: loja.mensagens_regua || null,
      icones_confianca: loja.icones_confianca || null,
      menu_tipo: loja.menu_tipo || 'horizontal',
      logo_posicao: loja.logo_posicao || 'esquerda',
      logo_formato: loja.logo_formato || 'horizontal',
      topo_flutuante: loja.topo_flutuante ?? true,
      mostrar_icones_menu: loja.mostrar_icones_menu ?? true,
  barra_topo_texto: loja.barra_topo_texto || null,
  barra_topo_ativa: loja.barra_topo_ativa ?? true,
  barra_topo_cor: loja.barra_topo_cor || loja.cor_primaria,
  barra_topo_texto_cor: loja.barra_topo_texto_cor || '#FFFFFF',
  barra_topo_font_size: loja.barra_topo_font_size ?? 14,
  barra_topo_speed: loja.barra_topo_speed ?? 50,
      // Customização da Logo (Migration 017)
      logo_largura_max: loja.logo_largura_max ?? 280,
      logo_altura_max: loja.logo_altura_max ?? 80,
      logo_padding: loja.logo_padding ?? 0,
      logo_fundo_tipo: loja.logo_fundo_tipo || 'transparente',
      logo_fundo_cor: loja.logo_fundo_cor || null,
      logo_border_radius: loja.logo_border_radius ?? 0,
      logo_mostrar_sombra: loja.logo_mostrar_sombra ?? false,
      whatsapp: loja.whatsapp,
      instagram: loja.instagram,
      facebook: loja.facebook,
      email_contato: loja.email_contato,
      telefone: loja.telefone,
      endereco: loja.endereco,
      meta_title: loja.meta_title || loja.nome,
      meta_description: loja.meta_description || loja.descricao,
      google_analytics: loja.google_analytics,
      facebook_pixel: loja.facebook_pixel,
      ativo: loja.ativo,
      produtos_ativos: loja.produtos_ativos,
      mostrar_estoque: loja.mostrar_estoque ?? true,
      mostrar_codigo_barras: loja.mostrar_codigo_barras ?? false,
      permitir_carrinho: loja.permitir_carrinho ?? true,
      modo_catalogo: loja.modo_catalogo ?? false,
      mensagem_whatsapp: loja.mensagem_whatsapp || 'Olá! Gostaria de saber mais sobre este produto:',
      whatsapp_flutuante: loja.whatsapp_flutuante ?? true,
      whatsapp_numero: loja.whatsapp_numero || loja.whatsapp,
      whatsapp_posicao: loja.whatsapp_posicao || 'direita',
      whatsapp_mensagem_padrao: loja.whatsapp_mensagem_padrao || 'Olá! Gostaria de mais informações sobre os produtos da loja.',
    } as LojaInfo;

  } catch (error) {
    console.error(`[getLojaInfo] Exceção capturada ao buscar loja: ${dominio}`, error);
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
          {/* Header Desktop - Oculto em mobile */}
          <div className="desktop-only">
            <LojaHeader dominio={dominio} />
          </div>

          {/* Header Mobile - Apenas em mobile */}
          <div className="mobile-only">
            <LojaHeaderMobile dominio={dominio} />
          </div>
          
          <main className="flex-1">
            {children}
          </main>
          
          <LojaFooter />
          <WhatsAppFlutuante />
        </div>
      </LojaProvider>
    </>
  );
}
