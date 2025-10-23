"use client";

import { createContext, useContext } from 'react';

export interface LojaInfo {
  // Identidade Básica
  id: string;
  nome: string;
  dominio: string;
  logo: string | null;
  slogan: string | null;
  descricao: string | null;
  favicon: string | null;
  
  // Cores
  cor_primaria: string;
  cor_secundaria: string;
  cor_texto: string;
  cor_fundo: string;
  cor_botao: string;
  cor_botao_hover: string;
  cor_link: string;
  
  // Fontes
  fonte_principal: string;
  fonte_secundaria: string;
  
  // Hero Section
  banner_hero: string | null;
  texto_hero: string;
  subtexto_hero: string | null;
  
  // Contato e Redes Sociais
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  email_contato: string | null;
  telefone: string | null;
  endereco: string | null;
  
  // SEO e Analytics
  meta_title: string;
  meta_description: string | null;
  google_analytics: string | null;
  facebook_pixel: string | null;
  
  // Configurações
  ativo: boolean;
  produtos_ativos: number;
  mostrar_estoque: boolean;
  mostrar_codigo_barras: boolean;
  permitir_carrinho: boolean;
  modo_catalogo: boolean;
  mensagem_whatsapp: string;
}

const LojaContext = createContext<LojaInfo | null>(null);

export function LojaProvider({ 
  children, 
  loja 
}: { 
  children: React.ReactNode; 
  loja: LojaInfo;
}) {
  return (
    <LojaContext.Provider value={loja}>
      {children}
    </LojaContext.Provider>
  );
}

export function useLojaInfo() {
  const context = useContext(LojaContext);
  if (!context) {
    throw new Error('useLojaInfo deve ser usado dentro de um LojaProvider');
  }
  return context;
}
