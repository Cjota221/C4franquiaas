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
