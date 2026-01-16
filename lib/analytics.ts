'use client'

// Hook e funções para tracking de analytics
// Usar em qualquer componente da loja

// Função global para enviar eventos ao GA4
export function trackGA4Event(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
    console.debug(`📊 GA4 Event: ${eventName}`, params)
  }
}

// Função para trackear clique no WhatsApp
export function trackWhatsAppClick(params: {
  loja_nome: string
  loja_dominio: string
  loja_id?: string
  produto_nome?: string
  produto_id?: string
  produto_preco?: number
  origem?: string // 'pdp', 'carrinho', 'checkout', 'flutuante'
}) {
  // GA4
  trackGA4Event('whatsapp_click', {
    method: 'whatsapp',
    ...params
  })

  // Evento de conversão/lead
  trackGA4Event('generate_lead', {
    currency: 'BRL',
    value: params.produto_preco || 0,
    ...params
  })

  // API interna
  const sessionId = typeof window !== 'undefined' 
    ? sessionStorage.getItem('analytics_session_id') 
    : null

  if (sessionId && params.loja_id) {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'whatsapp_click',
        session_id: sessionId,
        loja_id: params.loja_id,
        produto_id: params.produto_id,
        produto_nome: params.produto_nome,
        metadata: {
          origem: params.origem,
          loja_nome: params.loja_nome
        }
      })
    }).catch(console.debug)
  }
}

// Função para trackear adição ao carrinho (mais detalhada)
export function trackAddToCart(params: {
  loja_nome: string
  loja_dominio: string
  loja_id: string
  produto_id: string
  produto_nome: string
  produto_preco: number
  quantidade: number
  variacao?: string
}) {
  // GA4 - Evento padrão de e-commerce
  trackGA4Event('add_to_cart', {
    currency: 'BRL',
    value: params.produto_preco * params.quantidade,
    items: [{
      item_id: params.produto_id,
      item_name: params.produto_nome,
      price: params.produto_preco,
      quantity: params.quantidade,
      item_variant: params.variacao,
      item_brand: params.loja_nome
    }],
    loja_nome: params.loja_nome,
    loja_dominio: params.loja_dominio
  })
}

// Função para trackear visualização de produto
export function trackProductView(params: {
  loja_nome: string
  loja_dominio: string
  loja_id: string
  produto_id: string
  produto_nome: string
  produto_preco: number
  produto_categoria?: string
}) {
  // GA4 - Evento padrão de e-commerce
  trackGA4Event('view_item', {
    currency: 'BRL',
    value: params.produto_preco,
    items: [{
      item_id: params.produto_id,
      item_name: params.produto_nome,
      price: params.produto_preco,
      item_category: params.produto_categoria,
      item_brand: params.loja_nome
    }],
    loja_nome: params.loja_nome,
    loja_dominio: params.loja_dominio
  })
}

// Função para trackear início do checkout
export function trackBeginCheckout(params: {
  loja_nome: string
  loja_dominio: string
  loja_id: string
  cart_total: number
  items_count: number
  items: Array<{
    id: string
    nome: string
    preco: number
    quantidade: number
  }>
}) {
  // GA4 - Evento padrão de e-commerce
  trackGA4Event('begin_checkout', {
    currency: 'BRL',
    value: params.cart_total,
    items: params.items.map(item => ({
      item_id: item.id,
      item_name: item.nome,
      price: item.preco,
      quantity: item.quantidade,
      item_brand: params.loja_nome
    })),
    loja_nome: params.loja_nome,
    loja_dominio: params.loja_dominio
  })
}

// Função para trackear compra finalizada
export function trackPurchase(params: {
  loja_nome: string
  loja_dominio: string
  loja_id: string
  order_id: string
  total: number
  items: Array<{
    id: string
    nome: string
    preco: number
    quantidade: number
  }>
  payment_method?: string
}) {
  // GA4 - Evento de conversão
  trackGA4Event('purchase', {
    currency: 'BRL',
    value: params.total,
    transaction_id: params.order_id,
    items: params.items.map(item => ({
      item_id: item.id,
      item_name: item.nome,
      price: item.preco,
      quantity: item.quantidade,
      item_brand: params.loja_nome
    })),
    loja_nome: params.loja_nome,
    loja_dominio: params.loja_dominio,
    payment_method: params.payment_method
  })
}

// Função para trackear busca
export function trackSearch(params: {
  loja_nome: string
  loja_dominio: string
  loja_id: string
  search_term: string
  results_count: number
}) {
  trackGA4Event('search', {
    search_term: params.search_term,
    results_count: params.results_count,
    loja_nome: params.loja_nome,
    loja_dominio: params.loja_dominio
  })
}

// Declarar gtag no window
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

// ============================================================
// USER ID TRACKING - Para identificar franqueadas no GA4
// ============================================================

const GA_MEASUREMENT_ID = 'G-Q1TM0EYRBN';

// Armazena o User ID atual em memória
let currentUserId: string | null = null;
let currentUserName: string | null = null;

// Tipos de eventos do painel
export type PainelEventName = 
  | 'painel_dashboard_view'
  | 'painel_produtos_view'
  | 'painel_personalizacao_view'
  | 'painel_promocoes_view'
  | 'painel_carrinhos_view'
  | 'painel_academy_view'
  | 'painel_tutoriais_view'
  | 'painel_configuracoes_view'
  | 'painel_material_view'
  | 'personalizacao_salva'
  | 'produto_margem_editada'
  | 'produto_ativado'
  | 'produto_desativado'
  | 'promocao_criada'
  | 'banner_atualizado'
  | 'logo_atualizada'
  | 'cores_atualizadas'
  | 'loja_compartilhada'
  | 'login_sucesso'
  | 'logout';

/**
 * Verifica se gtag está disponível
 */
function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Aguarda gtag estar disponível
 */
function waitForGtag(callback: () => void, maxAttempts = 20): void {
  let attempts = 0;
  
  const check = () => {
    if (isGtagAvailable()) {
      callback();
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(check, 100);
    }
  };
  
  check();
}

/**
 * Define o User ID no GA4
 * Deve ser chamado após o login ou quando o usuário é identificado
 * 
 * @example
 * // Após login bem-sucedido
 * setGaUserId(reseller.id, reseller.name);
 * 
 * // Após logout
 * setGaUserId(null);
 */
export function setGaUserId(userId: string | null, userName?: string | null): void {
  currentUserId = userId;
  currentUserName = userName || null;
  
  waitForGtag(() => {
    if (userId) {
      // Configurar User ID no GA4
      window.gtag('config', GA_MEASUREMENT_ID, {
        user_id: userId,
        user_properties: {
          franqueada_id: userId,
          franqueada_nome: userName || 'Não identificada',
        }
      });
      
      // Enviar evento de identificação
      window.gtag('event', 'user_identified', {
        user_id: userId,
        franqueada_id: userId,
        franqueada_nome: userName || '',
      });
      
      console.log(`✅ GA4: User ID configurado: ${userId}`, userName ? `(${userName})` : '');
    } else {
      // Limpar User ID (logout)
      window.gtag('config', GA_MEASUREMENT_ID, {
        user_id: null,
        user_properties: {
          franqueada_id: null,
          franqueada_nome: null,
        }
      });
      
      console.log('🚪 GA4: User ID removido (logout)');
    }
  });
}

/**
 * Obtém o User ID atual
 */
export function getCurrentUserId(): string | null {
  return currentUserId;
}

/**
 * Envia evento de page_view com User ID
 */
export function trackPageViewWithUser(
  pagePath: string, 
  pageTitle?: string,
  additionalParams?: Record<string, unknown>
): void {
  waitForGtag(() => {
    const params: Record<string, unknown> = {
      page_path: pagePath,
      page_title: pageTitle || document.title,
      page_location: window.location.origin + pagePath,
      ...additionalParams,
    };
    
    if (currentUserId) {
      params.user_id = currentUserId;
      params.franqueada_id = currentUserId;
      params.franqueada_nome = currentUserName || '';
    }
    
    window.gtag('event', 'page_view', params);
    
    console.log(`📊 GA4 Page View: ${pagePath}`, currentUserId ? `[User: ${currentUserId}]` : '[Anônimo]');
  });
}

/**
 * Envia evento customizado do painel com User ID
 * 
 * @example
 * trackPainelEvent('personalizacao_salva', { secao: 'cores' });
 */
export function trackPainelEvent(
  eventName: PainelEventName,
  additionalParams?: Record<string, unknown>
): void {
  waitForGtag(() => {
    const params: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      ...additionalParams,
    };
    
    if (currentUserId) {
      params.user_id = currentUserId;
      params.franqueada_id = currentUserId;
      params.franqueada_nome = currentUserName || '';
    }
    
    window.gtag('event', eventName, params);
    
    console.log(`📊 GA4 Painel Event: ${eventName}`, params);
  });
}

/**
 * Mapeia pathname para evento de view do painel
 */
export function getViewEventFromPath(pathname: string): PainelEventName | null {
  const pathMap: Record<string, PainelEventName> = {
    '/revendedora/dashboard': 'painel_dashboard_view',
    '/revendedora/produtos': 'painel_produtos_view',
    '/revendedora/personalizacao': 'painel_personalizacao_view',
    '/revendedora/promocoes': 'painel_promocoes_view',
    '/revendedora/carrinhos-abandonados': 'painel_carrinhos_view',
    '/revendedora/academy': 'painel_academy_view',
    '/revendedora/tutoriais': 'painel_tutoriais_view',
    '/revendedora/configuracoes': 'painel_configuracoes_view',
    '/revendedora/material-divulgacao': 'painel_material_view',
  };
  
  return pathMap[pathname] || null;
}

